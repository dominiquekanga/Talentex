import { Router } from 'express';
import {
  createMission,
  getAllMissions,
  getMissionById,
  updateMission,
  deleteMission,
  getMyMissions,
  applyToMission
} from '../controllers/missionController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Routes protégées - nécessitent une authentification
router.get('/', authenticate, getAllMissions); // Liste des missions (avec filtres)
router.get('/:id', authenticate, getMissionById); // Détails d'une mission

// Routes pour les entreprises
router.post('/', authenticate, authorize(['ENTERPRISE']), createMission); // Créer une mission
router.get('/my/missions', authenticate, authorize(['ENTERPRISE']), getMyMissions); // Mes missions (entreprise)
router.put('/:id', authenticate, authorize(['ENTERPRISE', 'ADMIN']), updateMission); // Mettre à jour une mission
router.delete('/:id', authenticate, authorize(['ENTERPRISE', 'ADMIN']), deleteMission); // Supprimer une mission

// Routes pour les talents
router.post('/:id/apply', authenticate, authorize(['TALENT']), applyToMission); // Postuler à une mission

export default router; 