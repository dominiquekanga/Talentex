import { Router } from 'express';
import { AcademyController } from '../controllers/academyController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

// Routes publiques
router.get('/formations', AcademyController.getAllFormations);
router.get('/formations/:id', AcademyController.getFormationById);

// Routes protégées pour les talents
router.use(authenticate);
const requireTalent = requireRole(['TALENT']);

router.get('/progress', requireTalent, AcademyController.getUserProgress);
router.post('/formations/:id/start', requireTalent, AcademyController.startFormation);
router.post('/formations/:id/progress', requireTalent, AcademyController.updateProgress);
router.post('/formations/:id/complete', requireTalent, AcademyController.completeFormation);
router.get('/certificates', requireTalent, AcademyController.getUserCertificates);

export default router; 