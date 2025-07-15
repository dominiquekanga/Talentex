import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roles';

const router = Router();

// Middleware pour vérifier que l'utilisateur est admin
const requireAdmin = requireRole(['ADMIN']);

// Routes protégées par authentification et rôle admin
router.use(authenticate);
router.use(requireAdmin);

// Statistiques du dashboard
router.get('/stats', AdminController.getDashboardStats);

// Activité récente
router.get('/activity', AdminController.getRecentActivity);

// Gestion des utilisateurs
router.get('/users', AdminController.getAllUsers);
router.get('/users/:id', AdminController.getUserById);
router.put('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);

// Gestion des formations
router.get('/formations', AdminController.getAllFormations);
router.post('/formations', AdminController.createFormation);
router.put('/formations/:id', AdminController.updateFormation);
router.delete('/formations/:id', AdminController.deleteFormation);

// Gestion des missions
router.get('/missions', AdminController.getAllMissions);
router.put('/missions/:id/approve', AdminController.approveMission);
router.put('/missions/:id/reject', AdminController.rejectMission);

// Gestion des contrats
router.get('/contracts', AdminController.getAllContracts);
router.get('/contracts/:id', AdminController.getContractById);
router.put('/contracts/:id/status', AdminController.updateContractStatus);

// Rapports et analytics
router.get('/reports/revenue', AdminController.getRevenueReport);
router.get('/reports/users', AdminController.getUsersReport);
router.get('/reports/performance', AdminController.getPerformanceReport);

// Approbations en attente
router.get('/pending-approvals', AdminController.getPendingApprovals);
router.post('/approvals/:id/approve', AdminController.approveRequest);
router.post('/approvals/:id/reject', AdminController.rejectRequest);

export default router; 