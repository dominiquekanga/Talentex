import { PrismaClient } from '@prisma/client';
import { Contract, Mission, Talent, Enterprise } from '@prisma/client';

const prisma = new PrismaClient();

export interface ContractData {
  missionId: string;
  talentId: string;
  enterpriseId: string;
  amount: number;
  commission: number;
  netAmount: number;
  startDate: Date;
  endDate: Date;
  terms?: string;
  conditions?: string[];
}

export interface ContractSignature {
  contractId: string;
  signerId: string;
  signerRole: 'TALENT' | 'ENTERPRISE' | 'PLATFORM';
  signatureData: string;
  signedAt: Date;
}

export class ContractService {
  /**
   * Génère un contrat tripartite à partir d'un matching accepté
   */
  static async generateContract(matchingId: string): Promise<Contract> {
    const matching = await prisma.matching.findUnique({
      where: { id: matchingId },
      include: {
        mission: {
          include: { enterprise: true }
        },
        talent: true
      }
    });

    if (!matching || matching.status !== 'accepted') {
      throw new Error('Matching non trouvé ou non accepté');
    }

    const { mission, talent } = matching;
    const commission = mission.budget * 0.1; // 10% de commission
    const netAmount = mission.budget - commission;

    // Calculer les dates
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + mission.duration * 24 * 60 * 60 * 1000);

    // Générer les termes du contrat
    const terms = this.generateContractTerms(mission, talent, commission);

    const contract = await prisma.contract.create({
      data: {
        missionId: mission.id,
        talentId: talent.id,
        enterpriseId: mission.enterpriseId,
        amount: mission.budget,
        commission,
        netAmount,
        startDate,
        endDate,
        status: 'draft',
        terms
      }
    });

    // Créer les signatures initiales
    await this.createInitialSignatures(contract.id);

    return contract;
  }

  /**
   * Génère les termes du contrat
   */
  private static generateContractTerms(mission: any, talent: any, commission: number): string {
    const terms = `
# CONTRAT DE PRESTATION DE SERVICES TRIPARTITE

## PARTIES CONTRACTANTES

**TalentEx Platform** (ci-après "la Plateforme")
- Représentée par TalentEx SAS
- Adresse: [Adresse de la plateforme]
- Email: legal@talenteex.com

**${mission.enterprise.name}** (ci-après "l'Entreprise")
- Adresse: [Adresse de l'entreprise]
- Email: [Email de l'entreprise]

**${talent.firstName} ${talent.lastName}** (ci-après "le Talent")
- Email: [Email du talent]
- Domaine d'expertise: ${talent.domain.join(', ')}

## OBJET DU CONTRAT

La présente convention a pour objet la réalisation de la mission suivante :
- **Titre**: ${mission.title}
- **Description**: ${mission.description}
- **Durée**: ${mission.duration} jours
- **Budget total**: ${mission.budget.toLocaleString()}€
- **Commission plateforme**: ${commission.toLocaleString()}€ (10%)
- **Montant net talent**: ${(mission.budget - commission).toLocaleString()}€

## OBLIGATIONS DES PARTIES

### Obligations de l'Entreprise
- Payer le montant total de ${mission.budget.toLocaleString()}€ à la plateforme
- Fournir les ressources nécessaires à la réalisation de la mission
- Respecter les délais de paiement convenus

### Obligations du Talent
- Réaliser la mission selon les spécifications définies
- Respecter les délais convenus
- Maintenir un niveau de qualité professionnel

### Obligations de la Plateforme
- Assurer l'intermédiation entre les parties
- Gérer les paiements et la facturation
- Fournir un support en cas de litige

## MODALITÉS DE PAIEMENT

1. L'entreprise s'engage à payer ${mission.budget.toLocaleString()}€ à la plateforme
2. La plateforme prélève une commission de ${commission.toLocaleString()}€ (10%)
3. Le talent reçoit ${(mission.budget - commission).toLocaleString()}€ net
4. Les paiements sont effectués selon le calendrier suivant:
   - 50% à la signature du contrat
   - 50% à la livraison finale

## DURÉE ET RÉSILIATION

- **Durée**: Du ${new Date().toLocaleDateString()} au ${new Date(Date.now() + mission.duration * 24 * 60 * 60 * 1000).toLocaleDateString()}
- **Résiliation**: Chaque partie peut résilier le contrat avec un préavis de 7 jours

## CONFIDENTIALITÉ

Les parties s'engagent à maintenir la confidentialité des informations échangées dans le cadre de cette mission.

## DROIT APPLICABLE

Le présent contrat est régi par le droit français. En cas de litige, les tribunaux français sont seuls compétents.

---

**Signature électronique acceptée le ${new Date().toLocaleDateString()}**
    `;

    return terms.trim();
  }

  /**
   * Crée les signatures initiales pour un contrat
   */
  private static async createInitialSignatures(contractId: string): Promise<void> {
    // Signature de la plateforme (automatique)
    await prisma.contractSignature.create({
      data: {
        contractId,
        signerId: 'platform',
        signerRole: 'PLATFORM',
        signatureData: 'SIGNATURE_AUTOMATIQUE_PLATEFORME',
        signedAt: new Date(),
        isSigned: true
      }
    });
  }

  /**
   * Signe un contrat
   */
  static async signContract(contractId: string, signerId: string, signerRole: 'TALENT' | 'ENTERPRISE'): Promise<void> {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        signatures: true
      }
    });

    if (!contract) {
      throw new Error('Contrat non trouvé');
    }

    // Vérifier que le signataire n'a pas déjà signé
    const existingSignature = contract.signatures.find(
      sig => sig.signerId === signerId && sig.signerRole === signerRole
    );

    if (existingSignature) {
      throw new Error('Contrat déjà signé par ce signataire');
    }

    // Créer la signature
    await prisma.contractSignature.create({
      data: {
        contractId,
        signerId,
        signerRole,
        signatureData: `SIGNATURE_${signerRole}_${Date.now()}`,
        signedAt: new Date(),
        isSigned: true
      }
    });

    // Vérifier si tous les signataires ont signé
    const allSignatures = await prisma.contractSignature.findMany({
      where: { contractId }
    });

    const hasTalentSignature = allSignatures.some(sig => sig.signerRole === 'TALENT');
    const hasEnterpriseSignature = allSignatures.some(sig => sig.signerRole === 'ENTERPRISE');
    const hasPlatformSignature = allSignatures.some(sig => sig.signerRole === 'PLATFORM');

    // Si tous ont signé, activer le contrat
    if (hasTalentSignature && hasEnterpriseSignature && hasPlatformSignature) {
      await prisma.contract.update({
        where: { id: contractId },
        data: { 
          status: 'active',
          signedAt: new Date()
        }
      });
    }
  }

  /**
   * Récupère un contrat avec tous ses détails
   */
  static async getContractWithDetails(contractId: string): Promise<any> {
    return await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        mission: {
          include: { enterprise: true }
        },
        talent: {
          include: { user: true }
        },
        enterprise: {
          include: { user: true }
        },
        signatures: true,
        payments: true
      }
    });
  }

  /**
   * Récupère tous les contrats d'un utilisateur
   */
  static async getUserContracts(userId: string, userRole: string): Promise<any[]> {
    let whereClause: any = {};

    if (userRole === 'TALENT') {
      whereClause.talent = {
        userId
      };
    } else if (userRole === 'ENTERPRISE') {
      whereClause.enterprise = {
        userId
      };
    }

    return await prisma.contract.findMany({
      where: whereClause,
      include: {
        mission: {
          include: { enterprise: true }
        },
        talent: {
          include: { user: true }
        },
        signatures: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Met à jour le statut d'un contrat
   */
  static async updateContractStatus(contractId: string, status: string): Promise<Contract> {
    return await prisma.contract.update({
      where: { id: contractId },
      data: { status }
    });
  }

  /**
   * Calcule les statistiques des contrats
   */
  static async getContractStats(): Promise<any> {
    const totalContracts = await prisma.contract.count();
    const activeContracts = await prisma.contract.count({
      where: { status: 'active' }
    });
    const completedContracts = await prisma.contract.count({
      where: { status: 'completed' }
    });
    const draftContracts = await prisma.contract.count({
      where: { status: 'draft' }
    });

    const totalAmount = await prisma.contract.aggregate({
      _sum: { amount: true }
    });

    const totalCommission = await prisma.contract.aggregate({
      _sum: { commission: true }
    });

    return {
      total: totalContracts,
      active: activeContracts,
      completed: completedContracts,
      draft: draftContracts,
      totalAmount: totalAmount._sum.amount || 0,
      totalCommission: totalCommission._sum.commission || 0,
      averageAmount: totalContracts > 0 ? (totalAmount._sum.amount || 0) / totalContracts : 0
    };
  }

  /**
   * Génère un PDF du contrat (placeholder)
   */
  static async generateContractPDF(contractId: string): Promise<string> {
    // TODO: Implémenter la génération de PDF
    // Utiliser une librairie comme puppeteer ou jsPDF
    return `contract_${contractId}.pdf`;
  }

  /**
   * Envoie les notifications de signature
   */
  static async sendSignatureNotifications(contractId: string, signerRole: string): Promise<void> {
    const contract = await this.getContractWithDetails(contractId);
    
    if (!contract) return;

    // Notifier les autres parties
    const notifications = [];

    if (signerRole === 'TALENT') {
      // Notifier l'entreprise
      notifications.push({
        userId: contract.enterprise.userId,
        title: 'Contrat signé par le talent',
        message: `Le talent ${contract.talent.firstName} ${contract.talent.lastName} a signé le contrat pour la mission "${contract.mission.title}".`,
        type: 'CONTRACT_SIGNED'
      });
    } else if (signerRole === 'ENTERPRISE') {
      // Notifier le talent
      notifications.push({
        userId: contract.talent.userId,
        title: 'Contrat signé par l\'entreprise',
        message: `L'entreprise ${contract.enterprise.name} a signé le contrat pour la mission "${contract.mission.title}".`,
        type: 'CONTRACT_SIGNED'
      });
    }

    // Créer les notifications
    for (const notification of notifications) {
      await prisma.notification.create({
        data: notification
      });
    }
  }
} 