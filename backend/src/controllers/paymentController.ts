import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PaymentService, PaymentRequest, PaymentWebhook } from '../services/paymentService';

// Étendre le type Request pour inclure la propriété user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const prisma = new PrismaClient();

export class PaymentController {
  /**
   * @route POST /api/payments/initiate
   * @desc Initialise un paiement pour un contrat
   * @access Private (Entreprises)
   */
  static async initiatePayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { contractId, amount, currency = 'EUR', description, customerPhone } = req.body;

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      if (!contractId || !amount || !description) {
        return res.status(400).json({
          success: false,
          message: 'ContractId, amount et description sont requis'
        });
      }

      // Vérifier que l'utilisateur est l'entreprise du contrat
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          enterprise: {
            include: { user: true }
          },
          mission: true
        }
      });

      if (!contract) {
        return res.status(404).json({
          success: false,
          message: 'Contrat non trouvé'
        });
      }

      if (contract.enterprise.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      if (contract.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Le contrat doit être actif pour effectuer un paiement'
        });
      }

      const paymentRequest: PaymentRequest = {
        contractId,
        amount,
        currency,
        description,
        customerEmail: req.user.email,
        customerPhone,
        customerName: contract.enterprise.name
      };

      const result = await PaymentService.initiatePayment(paymentRequest);

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: {
            transactionId: result.transactionId,
            paymentUrl: result.paymentUrl,
            status: result.status
          },
          message: 'Paiement initialisé avec succès'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.error || 'Erreur lors de l\'initialisation du paiement'
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du paiement:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * @route POST /api/payments/webhook
   * @desc Webhook MyTouchPoint pour les notifications de paiement
   * @access Public
   */
  static async handleWebhook(req: Request, res: Response) {
    try {
      const webhookData: PaymentWebhook = req.body;

      // Vérifier que toutes les données requises sont présentes
      if (!webhookData.transactionId || !webhookData.status || !webhookData.signature) {
        return res.status(400).json({
          success: false,
          message: 'Données webhook incomplètes'
        });
      }

      // Traiter le webhook
      await PaymentService.processWebhook(webhookData);

      return res.status(200).json({
        success: true,
        message: 'Webhook traité avec succès'
      });
    } catch (error) {
      console.error('Erreur lors du traitement du webhook:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement du webhook'
      });
    }
  }

  /**
   * @route GET /api/payments/contract/:contractId
   * @desc Récupère l'historique des paiements d'un contrat
   * @access Private
   */
  static async getContractPayments(req: AuthenticatedRequest, res: Response) {
    try {
      const { contractId } = req.params;

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      // Vérifier les autorisations
      const contract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: {
          talent: {
            include: { user: true }
          },
          enterprise: {
            include: { user: true }
          }
        }
      });

      if (!contract) {
        return res.status(404).json({
          success: false,
          message: 'Contrat non trouvé'
        });
      }

      const isTalent = contract.talent.userId === req.user.id;
      const isEnterprise = contract.enterprise.userId === req.user.id;
      const isAdmin = req.user.role === 'ADMIN';

      if (!isTalent && !isEnterprise && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      const payments = await PaymentService.getContractPayments(contractId);

      return res.status(200).json({
        success: true,
        data: payments,
        message: 'Paiements récupérés avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * @route GET /api/payments/status/:transactionId
   * @desc Récupère le statut d'un paiement
   * @access Private
   */
  static async getPaymentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { transactionId } = req.params;

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      // Vérifier que l'utilisateur a accès à ce paiement
      const payment = await prisma.payment.findFirst({
        where: { transactionId },
        include: {
          contract: {
            include: {
              talent: {
                include: { user: true }
              },
              enterprise: {
                include: { user: true }
              }
            }
          }
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      const isTalent = payment.contract.talent.userId === req.user.id;
      const isEnterprise = payment.contract.enterprise.userId === req.user.id;
      const isAdmin = req.user.role === 'ADMIN';

      if (!isTalent && !isEnterprise && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      const status = await PaymentService.getPaymentStatus(transactionId);

      return res.status(200).json({
        success: true,
        data: status,
        message: 'Statut récupéré avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * @route GET /api/payments/stats
   * @desc Récupère les statistiques de paiement
   * @access Private (Admin)
   */
  static async getPaymentStats(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      const stats = await PaymentService.getPaymentStats();

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
   * @route POST /api/payments/retry/:transactionId
   * @desc Relance un paiement échoué
   * @access Private (Entreprises)
   */
  static async retryPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { transactionId } = req.params;

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      // Récupérer le paiement
      const payment = await prisma.payment.findFirst({
        where: { transactionId },
        include: {
          contract: {
            include: {
              enterprise: {
                include: { user: true }
              },
              mission: true
            }
          }
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      // Vérifier les autorisations
      if (payment.contract.enterprise.userId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      if (payment.status !== 'failed') {
        return res.status(400).json({
          success: false,
          message: 'Seuls les paiements échoués peuvent être relancés'
        });
      }

      // Relancer le paiement
      const paymentRequest: PaymentRequest = {
        contractId: payment.contractId,
        amount: payment.amount,
        currency: payment.currency,
        description: `Relance - ${payment.contract.mission.title}`,
        customerEmail: req.user.email,
        customerName: payment.contract.enterprise.name
      };

      const result = await PaymentService.initiatePayment(paymentRequest);

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: {
            transactionId: result.transactionId,
            paymentUrl: result.paymentUrl,
            status: result.status
          },
          message: 'Paiement relancé avec succès'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.error || 'Erreur lors de la relance du paiement'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la relance du paiement:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * @route GET /api/payments/user
   * @desc Récupère tous les paiements de l'utilisateur
   * @access Private
   */
  static async getUserPayments(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      const { status, type, limit = 10, page = 1 } = req.query;

      // Construire la requête selon le rôle
      let whereClause: any = {};

      if (req.user.role === 'TALENT') {
        whereClause.contract = {
          talent: {
            userId: req.user.id
          }
        };
      } else if (req.user.role === 'ENTERPRISE') {
        whereClause.contract = {
          enterprise: {
            userId: req.user.id
          }
        };
      }

      // Ajouter les filtres
      if (status && status !== 'all') {
        whereClause.status = status;
      }

      if (type && type !== 'all') {
        whereClause.type = type;
      }

      const payments = await prisma.payment.findMany({
        where: whereClause,
        include: {
          contract: {
            include: {
              mission: true,
              talent: {
                include: { user: true }
              },
              enterprise: {
                include: { user: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: (Number(page) - 1) * Number(limit)
      });

      const total = await prisma.payment.count({ where: whereClause });

      return res.status(200).json({
        success: true,
        data: {
          payments,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalPayments: total,
            hasNext: Number(page) * Number(limit) < total,
            hasPrev: Number(page) > 1
          }
        },
        message: 'Paiements récupérés avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
} 