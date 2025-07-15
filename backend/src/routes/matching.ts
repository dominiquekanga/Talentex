import { Router } from 'express';
import { MatchingController } from '../controllers/matchingController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/matching/missions/:missionId
 * @desc Récupère les meilleurs talents pour une mission
 * @access Private (Entreprises)
 */
router.get('/missions/:missionId', authenticate, authorize(['ENTERPRISE']), MatchingController.getMatchesForMission);

/**
 * @route GET /api/matching/talents/:talentId
 * @desc Récupère les meilleures missions pour un talent
 * @access Private (Talents)
 */
router.get('/talents/:talentId', authenticate, authorize(['TALENT']), MatchingController.getMatchesForTalent);

/**
 * @route POST /api/matching/accept
 * @desc Accepte un matching (talent accepte une mission)
 * @access Private (Talents)
 */
router.post('/accept', authenticate, authorize(['TALENT']), MatchingController.acceptMatching);

/**
 * @route POST /api/matching/reject
 * @desc Rejette un matching
 * @access Private (Talents)
 */
router.post('/reject', authenticate, authorize(['TALENT']), MatchingController.rejectMatching);

/**
 * @route POST /api/matching/update/:missionId
 * @desc Met à jour les matchings pour une mission (recalcul automatique)
 * @access Private (Entreprises)
 */
router.post('/update/:missionId', authenticate, authorize(['ENTERPRISE']), MatchingController.updateMissionMatchings);

/**
 * @route GET /api/matching/stats
 * @desc Récupère les statistiques de matching
 * @access Private (Admin)
 */
router.get('/stats', authenticate, authorize(['ADMIN']), MatchingController.getMatchingStats);

export default router; 