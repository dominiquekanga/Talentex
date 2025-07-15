import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Types pour les requêtes
interface CreateMissionRequest {
  title: string;
  description: string;
  domain: string[];
  skills: string[];
  duration: number; // en jours
  budget: number;
  location?: string;
  isRemote?: boolean;
}

interface UpdateMissionRequest {
  title?: string;
  description?: string;
  domain?: string[];
  skills?: string[];
  duration?: number;
  budget?: number;
  location?: string;
  isRemote?: boolean;
  status?: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

// CREATE - Créer une nouvelle mission
export const createMission = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const missionData: CreateMissionRequest = req.body;

    // Vérifier que l'utilisateur est une entreprise
    const enterprise = await prisma.enterprise.findUnique({
      where: { userId }
    });

    if (!enterprise) {
      res.status(403).json({
        success: false,
        error: 'Seules les entreprises peuvent créer des missions'
      });
      return;
    }

    // Créer la mission
    const mission = await prisma.mission.create({
      data: {
        ...missionData,
        enterpriseId: enterprise.id,
        status: 'OPEN'
      },
      include: {
        enterprise: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                isVerified: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: mission,
      message: 'Mission créée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la création de la mission:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// READ - Récupérer toutes les missions (avec pagination et filtres)
export const getAllMissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '10',
      domain,
      skills,
      minBudget,
      maxBudget,
      minDuration,
      maxDuration,
      status,
      isRemote,
      search
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

    if (minBudget || maxBudget) {
      where.budget = {};
      if (minBudget) where.budget.gte = parseFloat(minBudget as string);
      if (maxBudget) where.budget.lte = parseFloat(maxBudget as string);
    }

    if (minDuration || maxDuration) {
      where.duration = {};
      if (minDuration) where.duration.gte = parseInt(minDuration as string);
      if (maxDuration) where.duration.lte = parseInt(maxDuration as string);
    }

    if (status) {
      where.status = status;
    }

    if (isRemote !== undefined) {
      where.isRemote = isRemote === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Récupérer les missions avec pagination
    const [missions, total] = await Promise.all([
      prisma.mission.findMany({
        where,
        include: {
          enterprise: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                  isActive: true,
                  isVerified: true
                }
              }
            }
          },
          talents: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          },
          matchings: {
            include: {
              talent: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true
                    }
                  }
                }
              }
            }
          },
          _count: {
            select: {
              talents: true,
              matchings: true,
              contracts: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.mission.count({ where })
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        missions,
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
    console.error('Erreur lors de la récupération des missions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// READ - Récupérer une mission par ID
export const getMissionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const mission = await prisma.mission.findUnique({
      where: { id },
      include: {
        enterprise: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                isVerified: true
              }
            }
          }
        },
        talents: {
          include: {
            user: {
              select: {
                id: true,
                email: true
              }
            }
          }
        },
        matchings: {
          include: {
            talent: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        contracts: {
          include: {
            talent: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!mission) {
      res.status(404).json({
        success: false,
        error: 'Mission non trouvée'
      });
      return;
    }

    res.json({
      success: true,
      data: mission
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la mission:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// UPDATE - Mettre à jour une mission
export const updateMission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const updateData: UpdateMissionRequest = req.body;

    // Vérifier si la mission existe
    const existingMission = await prisma.mission.findUnique({
      where: { id },
      include: {
        enterprise: true
      }
    });

    if (!existingMission) {
      res.status(404).json({
        success: false,
        error: 'Mission non trouvée'
      });
      return;
    }

    // Vérifier que l'utilisateur est propriétaire de la mission ou admin
    if (existingMission.enterprise.userId !== userId && (req as any).user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
      return;
    }

    // Mettre à jour la mission
    const updatedMission = await prisma.mission.update({
      where: { id },
      data: updateData,
      include: {
        enterprise: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                isActive: true,
                isVerified: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedMission,
      message: 'Mission mise à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la mission:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// DELETE - Supprimer une mission
export const deleteMission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Vérifier si la mission existe
    const existingMission = await prisma.mission.findUnique({
      where: { id },
      include: {
        enterprise: true
      }
    });

    if (!existingMission) {
      res.status(404).json({
        success: false,
        error: 'Mission non trouvée'
      });
      return;
    }

    // Vérifier que l'utilisateur est propriétaire de la mission ou admin
    if (existingMission.enterprise.userId !== userId && (req as any).user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Accès non autorisé'
      });
      return;
    }

    // Supprimer la mission
    await prisma.mission.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Mission supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la mission:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// GET - Récupérer les missions de l'entreprise connectée
export const getMyMissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    // Vérifier que l'utilisateur est une entreprise
    const enterprise = await prisma.enterprise.findUnique({
      where: { userId }
    });

    if (!enterprise) {
      res.status(403).json({
        success: false,
        error: 'Seules les entreprises peuvent accéder à leurs missions'
      });
      return;
    }

    const missions = await prisma.mission.findMany({
      where: { enterpriseId: enterprise.id },
      include: {
        talents: {
          include: {
            user: {
              select: {
                id: true,
                email: true
              }
            }
          }
        },
        matchings: {
          include: {
            talent: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        contracts: {
          include: {
            talent: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            talents: true,
            matchings: true,
            contracts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: missions
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des missions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// POST - Postuler à une mission (pour les talents)
export const applyToMission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Vérifier que l'utilisateur est un talent
    const talent = await prisma.talent.findUnique({
      where: { userId }
    });

    if (!talent) {
      res.status(403).json({
        success: false,
        error: 'Seuls les talents peuvent postuler aux missions'
      });
      return;
    }

    // Vérifier si la mission existe
    const mission = await prisma.mission.findUnique({
      where: { id }
    });

    if (!mission) {
      res.status(404).json({
        success: false,
        error: 'Mission non trouvée'
      });
      return;
    }

    // Vérifier si le talent a déjà postulé
    const existingApplication = await prisma.matching.findUnique({
      where: {
        missionId_talentId: {
          missionId: id,
          talentId: talent.id
        }
      }
    });

    if (existingApplication) {
      res.status(400).json({
        success: false,
        error: 'Vous avez déjà postulé à cette mission'
      });
      return;
    }

    // Calculer un score de matching basique
    const score = calculateMatchingScore(talent, mission);

    // Créer la candidature
    const application = await prisma.matching.create({
      data: {
        missionId: id,
        talentId: talent.id,
        score,
        status: 'pending'
      },
      include: {
        mission: {
          include: {
            enterprise: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        talent: {
          include: {
            user: {
              select: {
                id: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: application,
      message: 'Candidature envoyée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la candidature:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
};

// Fonction pour calculer le score de matching
function calculateMatchingScore(talent: any, mission: any): number {
  let score = 0;

  // Score basé sur les domaines communs
  const commonDomains = talent.domain.filter((d: string) => 
    mission.domain.includes(d)
  );
  score += commonDomains.length * 20;

  // Score basé sur les compétences communes
  const commonSkills = talent.skills.filter((s: string) => 
    mission.skills.includes(s)
  );
  score += commonSkills.length * 15;

  // Score basé sur l'expérience
  if (talent.experience >= mission.duration / 30) { // expérience suffisante
    score += 25;
  }

  // Score basé sur la disponibilité
  if (talent.isAvailable) {
    score += 10;
  }

  return Math.min(score, 100); // Score maximum de 100
} 