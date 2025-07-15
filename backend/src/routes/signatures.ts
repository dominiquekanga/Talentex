import express from 'express';
import { SignatureController } from '../controllers/signatureController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/signatures/{contractId}/initialize:
 *   post:
 *     summary: Initialise le processus de signature pour un contrat
 *     tags: [Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du contrat
 *     responses:
 *       200:
 *         description: Processus de signature initialisé
 *       404:
 *         description: Contrat non trouvé
 */
router.post('/:contractId/initialize', authenticate, SignatureController.initializeSignatures);

/**
 * @swagger
 * /api/signatures/{contractId}/sign:
 *   post:
 *     summary: Signe un contrat
 *     tags: [Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du contrat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signatureData:
 *                 type: object
 *                 description: Données de signature (optionnel)
 *     responses:
 *       200:
 *         description: Contrat signé avec succès
 *       400:
 *         description: Erreur lors de la signature
 */
router.post('/:contractId/sign', authenticate, SignatureController.signContract);

/**
 * @swagger
 * /api/signatures/{contractId}/status:
 *   get:
 *     summary: Récupère le statut des signatures d'un contrat
 *     tags: [Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du contrat
 *     responses:
 *       200:
 *         description: Statut des signatures récupéré
 *       404:
 *         description: Contrat non trouvé
 */
router.get('/:contractId/status', authenticate, SignatureController.getSignatureStatus);

/**
 * @swagger
 * /api/signatures/{contractId}/download:
 *   get:
 *     summary: Télécharge le PDF du contrat signé
 *     tags: [Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du contrat
 *     responses:
 *       200:
 *         description: PDF du contrat signé
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Contrat non signé
 *       404:
 *         description: Contrat non trouvé
 */
router.get('/:contractId/download', authenticate, SignatureController.downloadSignedContract);

/**
 * @swagger
 * /api/signatures/{contractId}/verify:
 *   post:
 *     summary: Vérifie la validité d'une signature
 *     tags: [Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du contrat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - signatureHash
 *               - signerId
 *               - timestamp
 *             properties:
 *               signatureHash:
 *                 type: string
 *                 description: Hash de la signature
 *               signerId:
 *                 type: string
 *                 description: ID du signataire
 *               timestamp:
 *                 type: number
 *                 description: Timestamp de la signature
 *     responses:
 *       200:
 *         description: Validité de la signature vérifiée
 */
router.post('/:contractId/verify', authenticate, SignatureController.verifySignature);

/**
 * @swagger
 * /api/signatures/{contractId}/history:
 *   get:
 *     summary: Récupère l'historique des signatures d'un contrat
 *     tags: [Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du contrat
 *     responses:
 *       200:
 *         description: Historique des signatures récupéré
 *       404:
 *         description: Contrat non trouvé
 */
router.get('/:contractId/history', authenticate, SignatureController.getSignatureHistory);

/**
 * @swagger
 * /api/signatures/{contractId}/cancel/{signerId}/{signerRole}:
 *   delete:
 *     summary: Annule une signature (admin seulement)
 *     tags: [Signatures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du contrat
 *       - in: path
 *         name: signerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du signataire
 *       - in: path
 *         name: signerRole
 *         required: true
 *         schema:
 *           type: string
 *         description: Rôle du signataire
 *     responses:
 *       200:
 *         description: Signature annulée avec succès
 *       403:
 *         description: Accès non autorisé
 */
router.delete('/:contractId/cancel/:signerId/:signerRole', authenticate, SignatureController.cancelSignature);

export default router; 