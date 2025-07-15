import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface MyTouchPointConfig {
  merchantId: string;
  secretKey: string;
  apiUrl: string;
  callbackUrl: string;
}

export interface PaymentRequest {
  contractId: string;
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  customerPhone?: string;
  customerName: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  error?: string;
  status?: string;
}

export interface PaymentWebhook {
  transactionId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  amount: number;
  currency: string;
  customerEmail: string;
  signature: string;
}

export class PaymentService {
  private static config: MyTouchPointConfig = {
    merchantId: process.env.MYTOUCHPOINT_MERCHANT_ID || '',
    secretKey: process.env.MYTOUCHPOINT_SECRET_KEY || '',
    apiUrl: process.env.MYTOUCHPOINT_API_URL || 'https://api.mytouchpoint.com',
    callbackUrl: process.env.MYTOUCHPOINT_CALLBACK_URL || 'http://localhost:5000/api/payments/webhook'
  };

  /**
   * Initialise un paiement pour un contrat
   */
  static async initiatePayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Récupérer les détails du contrat
      const contract = await prisma.contract.findUnique({
        where: { id: paymentRequest.contractId },
        include: {
          mission: {
            include: { enterprise: true }
          },
          talent: {
            include: { user: true }
          }
        }
      });

      if (!contract) {
        throw new Error('Contrat non trouvé');
      }

      if (contract.status !== 'active') {
        throw new Error('Le contrat doit être actif pour effectuer un paiement');
      }

      // Générer un ID de transaction unique
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Préparer les données pour MyTouchPoint
      const paymentData = {
        merchant_id: this.config.merchantId,
        transaction_id: transactionId,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        description: paymentRequest.description,
        customer_email: paymentRequest.customerEmail,
        customer_phone: paymentRequest.customerPhone,
        customer_name: paymentRequest.customerName,
        callback_url: this.config.callbackUrl,
        return_url: `${process.env.FRONTEND_URL}/dashboard/contracts/${paymentRequest.contractId}`,
        cancel_url: `${process.env.FRONTEND_URL}/dashboard/contracts/${paymentRequest.contractId}`,
        metadata: {
          contractId: paymentRequest.contractId,
          missionId: contract.missionId,
          talentId: contract.talentId,
          enterpriseId: contract.enterpriseId
        }
      };

      // Générer la signature
      const signature = this.generateSignature(paymentData);

      // Appel à l'API MyTouchPoint
      const response = await axios.post(`${this.config.apiUrl}/payment/initiate`, {
        ...paymentData,
        signature
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.secretKey}`
        }
      });

      if (response.data.success) {
        // Créer l'enregistrement de paiement
        await prisma.payment.create({
          data: {
            contractId: paymentRequest.contractId,
            amount: paymentRequest.amount,
            currency: paymentRequest.currency,
            status: 'pending',
            transactionId: transactionId,
            paymentMethod: 'mytouchpoint',
            metadata: JSON.stringify(paymentData.metadata)
          }
        });

        return {
          success: true,
          transactionId,
          paymentUrl: response.data.payment_url,
          status: 'pending'
        };
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'initialisation du paiement');
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du paiement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne du serveur'
      };
    }
  }

  /**
   * Traite le webhook de paiement de MyTouchPoint
   */
  static async processWebhook(webhookData: PaymentWebhook): Promise<void> {
    try {
      // Vérifier la signature
      if (!this.verifySignature(webhookData)) {
        throw new Error('Signature invalide');
      }

      // Récupérer le paiement
      const payment = await prisma.payment.findFirst({
        where: { transactionId: webhookData.transactionId },
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
        }
      });

      if (!payment) {
        throw new Error('Paiement non trouvé');
      }

      // Mettre à jour le statut du paiement
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: webhookData.status.toLowerCase(),
          paidAt: webhookData.status === 'SUCCESS' ? new Date() : null,
          metadata: JSON.stringify({
            ...JSON.parse(payment.metadata || '{}'),
            webhookData
          })
        }
      });

      // Si le paiement est réussi, traiter la commission et le reversement
      if (webhookData.status === 'SUCCESS') {
        await this.processSuccessfulPayment(payment);
      }

      // Envoyer des notifications
      await this.sendPaymentNotifications(payment, webhookData.status);

    } catch (error) {
      console.error('Erreur lors du traitement du webhook:', error);
      throw error;
    }
  }

  /**
   * Traite un paiement réussi (commission + reversement)
   */
  private static async processSuccessfulPayment(payment: any): Promise<void> {
    const { contract } = payment;
    const commission = contract.commission;
    const netAmount = contract.netAmount;

    // Créer l'enregistrement de commission
    await prisma.payment.create({
      data: {
        contractId: contract.id,
        amount: commission,
        currency: payment.currency,
        status: 'COMPLETED',
        transactionId: `COMM_${payment.transactionId}`,
        paymentMethod: 'commission',
        type: 'commission',
        metadata: JSON.stringify({
          originalPaymentId: payment.id,
          description: 'Commission plateforme'
        })
      }
    });

    // Créer l'enregistrement de reversement au talent
    await prisma.payment.create({
      data: {
        contractId: contract.id,
        amount: netAmount,
        currency: payment.currency,
        status: 'pending',
        transactionId: `REV_${payment.transactionId}`,
        paymentMethod: 'mytouchpoint',
        type: 'reversal',
        metadata: JSON.stringify({
          originalPaymentId: payment.id,
          talentId: contract.talentId,
          description: 'Reversement au talent'
        })
      }
    });

    // Mettre à jour le statut du contrat
    await prisma.contract.update({
      where: { id: contract.id },
      data: { 
        status: 'payment_received',
        updatedAt: new Date()
      }
    });

    // Déclencher le reversement automatique au talent
    await this.processTalentReversal(contract, netAmount, payment.currency);
  }

  /**
   * Traite le reversement automatique au talent
   */
  private static async processTalentReversal(contract: any, amount: number, currency: string): Promise<void> {
    try {
      // Préparer les données pour le reversement
      const reversalData = {
        merchant_id: this.config.merchantId,
        transaction_id: `REV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount,
        currency: currency,
        description: `Reversement pour la mission: ${contract.mission.title}`,
        customer_email: contract.talent.user.email,
        customer_name: `${contract.talent.firstName} ${contract.talent.lastName}`,
        callback_url: this.config.callbackUrl,
        metadata: {
          type: 'talent_reversal',
          contractId: contract.id,
          talentId: contract.talentId
        }
      };

      // Générer la signature
      const signature = this.generateSignature(reversalData);

      // Appel à l'API MyTouchPoint pour le reversement
      const response = await axios.post(`${this.config.apiUrl}/payment/transfer`, {
        ...reversalData,
        signature
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.secretKey}`
        }
      });

      if (response.data.success) {
        // Mettre à jour le statut du reversement
        await prisma.payment.updateMany({
          where: {
            contractId: contract.id,
            type: 'reversal',
            status: 'pending'
          },
          data: {
            status: 'COMPLETED',
            paidAt: new Date(),
            transactionId: reversalData.transaction_id
          }
        });
      } else {
        console.error('Erreur lors du reversement au talent:', response.data);
        // Marquer le reversement comme échoué
        await prisma.payment.updateMany({
          where: {
            contractId: contract.id,
            type: 'reversal',
            status: 'pending'
          },
          data: {
            status: 'failed',
            metadata: JSON.stringify({
              error: response.data.message,
              timestamp: new Date().toISOString()
            })
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors du reversement au talent:', error);
      // Marquer le reversement comme échoué
      await prisma.payment.updateMany({
        where: {
          contractId: contract.id,
          type: 'reversal',
          status: 'pending'
        },
        data: {
          status: 'failed',
          metadata: JSON.stringify({
            error: error instanceof Error ? error.message : 'Erreur interne',
            timestamp: new Date().toISOString()
          })
        }
      });
    }
  }

  /**
   * Récupère l'historique des paiements d'un contrat
   */
  static async getContractPayments(contractId: string): Promise<any[]> {
    return await prisma.payment.findMany({
      where: { contractId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Récupère les statistiques de paiement
   */
  static async getPaymentStats(): Promise<any> {
    const totalPayments = await prisma.payment.count({
      where: { status: 'COMPLETED' }
    });

    const totalAmount = await prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true }
    });

    const totalCommissions = await prisma.payment.aggregate({
      where: { 
        status: 'COMPLETED',
        type: 'commission'
      },
      _sum: { amount: true }
    });

    const pendingReversals = await prisma.payment.count({
      where: {
        type: 'reversal',
        status: 'pending'
      }
    });

    return {
      totalPayments,
      totalAmount: totalAmount._sum.amount || 0,
      totalCommissions: totalCommissions._sum.amount || 0,
      pendingReversals,
      successRate: totalPayments > 0 ? 
        (await prisma.payment.count({ where: { status: 'COMPLETED' } }) / totalPayments) * 100 : 0
    };
  }

  /**
   * Génère la signature pour MyTouchPoint
   */
  private static generateSignature(data: any): string {
    const sortedKeys = Object.keys(data).sort();
    const signatureString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&') + this.config.secretKey;

    return crypto.createHash('sha256').update(signatureString).digest('hex');
  }

  /**
   * Vérifie la signature du webhook
   */
  private static verifySignature(webhookData: PaymentWebhook): boolean {
    const expectedSignature = this.generateSignature({
      transaction_id: webhookData.transactionId,
      status: webhookData.status,
      amount: webhookData.amount,
      currency: webhookData.currency,
      customer_email: webhookData.customerEmail
    });

    return expectedSignature === webhookData.signature;
  }

  /**
   * Envoie les notifications de paiement
   */
  private static async sendPaymentNotifications(payment: any, status: string): Promise<void> {
    const { contract } = payment;
    const notifications = [];

    if (status === 'SUCCESS') {
      // Notifier l'entreprise
      notifications.push({
        userId: contract.enterprise.userId,
        title: 'Paiement reçu',
        message: `Le paiement de ${payment.amount}€ pour la mission "${contract.mission.title}" a été reçu avec succès.`,
        type: 'PAYMENT_SUCCESS'
      });

      // Notifier le talent
      notifications.push({
        userId: contract.talent.userId,
        title: 'Paiement traité',
        message: `Le paiement pour votre mission "${contract.mission.title}" a été traité. Le reversement sera effectué sous 24-48h.`,
        type: 'PAYMENT_PROCESSED'
      });
    } else if (status === 'FAILED') {
      // Notifier l'entreprise
      notifications.push({
        userId: contract.enterprise.userId,
        title: 'Échec du paiement',
        message: `Le paiement de ${payment.amount}€ pour la mission "${contract.mission.title}" a échoué.`,
        type: 'PAYMENT_FAILED'
      });
    }

    // Créer les notifications
    for (const notification of notifications) {
      await prisma.notification.create({
        data: notification
      });
    }
  }

  /**
   * Récupère le statut d'un paiement
   */
  static async getPaymentStatus(transactionId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.config.apiUrl}/payment/status/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
      throw error;
    }
  }
} 