import { Router } from 'express';
import {
  createTalent,
  getAllTalents,
  getTalentById,
  updateTalent,
  deleteTalent,
  getMyProfile,
  updateMyProfile,
  getTalentStats,
  getRecommendedMissions,
  uploadCV,
  uploadVideo,
  getMissionHistory,
  getTopTalentsByDomain
} from '../controllers/talentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Routes publiques
router.post('/', createTalent); // Création d'un compte talent
router.get('/top/:domain', getTopTalentsByDomain); // Top talents par domaine

// Routes protégées - nécessitent une authentification
router.get('/', authenticate, getAllTalents); // Liste des talents (avec filtres)
router.get('/profile', authenticate, authorize(['TALENT']), getMyProfile); // Profil du talent connecté
router.put('/profile', authenticate, authorize(['TALENT']), updateMyProfile); // Mise à jour du profil

// Routes pour talents connectés
router.get('/profile/stats', authenticate, authorize(['TALENT']), getTalentStats); // Statistiques du talent
router.get('/profile/recommendations', authenticate, authorize(['TALENT']), getRecommendedMissions); // Missions recommandées
router.get('/profile/history', authenticate, authorize(['TALENT']), getMissionHistory); // Historique des missions
router.post('/profile/upload-cv', authenticate, authorize(['TALENT']), uploadCV); // Upload de CV
router.post('/profile/upload-video', authenticate, authorize(['TALENT']), uploadVideo); // Upload de vidéo

// Routes protégées - nécessitent des rôles spécifiques
router.get('/:id', authenticate, getTalentById); // Détails d'un talent

// Routes admin uniquement
router.put('/:id', authenticate, authorize(['ADMIN']), updateTalent); // Mise à jour d'un talent (admin)
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteTalent); // Suppression d'un talent (admin)

export default router; 