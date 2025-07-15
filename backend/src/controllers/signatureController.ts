import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SignatureService } from '../services/signatureService';
import { ApiResponse } from '../types/api';

const prisma = new PrismaClient();

export class SignatureController {
  /**
   * Initialise le processus de signature pour un contrat
   */
  static async initializeSignatures(req: Request, res: Response): Promise<void> {
    try {
      const { contractId } = req.params;
      const userId = (req as any).user.id;

      // Vérifier que l'utilisateur a accès au contrat
      const contract = await prisma.contract.findFirst({
        where: {
          id: contractId,
          OR: [
            { talent: { userId } },
            { enterprise: { userId } }
          ]
        }
      });

      if (!contract) {
        res.status(404).json({
          success: false,
          error: 'Contrat non trouvé ou accès non autorisé'
        });
        return;
      }

      const signatureStatus = await SignatureService.initializeContractSignatures(contractId);

      const response: ApiResponse = {
        success: true,
        data: signatureStatus,
        message: 'Processus de signature initialisé'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des signatures:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Signe un contrat
   */
  static async signContract(req: Request, res: Response): Promise<void> {
    try {
      const { contractId } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const { signatureData } = req.body;

      // Récupérer l'IP et l'User-Agent
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      // Mapper le rôle utilisateur au rôle de signature
      let signerRole: 'TALENT' | 'ENTERPRISE' | 'PLATFORM';
      switch (userRole) {
        case 'TALENT':
          signerRole = 'TALENT';
          break;
        case 'ENTERPRISE':
          signerRole = 'ENTERPRISE';
          break;
        case 'ADMIN':
          signerRole = 'PLATFORM';
          break;
        default:
          res.status(400).json({
            success: false,
            error: 'Rôle utilisateur non autorisé pour la signature'
          });
          return;
      }

      const success = await SignatureService.signContract(
        contractId,
        userId,
        signerRole,
        ipAddress,
        userAgent
      );

      if (success) {
        const response: ApiResponse = {
          success: true,
          message: 'Contrat signé avec succès'
        };

        res.status(200).json(response);
      } else {
        res.status(400).json({
          success: false,
          error: 'Erreur lors de la signature'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la signature du contrat:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Récupère le statut des signatures d'un contrat
   */
  static async getSignatureStatus(req: Request, res: Response): Promise<void> {
    try {
      const { contractId } = req.params;
      const userId = (req as any).user.id;

      // Vérifier que l'utilisateur a accès au contrat
      const contract = await prisma.contract.findFirst({
        where: {
          id: contractId,
          OR: [
            { talent: { userId } },
            { enterprise: { userId } }
          ]
        }
      });

      if (!contract) {
        res.status(404).json({
          success: false,
          error: 'Contrat non trouvé ou accès non autorisé'
        });
        return;
      }

      const signatureStatus = await SignatureService.getContractSignatureStatus(contractId);

      const response: ApiResponse = {
        success: true,
        data: signatureStatus,
        message: 'Statut des signatures récupéré'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération du statut des signatures:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Télécharge le PDF du contrat signé
   */
  static async downloadSignedContract(req: Request, res: Response): Promise<void> {
    try {
      const { contractId } = req.params;
      const userId = (req as any).user.id;

      // Vérifier que l'utilisateur a accès au contrat
      const contract = await prisma.contract.findFirst({
        where: {
          id: contractId,
          OR: [
            { talent: { userId } },
            { enterprise: { userId } }
          ]
        }
      });

      if (!contract) {
        res.status(404).json({
          success: false,
          error: 'Contrat non trouvé ou accès non autorisé'
        });
        return;
      }

      // Vérifier que le contrat est signé
      if (contract.status !== 'SIGNED' && contract.status !== 'COMPLETED') {
        res.status(400).json({
          success: false,
          error: 'Le contrat doit être signé pour être téléchargé'
        });
        return;
      }

      const pdfBuffer = await SignatureService.generateSignedContractPDF(contractId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="contrat-${contractId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      console.error('Erreur lors du téléchargement du contrat:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Annule une signature (admin seulement)
   */
  static async cancelSignature(req: Request, res: Response): Promise<void> {
    try {
      const { contractId, signerId, signerRole } = req.params;
      const adminUserId = (req as any).user.id;

      const success = await SignatureService.cancelSignature(
        contractId,
        signerId,
        signerRole,
        adminUserId
      );

      if (success) {
        const response: ApiResponse = {
          success: true,
          message: 'Signature annulée avec succès'
        };

        res.status(200).json(response);
      } else {
        res.status(400).json({
          success: false,
          error: 'Erreur lors de l\'annulation de la signature'
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la signature:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Vérifie la validité d'une signature
   */
  static async verifySignature(req: Request, res: Response): Promise<void> {
    try {
      const { signatureHash, contractId, signerId, timestamp } = req.body;

      if (!signatureHash || !contractId || !signerId || !timestamp) {
        res.status(400).json({
          success: false,
          error: 'Paramètres manquants pour la vérification'
        });
        return;
      }

      const isValid = SignatureService.verifySignature(
        signatureHash,
        contractId,
        signerId,
        timestamp
      );

      const response: ApiResponse = {
        success: true,
        data: { isValid },
        message: isValid ? 'Signature valide' : 'Signature invalide'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la vérification de la signature:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Récupère l'historique des signatures d'un contrat
   */
  static async getSignatureHistory(req: Request, res: Response): Promise<void> {
    try {
      const { contractId } = req.params;
      const userId = (req as any).user.id;

      // Vérifier que l'utilisateur a accès au contrat
      const contract = await prisma.contract.findFirst({
        where: {
          id: contractId,
          OR: [
            { talent: { userId } },
            { enterprise: { userId } }
          ]
        }
      });

      if (!contract) {
        res.status(404).json({
          success: false,
          error: 'Contrat non trouvé ou accès non autorisé'
        });
        return;
      }

      const signatures = await prisma.contractSignature.findMany({
        where: { contractId },
        orderBy: { signedAt: 'desc' },
        include: {
          contract: {
            include: {
              talent: true,
              enterprise: true,
              mission: true
            }
          }
        }
      });

      const response: ApiResponse = {
        success: true,
        data: { signatures },
        message: 'Historique des signatures récupéré'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des signatures:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }
} 