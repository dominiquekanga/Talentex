import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ContractService } from '../services/contractService';

// Étendre le type Request pour inclure la propriété user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const prisma = new PrismaClient();

export class ContractController {
  /**
   * @route POST /api/contracts/generate
   * @desc Génère un contrat à partir d'un matching accepté
   * @access Private (Talents, Entreprises)
   */
  static async generateContract(req: AuthenticatedRequest, res: Response) {
    try {
      const { matchingId } = req.body;

      if (!matchingId) {
        return res.status(400).json({
          success: false,
          message: 'ID du matching requis'
        });
      }

      // Vérifier que l'utilisateur a le droit de générer ce contrat
      const matching = await prisma.matching.findUnique({
        where: { id: matchingId },
        include: {
          mission: { include: { enterprise: true } },
          talent: true
        }
      });

      if (!matching) {
        return res.status(404).json({
          success: false,
          message: 'Matching non trouvé'
        });
      }

      // Vérifier les autorisations
      const isTalent = matching.talent.userId === req.user?.id;
      const isEnterprise = matching.mission.enterprise.userId === req.user?.id;

      if (!isTalent && !isEnterprise) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      const contract = await ContractService.generateContract(matchingId);

      return res.status(201).json({
        success: true,
        data: contract,
        message: 'Contrat généré avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la génération du contrat:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * @route GET /api/contracts
   * @desc Récupère tous les contrats de l'utilisateur
   * @access Private
   */
  static async getUserContracts(req: AuthenticatedRequest, res: Response) {
    try {
      const { status, limit = 10, page = 1 } = req.query;

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      const contracts = await ContractService.getUserContracts(req.user.id, req.user.role);

      // Filtrer par statut si spécifié
      let filteredContracts = contracts;
      if (status && status !== 'all') {
        filteredContracts = contracts.filter(contract => contract.status === status);
      }

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedContracts = filteredContracts.slice(startIndex, endIndex);

      return res.status(200).json({
        success: true,
        data: {
          contracts: paginatedContracts,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(filteredContracts.length / Number(limit)),
            totalContracts: filteredContracts.length,
            hasNext: endIndex < filteredContracts.length,
            hasPrev: Number(page) > 1
          }
        },
        message: 'Contrats récupérés avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des contrats:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * @route GET /api/contracts/:id
   * @desc Récupère un contrat spécifique avec tous ses détails
   * @access Private
   */
  static async getContract(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const contract = await ContractService.getContractWithDetails(id);

      if (!contract) {
        return res.status(404).json({
          success: false,
          message: 'Contrat non trouvé'
        });
      }

      // Vérifier les autorisations
      const isTalent = contract.talent.userId === req.user?.id;
      const isEnterprise = contract.enterprise.userId === req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN';

      if (!isTalent && !isEnterprise && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      return res.status(200).json({
        success: true,
        data: contract,
        message: 'Contrat récupéré avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du contrat:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * @route POST /api/contracts/:id/sign
   * @desc Signe un contrat
   * @access Private (Talents, Entreprises)
   */
  static async signContract(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { signatureData } = req.body;

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      const contract = await ContractService.getContractWithDetails(id);

      if (!contract) {
        return res.status(404).json({
          success: false,
          message: 'Contrat non trouvé'
        });
      }

      // Déterminer le rôle du signataire
      let signerRole: 'TALENT' | 'ENTERPRISE';
      if (contract.talent.userId === req.user.id) {
        signerRole = 'TALENT';
      } else if (contract.enterprise.userId === req.user.id) {
        signerRole = 'ENTERPRISE';
      } else {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      // Signer le contrat
      await ContractService.signContract(id, req.user.id, signerRole);

      // Envoyer les notifications
      await ContractService.sendSignatureNotifications(id, signerRole);

      // Récupérer le contrat mis à jour
      const updatedContract = await ContractService.getContractWithDetails(id);

      return res.status(200).json({
        success: true,
        data: updatedContract,
        message: 'Contrat signé avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la signature du contrat:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur interne du serveur'
      });
    }
  }

  /**
   * @route PUT /api/contracts/:id/status
   * @desc Met à jour le statut d'un contrat
   * @access Private (Admin, Parties concernées)
   */
  static async updateContractStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      const contract = await ContractService.getContractWithDetails(id);

      if (!contract) {
        return res.status(404).json({
          success: false,
          message: 'Contrat non trouvé'
        });
      }

      // Vérifier les autorisations
      const isTalent = contract.talent.userId === req.user.id;
      const isEnterprise = contract.enterprise.userId === req.user.id;
      const isAdmin = req.user.role === 'ADMIN';

      if (!isTalent && !isEnterprise && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      // Statuts autorisés selon le rôle
      const allowedStatuses = ['ACTIVE', 'COMPLETED', 'CANCELLED'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Statut non autorisé'
        });
      }

      const updatedContract = await ContractService.updateContractStatus(id, status);

      return res.status(200).json({
        success: true,
        data: updatedContract,
        message: 'Statut du contrat mis à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * @route GET /api/contracts/:id/pdf
   * @desc Génère un PDF du contrat
   * @access Private
   */
  static async generateContractPDF(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const contract = await ContractService.getContractWithDetails(id);

      if (!contract) {
        return res.status(404).json({
          success: false,
          message: 'Contrat non trouvé'
        });
      }

      // Vérifier les autorisations
      const isTalent = contract.talent.userId === req.user?.id;
      const isEnterprise = contract.enterprise.userId === req.user?.id;
      const isAdmin = req.user?.role === 'ADMIN';

      if (!isTalent && !isEnterprise && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      const pdfUrl = await ContractService.generateContractPDF(id);

      return res.status(200).json({
        success: true,
        data: { pdfUrl },
        message: 'PDF généré avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * @route GET /api/contracts/stats
   * @desc Récupère les statistiques des contrats
   * @access Private (Admin)
   */
  static async getContractStats(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      const stats = await ContractService.getContractStats();

      return res.status(200).json({
        success: true,
        data: stats,
        message: 'Statistiques récupérées avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * @route POST /api/contracts/:id/rate
   * @desc Note un contrat (après completion)
   * @access Private (Talents, Entreprises)
   */
  static async rateContract(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Note invalide (doit être entre 1 et 5)'
        });
      }

      const contract = await ContractService.getContractWithDetails(id);

      if (!contract) {
        return res.status(404).json({
          success: false,
          message: 'Contrat non trouvé'
        });
      }

      // Vérifier que le contrat est terminé
      if (contract.status !== 'COMPLETED') {
        return res.status(400).json({
          success: false,
          message: 'Seuls les contrats terminés peuvent être notés'
        });
      }

      // Vérifier les autorisations
      const isTalent = contract.talent.userId === req.user.id;
      const isEnterprise = contract.enterprise.userId === req.user.id;

      if (!isTalent && !isEnterprise) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      // Mettre à jour la note
      const updatedContract = await prisma.contract.update({
        where: { id },
        data: { rating: rating }
      });

      return res.status(200).json({
        success: true,
        data: updatedContract,
        message: 'Contrat noté avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la notation du contrat:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
} 