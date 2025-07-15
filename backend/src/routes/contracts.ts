import { Router } from 'express';
import { ContractController } from '../controllers/contractController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * @route POST /api/contracts/generate
 * @desc Génère un contrat à partir d'un matching accepté
 * @access Private (Talents, Entreprises)
 */
router.post('/generate', authenticate, authorize(['TALENT', 'ENTERPRISE']), ContractController.generateContract);

/**
 * @route GET /api/contracts
 * @desc Récupère tous les contrats de l'utilisateur
 * @access Private
 */
router.get('/', authenticate, ContractController.getUserContracts);

/**
 * @route GET /api/contracts/:id
 * @desc Récupère un contrat spécifique avec tous ses détails
 * @access Private
 */
router.get('/:id', authenticate, ContractController.getContract);

/**
 * @route POST /api/contracts/:id/sign
 * @desc Signe un contrat
 * @access Private (Talents, Entreprises)
 */
router.post('/:id/sign', authenticate, authorize(['TALENT', 'ENTERPRISE']), ContractController.signContract);

/**
 * @route PUT /api/contracts/:id/status
 * @desc Met à jour le statut d'un contrat
 * @access Private (Admin, Parties concernées)
 */
router.put('/:id/status', authenticate, ContractController.updateContractStatus);

/**
 * @route GET /api/contracts/:id/pdf
 * @desc Génère un PDF du contrat
 * @access Private
 */
router.get('/:id/pdf', authenticate, ContractController.generateContractPDF);

/**
 * @route POST /api/contracts/:id/rate
 * @desc Note un contrat (après completion)
 * @access Private (Talents, Entreprises)
 */
router.post('/:id/rate', authenticate, authorize(['TALENT', 'ENTERPRISE']), ContractController.rateContract);

/**
 * @route GET /api/contracts/stats
 * @desc Récupère les statistiques des contrats
 * @access Private (Admin)
 */
router.get('/stats', authenticate, authorize(['ADMIN']), ContractController.getContractStats);

export default router; 