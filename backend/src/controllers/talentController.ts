import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Types pour les requêtes
interface CreateTalentRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  bio?: string;
  domain?: string[];
  skills?: string[];
  experience?: number;
  hourlyRate?: number;
}

interface UpdateTalentRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  photo?: string;
  cvUrl?: string;
  videoUrl?: string;
  domain?: string[];
  skills?: string[];
  experience?: number;
  hourlyRate?: number;
  isAvailable?: boolean;
  score?: number;
}

interface TalentStats {
  totalMissions: number;
  completedMissions: number;
  averageRating: number;
  totalEarnings: number;
  skillsCount: number;
  certificatesCount: number;
  responseRate: number;
  completionRate: number;
}

// CREATE - Créer un nouveau talent
export const createTalent = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      bio,
      domain = [],
      skills = [],
      experience = 0,
      hourlyRate
    }: CreateTalentRequest = req.body;

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

    // Calculer le score initial basé sur l'expérience et les compétences
    const initialScore = Math.min(100, Math.max(10, 
      (experience * 5) + (skills.length * 2) + (domain.length * 3)
    ));

    // Créer l'utilisateur et le talent en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'TALENT',
          isVerified: true
        }
      });

      // Créer le profil talent
      const talent = await tx.talent.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          bio,
          domain,
          skills,
          experience,
          hourlyRate,
          score: initialScore,
          isAvailable: true
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

      return talent;
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Talent créé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la création du talent:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// READ - Récupérer tous les talents (avec pagination et filtres avancés)
export const getAllTalents = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      domain,
      skills,
      minExperience,
      maxExperience,
      minHourlyRate,
      maxHourlyRate,
      isAvailable,
      search,
      minScore,
      maxScore,
      location,
      remoteWork,
      sortBy = 'score',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Construire les filtres
    const where: any = {};

    if (domain) {
      where.domain = {
        hasSome: Array.isArray(domain) ? domain : [domain]
      };
    }

    if (skills) {
      where.skills = {
        hasSome: Array.isArray(skills) ? skills : [skills]
      };
    }

    if (minExperience || maxExperience) {
      where.experience = {};
      if (minExperience) where.experience.gte = parseInt(minExperience as string);
      if (maxExperience) where.experience.lte = parseInt(maxExperience as string);
    }

    if (minHourlyRate || maxHourlyRate) {
      where.hourlyRate = {};
      if (minHourlyRate) where.hourlyRate.gte = parseFloat(minHourlyRate as string);
      if (maxHourlyRate) where.hourlyRate.lte = parseFloat(maxHourlyRate as string);
    }

    if (minScore || maxScore) {
      where.score = {};
      if (minScore) where.score.gte = parseInt(minScore as string);
      if (maxScore) where.score.lte = parseInt(maxScore as string);
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable === 'true';
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { bio: { contains: search as string, mode: 'insensitive' } },
        { skills: { has: search as string } }
      ];
    }

    // Définir l'ordre de tri
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder as string;

    // Récupérer les talents avec pagination
    const [talents, total] = await Promise.all([
      prisma.talent.findMany({
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
      prisma.talent.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        talents,
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
    console.error('Erreur lors de la récupération des talents:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// READ - Récupérer un talent par ID (avec détails complets)
export const getTalentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const talent = await prisma.talent.findUnique({
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
        formations: {
          include: {
            formation: {
              select: {
                id: true,
                title: true,
                domain: true,
                duration: true,
                difficulty: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            missions: true,
            contracts: true,
            formations: true
          }
        }
      }
    });

    if (!talent) {
      res.status(404).json({
        success: false,
        error: 'Talent non trouvé'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: talent
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du talent:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// UPDATE - Mettre à jour un talent
export const updateTalent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateTalentRequest = req.body;

    // Vérifier si le talent existe
    const existingTalent = await prisma.talent.findUnique({
      where: { id }
    });

    if (!existingTalent) {
      res.status(404).json({
        success: false,
        error: 'Talent non trouvé'
      });
      return;
    }

    // Recalculer le score si les compétences ou l'expérience changent
    if (updateData.skills || updateData.experience || updateData.domain) {
      const currentTalent = await prisma.talent.findUnique({
        where: { id },
        select: { skills: true, experience: true, domain: true }
      });

      if (currentTalent) {
        const newSkills = updateData.skills || currentTalent.skills;
        const newExperience = updateData.experience || currentTalent.experience;
        const newDomain = updateData.domain || currentTalent.domain;

        const newScore = Math.min(100, Math.max(10, 
          (newExperience * 5) + (newSkills.length * 2) + (newDomain.length * 3)
        ));

        updateData.score = newScore;
      }
    }

    const updatedTalent = await prisma.talent.update({
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
      data: updatedTalent
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du talent:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// DELETE - Supprimer un talent
export const deleteTalent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Vérifier si le talent existe
    const existingTalent = await prisma.talent.findUnique({
      where: { id }
    });

    if (!existingTalent) {
      res.status(404).json({
        success: false,
        error: 'Talent non trouvé'
      });
      return;
    }

    // Supprimer le talent et l'utilisateur associé en transaction
    await prisma.$transaction(async (tx) => {
      await tx.talent.delete({
        where: { id }
      });

      await tx.user.delete({
        where: { id: existingTalent.userId }
      });
    });

    res.status(200).json({
      success: true,
      message: 'Talent supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du talent:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// GET - Récupérer mon profil (pour le talent connecté)
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const talent = await prisma.talent.findUnique({
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
        },
        formations: {
          include: {
            formation: {
              select: {
                id: true,
                title: true,
                domain: true,
                duration: true,
                difficulty: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!talent) {
      res.status(404).json({
        success: false,
        error: 'Profil talent non trouvé'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: talent
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
    const updateData: UpdateTalentRequest = req.body;

    // Vérifier si le talent existe
    const existingTalent = await prisma.talent.findUnique({
      where: { userId }
    });

    if (!existingTalent) {
      res.status(404).json({
        success: false,
        error: 'Profil talent non trouvé'
      });
      return;
    }

    // Recalculer le score si nécessaire
    if (updateData.skills || updateData.experience || updateData.domain) {
      const currentTalent = await prisma.talent.findUnique({
        where: { userId },
        select: { skills: true, experience: true, domain: true }
      });

      if (currentTalent) {
        const newSkills = updateData.skills || currentTalent.skills;
        const newExperience = updateData.experience || currentTalent.experience;
        const newDomain = updateData.domain || currentTalent.domain;

        const newScore = Math.min(100, Math.max(10, 
          (newExperience * 5) + (newSkills.length * 2) + (newDomain.length * 3)
        ));

        updateData.score = newScore;
      }
    }

    const updatedTalent = await prisma.talent.update({
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
      data: updatedTalent,
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

// NOUVEAUX ENDPOINTS AVANCÉS

// GET - Statistiques du talent
export const getTalentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;

    const stats = await prisma.$transaction(async (tx) => {
      const talent = await tx.talent.findUnique({
        where: { userId },
        include: {
          missions: true,
          contracts: true,
          formations: {
            include: {
              formation: true
            }
          }
        }
      });

      if (!talent) {
        throw new Error('Talent non trouvé');
      }

      const totalMissions = talent.missions.length;
      const completedMissions = talent.missions.filter(m => m.status === 'completed').length;
      const totalEarnings = talent.contracts.reduce((sum, c) => sum + (c.amount || 0), 0);
      const skillsCount = talent.skills.length;
      const certificatesCount = talent.formations.filter(f => f.isCompleted).length;
      
      // Calculer le taux de réponse (missions acceptées / total proposées)
      const responseRate = totalMissions > 0 ? (completedMissions / totalMissions) * 100 : 0;
      
      // Calculer le taux de completion (missions terminées / missions acceptées)
      const completionRate = completedMissions > 0 ? 100 : 0;

      // Calculer la note moyenne (simulée pour l'instant)
      const averageRating = 4.5; // À remplacer par un vrai système de notation

      return {
        totalMissions,
        completedMissions,
        averageRating,
        totalEarnings,
        skillsCount,
        certificatesCount,
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

// GET - Missions recommandées pour le talent
export const getRecommendedMissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { limit = '10' } = req.query;

    const talent = await prisma.talent.findUnique({
      where: { userId },
      select: {
        domain: true,
        skills: true,
        experience: true,
        hourlyRate: true
      }
    });

    if (!talent) {
      res.status(404).json({
        success: false,
        error: 'Talent non trouvé'
      });
      return;
    }

    // Algorithme de recommandation basique
    const recommendedMissions = await prisma.mission.findMany({
      where: {
        status: 'open',
        domain: {
          hasSome: talent.domain
        },
        budget: {
          gte: talent.hourlyRate ? talent.hourlyRate * 0.8 : 0,
          lte: talent.hourlyRate ? talent.hourlyRate * 1.5 : 999999
        }
      },
      include: {
        enterprise: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      },
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' }
    });

    // Calculer un score de compatibilité pour chaque mission
    const missionsWithScore = recommendedMissions.map(mission => {
      let score = 0;
      
      // Score basé sur les domaines communs
      const commonDomains = talent.domain.filter(d => mission.domain.includes(d));
      score += commonDomains.length * 20;
      
      // Score basé sur les compétences
      const commonSkills = talent.skills.filter(s => 
        mission.description.toLowerCase().includes(s.toLowerCase())
      );
      score += commonSkills.length * 10;
      
      // Score basé sur l'expérience
      if (mission.skills && talent.experience >= 2) {
        score += 15;
      }
      
      // Score basé sur la rémunération
      if (talent.hourlyRate && mission.budget) {
        const ratio = mission.budget / talent.hourlyRate;
        if (ratio >= 0.9 && ratio <= 1.3) score += 10;
      }

      return {
        ...mission,
        compatibilityScore: Math.min(100, score)
      };
    });

    // Trier par score de compatibilité
    missionsWithScore.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.status(200).json({
      success: true,
      data: missionsWithScore
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des missions recommandées:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// POST - Upload de CV
export const uploadCV = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    // Ici, on simule l'upload. En production, utiliser Cloudinary ou AWS S3
    const cvUrl = `https://cloudinary.com/cv/${uuidv4()}.pdf`;
    
    await prisma.talent.update({
      where: { userId },
      data: { cvUrl }
    });

    res.status(200).json({
      success: true,
      data: { cvUrl },
      message: 'CV uploadé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload du CV:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// POST - Upload de vidéo de présentation
export const uploadVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    // Ici, on simule l'upload. En production, utiliser Cloudinary ou AWS S3
    const videoUrl = `https://cloudinary.com/video/${uuidv4()}.mp4`;
    
    await prisma.talent.update({
      where: { userId },
      data: { videoUrl }
    });

    res.status(200).json({
      success: true,
      data: { videoUrl },
      message: 'Vidéo uploadée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload de la vidéo:', error);
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
    const { page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Récupérer le talent pour avoir son ID
    const talent = await prisma.talent.findUnique({
      where: { userId },
      select: { id: true }
    });

    if (!talent) {
      res.status(404).json({
        success: false,
        error: 'Talent non trouvé'
      });
      return;
    }

    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
        where: {
          talents: {
            some: {
              id: talent.id
            }
          }
        },
        include: {
          enterprise: {
            select: {
              id: true,
              name: true,
              logo: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.mission.count({
        where: {
          talents: {
            some: {
              id: talent.id
            }
          }
        }
      })
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

// GET - Top talents par domaine
export const getTopTalentsByDomain = async (req: Request, res: Response): Promise<void> => {
  try {
    const { domain } = req.params;
    const { limit = '10' } = req.query;

    const talents = await prisma.talent.findMany({
      where: {
        domain: {
          has: domain
        },
        isAvailable: true
      },
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

    res.status(200).json({
      success: true,
      data: talents
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des top talents:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
}; 