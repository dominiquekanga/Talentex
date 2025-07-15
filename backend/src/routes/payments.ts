import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * @route POST /api/payments/initiate
 * @desc Initialise un paiement pour un contrat
 * @access Private (Entreprises)
 */
router.post('/initiate', authenticate, authorize(['ENTERPRISE']), PaymentController.initiatePayment);

/**
 * @route POST /api/payments/webhook
 * @desc Webhook MyTouchPoint pour les notifications de paiement
 * @access Public
 */
router.post('/webhook', PaymentController.handleWebhook);

/**
 * @route GET /api/payments/contract/:contractId
 * @desc Récupère l'historique des paiements d'un contrat
 * @access Private
 */
router.get('/contract/:contractId', authenticate, PaymentController.getContractPayments);

/**
 * @route GET /api/payments/status/:transactionId
 * @desc Récupère le statut d'un paiement
 * @access Private
 */
router.get('/status/:transactionId', authenticate, PaymentController.getPaymentStatus);

/**
 * @route GET /api/payments/stats
 * @desc Récupère les statistiques de paiement
 * @access Private (Admin)
 */
router.get('/stats', authenticate, authorize(['ADMIN']), PaymentController.getPaymentStats);

/**
 * @route POST /api/payments/retry/:transactionId
 * @desc Relance un paiement échoué
 * @access Private (Entreprises)
 */
router.post('/retry/:transactionId', authenticate, authorize(['ENTERPRISE']), PaymentController.retryPayment);

/**
 * @route GET /api/payments/user
 * @desc Récupère tous les paiements de l'utilisateur
 * @access Private
 */
router.get('/user', authenticate, PaymentController.getUserPayments);

export default router; 