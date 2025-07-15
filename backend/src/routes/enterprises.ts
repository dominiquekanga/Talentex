import { Router } from 'express';
import {
  createEnterprise,
  getAllEnterprises,
  getEnterpriseById,
  updateEnterprise,
  deleteEnterprise,
  getMyProfile,
  updateMyProfile,
  verifyEnterprise,
  getEnterpriseStats,
  getRecommendedTalents,
  uploadLogo,
  getMissionHistory,
  getTopEnterprisesByIndustry,
  createSubscription
} from '../controllers/enterpriseController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Routes publiques
router.post('/', createEnterprise); // Création d'un compte entreprise
router.get('/top/:industry', getTopEnterprisesByIndustry); // Top entreprises par industrie

// Routes protégées - nécessitent une authentification
router.get('/', authenticate, getAllEnterprises); // Liste des entreprises (avec filtres)
router.get('/profile', authenticate, authorize(['ENTERPRISE']), getMyProfile); // Profil de l'entreprise connectée
router.put('/profile', authenticate, authorize(['ENTERPRISE']), updateMyProfile); // Mise à jour du profil

// Routes pour entreprises connectées
router.get('/profile/stats', authenticate, authorize(['ENTERPRISE']), getEnterpriseStats); // Statistiques de l'entreprise
router.get('/profile/recommendations', authenticate, authorize(['ENTERPRISE']), getRecommendedTalents); // Talents recommandés
router.get('/profile/history', authenticate, authorize(['ENTERPRISE']), getMissionHistory); // Historique des missions
router.post('/profile/upload-logo', authenticate, authorize(['ENTERPRISE']), uploadLogo); // Upload de logo
router.post('/profile/subscription', authenticate, authorize(['ENTERPRISE']), createSubscription); // Créer un abonnement

// Routes protégées - nécessitent des rôles spécifiques
router.get('/:id', authenticate, getEnterpriseById); // Détails d'une entreprise

// Routes admin uniquement
router.put('/:id', authenticate, authorize(['ADMIN']), updateEnterprise); // Mise à jour d'une entreprise (admin)
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteEnterprise); // Suppression d'une entreprise (admin)
router.post('/:id/verify', authenticate, authorize(['ADMIN']), verifyEnterprise); // Vérifier une entreprise (admin)

export default router; 