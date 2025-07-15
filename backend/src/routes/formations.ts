import { Router } from 'express';
import {
  createFormation,
  getAllFormations,
  getFormationById,
  updateFormation,
  deleteFormation,
  getMyFormations,
  startFormation,
  updateProgress,
  addQuiz,
  getFormationStats
} from '../controllers/formationController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Routes publiques
router.get('/', getAllFormations); // Liste des formations (avec filtres)
router.get('/:id', getFormationById); // Détails d'une formation

// Routes protégées - nécessitent une authentification
router.get('/my/formations', authenticate, authorize(['TALENT']), getMyFormations); // Mes formations (talent)
router.post('/:id/start', authenticate, authorize(['TALENT']), startFormation); // Commencer une formation
router.put('/:id/progress', authenticate, authorize(['TALENT']), updateProgress); // Mettre à jour la progression

// Routes admin uniquement
router.post('/', authenticate, authorize(['ADMIN']), createFormation); // Créer une formation
router.put('/:id', authenticate, authorize(['ADMIN']), updateFormation); // Mettre à jour une formation
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteFormation); // Supprimer une formation
router.post('/:id/quizzes', authenticate, authorize(['ADMIN']), addQuiz); // Ajouter un quiz
router.get('/stats/overview', authenticate, authorize(['ADMIN']), getFormationStats); // Statistiques des formations

export default router; 