import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Types pour les requêtes
interface CreateEnterpriseRequest {
  email: string;
  password: string;
  name: string;
  description?: string;
  industry?: string;
  size?: string;
  website?: string;
}

interface UpdateEnterpriseRequest {
  name?: string;
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: string;
  isVerified?: boolean;
}

interface EnterpriseStats {
  totalMissions: number;
  activeMissions: number;
  completedMissions: number;
  totalSpent: number;
  averageRating: number;
  totalContracts: number;
  activeContracts: number;
  responseRate: number;
  completionRate: number;
}

// CREATE - Créer une nouvelle entreprise
export const createEnterprise = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      name,
      description,
      industry,
      size,
      website
    }: CreateEnterpriseRequest = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'Un utilisateur avec cet email existe déjà'
      });
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur et l'entreprise en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'ENTERPRISE',
          isVerified: false
        }
      });

      // Créer le profil entreprise
      const enterprise = await tx.enterprise.create({
        data: {
          userId: user.id,
          name,
          description,
          industry,
          size,
          website
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
              isVerified: true,
              createdAt: true
            }
          }
        }
      });

      return enterprise;
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Entreprise créée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'entreprise:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// READ - Récupérer toutes les entreprises (avec pagination et filtres avancés)
export const getAllEnterprises = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      industry,
      size,
      isVerified,
      search,
      hasSubscription,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Construire les filtres
    const where: any = {};

    if (industry) {
      where.industry = industry;
    }

    if (size) {
      where.size = size;
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    if (hasSubscription !== undefined) {
      if (hasSubscription === 'true') {
        where.subscription = { isNot: null };
      } else {
        where.subscription = null;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { industry: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Définir l'ordre de tri
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder as string;

    // Récupérer les entreprises avec pagination
    const [enterprises, total] = await Promise.all([
      prisma.enterprise.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
              isVerified: true,
              createdAt: true
            }
          },
          subscription: true,
          _count: {
            select: {
              missions: true,
              contracts: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy
      }),
      prisma.enterprise.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        enterprises,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des entreprises:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// READ - Récupérer une entreprise par ID (avec détails complets)
export const getEnterpriseById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const enterprise = await prisma.enterprise.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            isVerified: true,
            createdAt: true
          }
        },
        subscription: true,
        missions: {
          select: {
            id: true,
            title: true,
            description: true,
            domain: true,
            duration: true,
            budget: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        contracts: {
          select: {
            id: true,
            amount: true,
            status: true,
            startDate: true,
            endDate: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            missions: true,
            contracts: true
          }
        }
      }
    });

    if (!enterprise) {
      res.status(404).json({
        success: false,
        error: 'Entreprise non trouvée'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: enterprise
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'entreprise:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// UPDATE - Mettre à jour une entreprise
export const updateEnterprise = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateEnterpriseRequest = req.body;

    // Vérifier si l'entreprise existe
    const existingEnterprise = await prisma.enterprise.findUnique({
      where: { id }
    });

    if (!existingEnterprise) {
      res.status(404).json({
        success: false,
        error: 'Entreprise non trouvée'
      });
      return;
    }

    const updatedEnterprise = await prisma.enterprise.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            isVerified: true,
            createdAt: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedEnterprise,
      message: 'Entreprise mise à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'entreprise:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// DELETE - Supprimer une entreprise
export const deleteEnterprise = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Vérifier si l'entreprise existe
    const existingEnterprise = await prisma.enterprise.findUnique({
      where: { id }
    });

    if (!existingEnterprise) {
      res.status(404).json({
        success: false,
        error: 'Entreprise non trouvée'
      });
      return;
    }

    // Supprimer l'entreprise et l'utilisateur associé en transaction
    await prisma.$transaction(async (tx) => {
      await tx.enterprise.delete({
        where: { id }
      });

      await tx.user.delete({
        where: { id: existingEnterprise.userId }
      });
    });

    res.status(200).json({
      success: true,
      message: 'Entreprise supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'entreprise:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// GET - Récupérer mon profil (pour l'entreprise connectée)
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const enterprise = await prisma.enterprise.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            isVerified: true,
            createdAt: true
          }
        },
        subscription: true,
        missions: {
          select: {
            id: true,
            title: true,
            description: true,
            domain: true,
            duration: true,
            budget: true,
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        contracts: {
          select: {
            id: true,
            amount: true,
            status: true,
            startDate: true,
            endDate: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!enterprise) {
      res.status(404).json({
        success: false,
        error: 'Profil entreprise non trouvé'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: enterprise
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// PUT - Mettre à jour mon profil
export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const updateData: UpdateEnterpriseRequest = req.body;

    // Vérifier si l'entreprise existe
    const existingEnterprise = await prisma.enterprise.findUnique({
      where: { userId }
    });

    if (!existingEnterprise) {
      res.status(404).json({
        success: false,
        error: 'Profil entreprise non trouvé'
      });
      return;
    }

    const updatedEnterprise = await prisma.enterprise.update({
      where: { userId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            isVerified: true,
            createdAt: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: updatedEnterprise,
      message: 'Profil mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// POST - Vérifier une entreprise (admin uniquement)
export const verifyEnterprise = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const enterprise = await prisma.enterprise.update({
      where: { id },
      data: { isVerified },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            isVerified: true,
            createdAt: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: enterprise,
      message: `Entreprise ${isVerified ? 'vérifiée' : 'non vérifiée'} avec succès`
    });

  } catch (error) {
    console.error('Erreur lors de la vérification de l\'entreprise:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// NOUVEAUX ENDPOINTS AVANCÉS

// GET - Statistiques de l'entreprise
export const getEnterpriseStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const stats = await prisma.$transaction(async (tx) => {
      const enterprise = await tx.enterprise.findUnique({
        where: { userId },
        include: {
          missions: true,
          contracts: true
        }
      });

      if (!enterprise) {
        throw new Error('Entreprise non trouvée');
      }

      const totalMissions = enterprise.missions.length;
      const activeMissions = enterprise.missions.filter(m => m.status === 'open').length;
      const completedMissions = enterprise.missions.filter(m => m.status === 'completed').length;
      const totalSpent = enterprise.contracts.reduce((sum, c) => sum + (c.amount || 0), 0);
      const totalContracts = enterprise.contracts.length;
      const activeContracts = enterprise.contracts.filter(c => c.status === 'active').length;
      
      // Calculer le taux de réponse (missions avec candidats / total missions)
      const responseRate = totalMissions > 0 ? 75 : 0; // Simulé pour l'instant
      
      // Calculer le taux de completion (missions terminées / missions actives)
      const completionRate = activeMissions > 0 ? (completedMissions / activeMissions) * 100 : 0;

      // Calculer la note moyenne (simulée pour l'instant)
      const averageRating = 4.2; // À remplacer par un vrai système de notation

      return {
        totalMissions,
        activeMissions,
        completedMissions,
        totalSpent,
        averageRating,
        totalContracts,
        activeContracts,
        responseRate,
        completionRate
      };
    });

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// GET - Talents recommandés pour l'entreprise
export const getRecommendedTalents = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { limit = '10', domain, skills } = req.query;

    // Construire les filtres pour les talents
    const where: any = {
      isAvailable: true
    };

    if (domain) {
      where.domain = {
        has: domain as string
      };
    }

    if (skills) {
      where.skills = {
        hasSome: Array.isArray(skills) ? skills : [skills]
      };
    }

    // Récupérer les talents avec filtres
    const talents = await prisma.talent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isVerified: true
          }
        },
        _count: {
          select: {
            missions: true,
            contracts: true
          }
        }
      },
      orderBy: { score: 'desc' },
      take: parseInt(limit as string)
    });

    // Calculer un score de compatibilité pour chaque talent
    const talentsWithScore = talents.map(talent => {
      let score = 0;
      
      // Score basé sur le score du talent
      score += talent.score * 0.5;
      
      // Score basé sur l'expérience
      score += talent.experience * 2;
      
      // Score basé sur le nombre de missions réussies
      score += talent._count.missions * 5;

      return {
        ...talent,
        compatibilityScore: Math.min(100, score)
      };
    });

    // Trier par score de compatibilité
    talentsWithScore.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.status(200).json({
      success: true,
      data: talentsWithScore
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des talents recommandés:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// POST - Upload de logo
export const uploadLogo = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    // Ici, on simule l'upload. En production, utiliser Cloudinary ou AWS S3
    const logoUrl = `https://cloudinary.com/logo/${uuidv4()}.png`;
    
    await prisma.enterprise.update({
      where: { userId },
      data: { logo: logoUrl }
    });

    res.status(200).json({
      success: true,
      data: { logoUrl },
      message: 'Logo uploadé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload du logo:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// GET - Historique des missions
export const getMissionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { page = '1', limit = '10', status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Récupérer l'entreprise pour avoir son ID
    const enterprise = await prisma.enterprise.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!enterprise) {
      res.status(404).json({
        success: false,
        error: 'Entreprise non trouvée'
      });
      return;
    }

    // Construire les filtres
    const where: any = {
      enterpriseId: enterprise.id
    };

    if (status) {
      where.status = status;
    }

    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
        where,
        include: {
          talents: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              score: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.mission.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: {
        missions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// GET - Top entreprises par industrie
export const getTopEnterprisesByIndustry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { industry, limit = '10' } = req.params;

    const enterprises = await prisma.enterprise.findMany({
      where: {
        industry: industry,
        isVerified: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isVerified: true
          }
        },
        subscription: true,
        _count: {
          select: {
            missions: true,
            contracts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: enterprises
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des top entreprises:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// POST - Créer un abonnement
export const createSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { plan, stripeId } = req.body;

    // Récupérer l'entreprise
    const enterprise = await prisma.enterprise.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!enterprise) {
      res.status(404).json({
        success: false,
        error: 'Entreprise non trouvée'
      });
      return;
    }

    // Créer ou mettre à jour l'abonnement
    const subscription = await prisma.subscription.upsert({
      where: { enterpriseId: enterprise.id },
      update: {
        plan,
        stripeId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 jours
      },
      create: {
        enterpriseId: enterprise.id,
        plan,
        stripeId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 jours
      }
    });

    res.status(200).json({
      success: true,
      data: subscription,
      message: 'Abonnement créé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'abonnement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
}; 