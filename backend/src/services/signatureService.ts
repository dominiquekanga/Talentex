import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface SignatureData {
  signerId: string;
  signerRole: 'TALENT' | 'ENTERPRISE' | 'PLATFORM';
  signatureData: string;
  signedAt: Date | null;
  isSigned: boolean;
}

export interface ContractSignature {
  contractId: string;
  signatures: SignatureData[];
  requiredSignatures: string[];
}

export class SignatureService {
  /**
   * Génère un hash unique pour la signature
   */
  static generateSignatureHash(contractId: string, signerId: string, timestamp: number): string {
    const data = `${contractId}-${signerId}-${timestamp}-${process.env.SIGNATURE_SECRET || 'talenteex-secret'}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Vérifie la validité d'une signature
   */
  static verifySignature(signatureHash: string, contractId: string, signerId: string, timestamp: number): boolean {
    const expectedHash = this.generateSignatureHash(contractId, signerId, timestamp);
    return signatureHash === expectedHash;
  }

  /**
   * Initialise le processus de signature pour un contrat
   */
  static async initializeContractSignatures(contractId: string): Promise<ContractSignature> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        talent: true,
        enterprise: true,
        mission: true
      }
    });

    if (!contract) {
      throw new Error('Contrat non trouvé');
    }

    // Définir les signatures requises (talent, entreprise, plateforme)
    const requiredSignatures = [
      { role: 'TALENT', userId: contract.talent.userId },
      { role: 'ENTERPRISE', userId: contract.enterprise.userId },
      { role: 'PLATFORM', userId: 'PLATFORM_ADMIN' } // Signature automatique de la plateforme
    ];

    // Créer les entrées de signature
    const signatures = await Promise.all(
      requiredSignatures.map(async (reqSig) => {
        const existingSignature = await prisma.contractSignature.findFirst({
          where: {
            contractId,
            signerRole: reqSig.role,
            signerId: reqSig.userId
          }
        });

        if (existingSignature) {
          return {
            signerId: reqSig.userId,
            signerRole: reqSig.role,
            signatureData: existingSignature.signatureData,
            signedAt: existingSignature.signedAt,
            isSigned: existingSignature.isSigned
          };
        }

        // Créer une nouvelle signature en attente
        const newSignature = await prisma.contractSignature.create({
          data: {
            contractId,
            signerId: reqSig.userId,
            signerRole: reqSig.role,
            signatureData: '',
            isSigned: false,
            signedAt: null
          }
        });

        return {
          signerId: reqSig.userId,
          signerRole: reqSig.role,
          signatureData: '',
          signedAt: null,
          isSigned: false
        };
      })
    );

    // Mettre à jour le statut du contrat
    await prisma.contract.update({
      where: { id: contractId },
      data: { status: 'ACTIVE' }
    });

    return {
      contractId,
      signatures,
      requiredSignatures: requiredSignatures.map(sig => sig.role)
    };
  }

  /**
   * Signe un contrat pour un utilisateur spécifique
   */
  static async signContract(
    contractId: string,
    signerId: string,
    signerRole: 'TALENT' | 'ENTERPRISE' | 'PLATFORM',
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        signatures: true
      }
    });

    if (!contract) {
      throw new Error('Contrat non trouvé');
    }

    // Vérifier que l'utilisateur peut signer ce contrat
    const canSign = this.canUserSignContract(contract, signerId, signerRole);
    if (!canSign) {
      throw new Error('Utilisateur non autorisé à signer ce contrat');
    }

    // Vérifier que le contrat n'est pas déjà signé
    if (contract.status === 'COMPLETED') {
      throw new Error('Contrat déjà signé');
    }

    // Générer la signature
    const timestamp = Date.now();
    const signatureHash = this.generateSignatureHash(contractId, signerId, timestamp);

    // Mettre à jour ou créer la signature
    await prisma.contractSignature.upsert({
      where: {
        contractId_signerId_signerRole: {
          contractId,
          signerId,
          signerRole
        }
      },
      update: {
        signatureData: signatureHash,
        isSigned: true,
        signedAt: new Date(),
        ipAddress,
        userAgent
      },
      create: {
        contractId,
        signerId,
        signerRole,
        signatureData: signatureHash,
        isSigned: true,
        signedAt: new Date(),
        ipAddress,
        userAgent
      }
    });

    // Vérifier si toutes les signatures sont complètes
    const allSignatures = await prisma.contractSignature.findMany({
      where: { contractId }
    });

    const allSigned = allSignatures.every(sig => sig.isSigned);
    
    if (allSigned) {
      // Toutes les signatures sont complètes
      await prisma.contract.update({
        where: { id: contractId },
        data: { 
          status: 'COMPLETED',
          signedAt: new Date()
        }
      });

      // Déclencher les actions post-signature
      await this.handleContractSigned(contractId);
    }

    return true;
  }

  /**
   * Vérifie si un utilisateur peut signer un contrat
   */
  static canUserSignContract(contract: any, signerId: string, signerRole: string): boolean {
    switch (signerRole) {
      case 'TALENT':
        return contract.talent.userId === signerId;
      case 'ENTERPRISE':
        return contract.enterprise.userId === signerId;
      case 'PLATFORM':
        return signerId === 'PLATFORM_ADMIN';
      default:
        return false;
    }
  }

  /**
   * Actions à effectuer après signature complète du contrat
   */
  static async handleContractSigned(contractId: string): Promise<void> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        talent: true,
        enterprise: true,
        mission: true
      }
    });

    if (!contract) return;

    // Créer les notifications
    await Promise.all([
      // Notification pour le talent
      prisma.notification.create({
        data: {
          userId: contract.talent.userId,
          type: 'CONTRACT_SIGNED',
          title: 'Contrat signé avec succès',
          message: `Votre contrat pour la mission "${contract.mission.title}" a été signé par toutes les parties.`,
          metadata: { contractId }
        }
      }),
      // Notification pour l'entreprise
      prisma.notification.create({
        data: {
          userId: contract.enterprise.userId,
          type: 'CONTRACT_SIGNED',
          title: 'Contrat signé avec succès',
          message: `Le contrat pour la mission "${contract.mission.title}" a été signé par toutes les parties.`,
          metadata: { contractId }
        }
      })
    ]);

    // Mettre à jour le statut de la mission
    await prisma.mission.update({
      where: { id: contract.missionId },
      data: { status: 'IN_PROGRESS' }
    });

    // Envoyer les notifications temps réel
    const socketService = (global as any).socketService;
    if (socketService) {
      socketService.emitToUser(contract.talent.userId, 'contract_signed', {
        contractId,
        message: 'Contrat signé avec succès'
      });
      
      socketService.emitToUser(contract.enterprise.userId, 'contract_signed', {
        contractId,
        message: 'Contrat signé avec succès'
      });
    }
  }

  /**
   * Récupère le statut des signatures d'un contrat
   */
  static async getContractSignatureStatus(contractId: string): Promise<ContractSignature> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        signatures: true,
        talent: true,
        enterprise: true
      }
    });

    if (!contract) {
      throw new Error('Contrat non trouvé');
    }

    const signatures = contract.signatures.map(sig => ({
      signerId: sig.signerId,
      signerRole: sig.signerRole,
      signatureData: sig.signatureData,
      signedAt: sig.signedAt,
      isSigned: sig.isSigned
    }));

    const requiredSignatures = ['TALENT', 'ENTERPRISE', 'PLATFORM'];
    const allSigned = signatures.every(sig => sig.isSigned);

    return {
      contractId,
      signatures,
      requiredSignatures
    };
  }

  /**
   * Génère un PDF du contrat signé
   */
  static async generateSignedContractPDF(contractId: string): Promise<Buffer> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        signatures: true,
        talent: true,
        enterprise: true,
        mission: true
      }
    });

    if (!contract) {
      throw new Error('Contrat non trouvé');
    }

    // TODO: Implémenter la génération de PDF avec une bibliothèque comme PDFKit
    // Pour l'instant, retourner un buffer vide
    const pdfContent = `
      CONTRAT TALENTEX
      
      Mission: ${contract.mission.title}
      Talent: ${contract.talent.firstName} ${contract.talent.lastName}
      Entreprise: ${contract.enterprise.name}
      Montant: ${contract.amount}€
      Commission: ${contract.commission}€
      Montant net: ${contract.netAmount}€
      
      Signatures:
      ${contract.signatures.map(sig => 
        `${sig.signerRole}: ${sig.isSigned ? 'Signé le ' + sig.signedAt?.toLocaleDateString() : 'En attente'}`
      ).join('\n')}
    `;

    return Buffer.from(pdfContent, 'utf-8');
  }

  /**
   * Annule une signature (uniquement pour les admins)
   */
  static async cancelSignature(
    contractId: string,
    signerId: string,
    signerRole: string,
    adminUserId: string
  ): Promise<boolean> {
    // Vérifier que l'utilisateur est admin
    const admin = await prisma.user.findUnique({
      where: { id: adminUserId }
    });

    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('Accès non autorisé');
    }

    await prisma.contractSignature.updateMany({
      where: {
        contractId,
        signerId,
        signerRole
      },
      data: {
        isSigned: false,
        signedAt: null,
        signatureData: ''
      }
    });

    // Mettre à jour le statut du contrat
    await prisma.contract.update({
      where: { id: contractId },
      data: { status: 'DRAFT' }
    });

    return true;
  }
} 