import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { ApiResponse } from '../types';

export class AdminController {
  /**
   * Récupérer les statistiques du dashboard
   */
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const [
        totalUsers,
        totalTalents,
        totalEnterprises,
        totalMissions,
        totalContracts,
        totalRevenue,
        activeFormations,
        pendingApprovals
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'TALENT' } }),
        prisma.user.count({ where: { role: 'ENTERPRISE' } }),
        prisma.mission.count({ where: { status: 'OPEN' } }),
        prisma.contract.count(),
        prisma.payment.aggregate({
          _sum: { amount: true }
        }),
        prisma.formation.count({ where: { isActive: true } }),
        prisma.user.count({ where: { isVerified: false } })
      ]);

      const stats = {
        totalUsers,
        totalTalents,
        totalEnterprises,
        totalMissions,
        totalContracts,
        totalRevenue: totalRevenue._sum.amount || 0,
        activeFormations,
        pendingApprovals
      };

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Récupérer l'activité récente
   */
  static async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const recentActivity = await prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          talent: {
            select: {
              firstName: true,
              lastName: true,
            }
          },
          enterprise: {
            select: {
              name: true,
            }
          }
        }
      });

      const activity = recentActivity.map(user => ({
        id: user.id,
        type: 'user_registration' as const,
        message: `Nouvel utilisateur ${user.role.toLowerCase()} inscrit: ${user.email}`,
        timestamp: user.createdAt.toISOString(),
        user: {
          id: user.id,
          name: user.talent ? `${user.talent.firstName} ${user.talent.lastName}` : 
                user.enterprise ? user.enterprise.name : user.email,
          email: user.email
        }
      }));

      const response: ApiResponse = {
        success: true,
        data: activity,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'activité:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Récupérer tous les utilisateurs
   */
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, role, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (role) where.role = role;
      if (search) {
        where.OR = [
          { email: { contains: String(search), mode: 'insensitive' } },
          { talent: { firstName: { contains: String(search), mode: 'insensitive' } } },
          { talent: { lastName: { contains: String(search), mode: 'insensitive' } } },
          { enterprise: { name: { contains: String(search), mode: 'insensitive' } } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            talent: true,
            enterprise: true,
            investor: true,
            admin: true,
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Récupérer un utilisateur par ID
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          talent: true,
          enterprise: true,
          investor: true,
          admin: true,
        }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé',
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: user,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Mettre à jour un utilisateur
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive, isVerified, role } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: {
          isActive,
          isVerified,
          role,
        },
        include: {
          talent: true,
          enterprise: true,
          investor: true,
          admin: true,
        }
      });

      const response: ApiResponse = {
        success: true,
        data: user,
        message: 'Utilisateur mis à jour avec succès',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Supprimer un utilisateur
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await prisma.user.delete({
        where: { id }
      });

      const response: ApiResponse = {
        success: true,
        message: 'Utilisateur supprimé avec succès',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Récupérer toutes les formations
   */
  static async getAllFormations(req: Request, res: Response): Promise<void> {
    try {
      const formations = await prisma.formation.findMany({
        orderBy: { createdAt: 'desc' }
      });

      const response: ApiResponse = {
        success: true,
        data: formations,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des formations:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Créer une nouvelle formation
   */
  static async createFormation(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, content, videoUrl, pdfUrl, duration, difficulty, domain } = req.body;

      const formation = await prisma.formation.create({
        data: {
          title,
          description,
          content,
          videoUrl,
          pdfUrl,
          duration: Number(duration),
          difficulty,
          domain,
        }
      });

      const response: ApiResponse = {
        success: true,
        data: formation,
        message: 'Formation créée avec succès',
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Erreur lors de la création de la formation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Mettre à jour une formation
   */
  static async updateFormation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const formation = await prisma.formation.update({
        where: { id },
        data: updateData
      });

      const response: ApiResponse = {
        success: true,
        data: formation,
        message: 'Formation mise à jour avec succès',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la formation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Supprimer une formation
   */
  static async deleteFormation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await prisma.formation.delete({
        where: { id }
      });

      const response: ApiResponse = {
        success: true,
        message: 'Formation supprimée avec succès',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la suppression de la formation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Récupérer toutes les missions
   */
  static async getAllMissions(req: Request, res: Response): Promise<void> {
    try {
      const missions = await prisma.mission.findMany({
        include: {
          enterprise: {
            include: {
              user: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const response: ApiResponse = {
        success: true,
        data: missions,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des missions:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Approuver une mission
   */
  static async approveMission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const mission = await prisma.mission.update({
        where: { id },
        data: { status: 'IN_PROGRESS' }
      });

      const response: ApiResponse = {
        success: true,
        data: mission,
        message: 'Mission approuvée avec succès',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de l\'approbation de la mission:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Rejeter une mission
   */
  static async rejectMission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const mission = await prisma.mission.update({
        where: { id },
        data: { 
          status: 'CANCELLED'
        }
      });

      const response: ApiResponse = {
        success: true,
        data: mission,
        message: 'Mission rejetée avec succès',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors du rejet de la mission:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Récupérer tous les contrats
   */
  static async getAllContracts(req: Request, res: Response): Promise<void> {
    try {
      const contracts = await prisma.contract.findMany({
        include: {
          mission: {
            include: {
              enterprise: {
                include: {
                  user: true
                }
              }
            }
          },
          talent: {
            include: {
              user: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const response: ApiResponse = {
        success: true,
        data: contracts,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des contrats:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Récupérer un contrat par ID
   */
  static async getContractById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const contract = await prisma.contract.findUnique({
        where: { id },
        include: {
          mission: {
            include: {
              enterprise: {
                include: {
                  user: true
                }
              }
            }
          },
          talent: {
            include: {
              user: true
            }
          },
          signatures: true,
          payments: true
        }
      });

      if (!contract) {
        res.status(404).json({
          success: false,
          error: 'Contrat non trouvé',
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: contract,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération du contrat:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Mettre à jour le statut d'un contrat
   */
  static async updateContractStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const contract = await prisma.contract.update({
        where: { id },
        data: { status }
      });

      const response: ApiResponse = {
        success: true,
        data: contract,
        message: 'Statut du contrat mis à jour avec succès',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut du contrat:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Récupérer le rapport de revenus
   */
  static async getRevenueReport(req: Request, res: Response): Promise<void> {
    try {
      const { period = 'month' } = req.query;
      
      // Logique pour calculer les revenus selon la période
      const revenue = await prisma.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(Date.now() - (period === 'month' ? 30 : 7) * 24 * 60 * 60 * 1000)
          }
        }
      });

      const response: ApiResponse = {
        success: true,
        data: {
          totalRevenue: revenue._sum.amount || 0,
          totalPayments: revenue._count,
          period
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport de revenus:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Récupérer le rapport utilisateurs
   */
  static async getUsersReport(req: Request, res: Response): Promise<void> {
    try {
      const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        _count: true
      });

      const response: ApiResponse = {
        success: true,
        data: usersByRole,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport utilisateurs:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Récupérer le rapport de performance
   */
  static async getPerformanceReport(req: Request, res: Response): Promise<void> {
    try {
      const [totalMissions, completedMissions, totalContracts, activeContracts] = await Promise.all([
        prisma.mission.count(),
        prisma.mission.count({ where: { status: 'COMPLETED' } }),
        prisma.contract.count(),
        prisma.contract.count({ where: { status: 'ACTIVE' } })
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          totalMissions,
          completedMissions,
          missionCompletionRate: totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0,
          totalContracts,
          activeContracts,
          contractActivityRate: totalContracts > 0 ? (activeContracts / totalContracts) * 100 : 0
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération du rapport de performance:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Récupérer les approbations en attente
   */
  static async getPendingApprovals(req: Request, res: Response): Promise<void> {
    try {
      const pendingUsers = await prisma.user.findMany({
        where: { isVerified: false },
        include: {
          talent: true,
          enterprise: true,
          investor: true
        }
      });

      const response: ApiResponse = {
        success: true,
        data: pendingUsers,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des approbations en attente:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Approuver une demande
   */
  static async approveRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await prisma.user.update({
        where: { id },
        data: { isVerified: true }
      });

      const response: ApiResponse = {
        success: true,
        data: user,
        message: 'Demande approuvée avec succès',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de l\'approbation de la demande:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Rejeter une demande
   */
  static async rejectRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: { 
          isActive: false,
          isVerified: false
        }
      });

      const response: ApiResponse = {
        success: true,
        data: user,
        message: 'Demande rejetée avec succès',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors du rejet de la demande:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }
} 