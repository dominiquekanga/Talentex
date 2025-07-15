import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Types pour les requêtes
interface CreateFormationRequest {
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  pdfUrl?: string;
  duration: number; // en minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  domain: string;
}

interface UpdateFormationRequest {
  title?: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  pdfUrl?: string;
  duration?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  domain?: string;
  isActive?: boolean;
}

interface CreateQuizRequest {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

// CREATE - Créer une nouvelle formation
export const createFormation = async (req: Request, res: Response) => {
  try {
    const formationData: CreateFormationRequest = req.body;

    // Créer la formation
    const formation = await prisma.formation.create({
      data: {
        ...formationData,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      data: formation,
      message: 'Formation créée avec succès'
    });
    return;
  } catch (error) {
    console.error('Erreur lors de la création de la formation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
    return;
  }
};

// GET - Récupérer toutes les formations
export const getAllFormations = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, domain, difficulty, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Construire les filtres
    const where: any = {};
    if (domain) where.domain = domain;
    if (difficulty) where.difficulty = difficulty;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [formations, total] = await Promise.all([
      prisma.formation.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              progress: true,
              quizzes: true
            }
          }
        }
      }),
      prisma.formation.count({ where })
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        formations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages
        }
      }
    });
    return;
  } catch (error) {
    console.error('Erreur lors de la récupération des formations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
    return;
  }
};

// GET - Récupérer une formation par ID
export const getFormationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const formation = await prisma.formation.findUnique({
      where: { id },
      include: {
        quizzes: true,
        _count: {
          select: {
            progress: true
          }
        }
      }
    });

    if (!formation) {
      return res.status(404).json({
        success: false,
        error: 'Formation non trouvée'
      });
    }

    res.json({
      success: true,
      data: formation
    });
    return;
  } catch (error) {
    console.error('Erreur lors de la récupération de la formation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
    return;
  }
};

// PUT - Mettre à jour une formation
export const updateFormation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: UpdateFormationRequest = req.body;

    const formation = await prisma.formation.findUnique({
      where: { id }
    });

    if (!formation) {
      return res.status(404).json({
        success: false,
        error: 'Formation non trouvée'
      });
    }

    const updatedFormation = await prisma.formation.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      data: updatedFormation,
      message: 'Formation mise à jour avec succès'
    });
    return;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la formation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
    return;
  }
};

// DELETE - Supprimer une formation
export const deleteFormation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const formation = await prisma.formation.findUnique({
      where: { id }
    });

    if (!formation) {
      return res.status(404).json({
        success: false,
        error: 'Formation non trouvée'
      });
    }

    await prisma.formation.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Formation supprimée avec succès'
    });
    return;
  } catch (error) {
    console.error('Erreur lors de la suppression de la formation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
    return;
  }
};

// GET - Récupérer les formations d'un talent
export const getMyFormations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Vérifier que l'utilisateur est un talent
    const talent = await prisma.talent.findUnique({
      where: { userId }
    });

    if (!talent) {
      return res.status(403).json({
        success: false,
        error: 'Seuls les talents peuvent accéder à leurs formations'
      });
    }

    const formations = await prisma.formationProgress.findMany({
      where: { talentId: talent.id },
      include: {
        formation: {
          include: {
            quizzes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: formations
    });
    return;
  } catch (error) {
    console.error('Erreur lors de la récupération des formations du talent:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
    return;
  }
};

// POST - Commencer une formation
export const startFormation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Vérifier que l'utilisateur est un talent
    const talent = await prisma.talent.findUnique({
      where: { userId }
    });

    if (!talent) {
      return res.status(403).json({
        success: false,
        error: 'Seuls les talents peuvent commencer des formations'
      });
    }

    // Vérifier si la formation existe
    const formation = await prisma.formation.findUnique({
      where: { id }
    });

    if (!formation) {
      return res.status(404).json({
        success: false,
        error: 'Formation non trouvée'
      });
    }

    // Vérifier si le talent a déjà commencé cette formation
    const existingProgress = await prisma.formationProgress.findUnique({
      where: {
        talentId_formationId: {
          talentId: talent.id,
          formationId: id
        }
      }
    });

    if (existingProgress) {
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà commencé cette formation'
      });
    }

    // Créer le suivi de progression
    const progress = await prisma.formationProgress.create({
      data: {
        talentId: talent.id,
        formationId: id,
        progress: 0,
        isCompleted: false
      },
      include: {
        formation: true
      }
    });

    res.status(201).json({
      success: true,
      data: progress,
      message: 'Formation commencée avec succès'
    });
    return;

  } catch (error) {
    console.error('Erreur lors du démarrage de la formation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
    return;
  }
};

// PUT - Mettre à jour la progression d'une formation
export const updateProgress = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    const userId = (req as any).user.userId;

    // Vérifier que l'utilisateur est un talent
    const talent = await prisma.talent.findUnique({
      where: { userId }
    });

    if (!talent) {
      return res.status(403).json({
        success: false,
        error: 'Seuls les talents peuvent mettre à jour leur progression'
      });
    }

    // Vérifier si la progression existe
    const existingProgress = await prisma.formationProgress.findUnique({
      where: {
        talentId_formationId: {
          talentId: talent.id,
          formationId: id
        }
      }
    });

    if (!existingProgress) {
      return res.status(404).json({
        success: false,
        error: 'Progression non trouvée'
      });
    }

    // Mettre à jour la progression
    const updatedProgress = await prisma.formationProgress.update({
      where: {
        talentId_formationId: {
          talentId: talent.id,
          formationId: id
        }
      },
      data: {
        progress: Math.min(progress, 100),
        isCompleted: progress >= 100,
        completedAt: progress >= 100 ? new Date() : null
      },
      include: {
        formation: true
      }
    });

    res.json({
      success: true,
      data: updatedProgress,
      message: 'Progression mise à jour avec succès'
    });
    return;

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la progression:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
    return;
  }
};

// POST - Ajouter un quiz à une formation
export const addQuiz = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const quizData: CreateQuizRequest = req.body;

    // Vérifier si la formation existe
    const formation = await prisma.formation.findUnique({
      where: { id }
    });

    if (!formation) {
      return res.status(404).json({
        success: false,
        error: 'Formation non trouvée'
      });
    }

    // Créer le quiz
    const quiz = await prisma.quiz.create({
      data: {
        ...quizData,
        formationId: id
      }
    });

    res.status(201).json({
      success: true,
      data: quiz,
      message: 'Quiz ajouté avec succès'
    });
    return;

  } catch (error) {
    console.error('Erreur lors de l\'ajout du quiz:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
    return;
  }
};

// GET - Récupérer les statistiques des formations
export const getFormationStats = async (req: Request, res: Response) => {
  try {
    const stats = await prisma.$transaction(async (tx) => {
      const totalFormations = await tx.formation.count();
      const activeFormations = await tx.formation.count({ where: { isActive: true } });
      const totalProgress = await tx.formationProgress.count();
      const completedProgress = await tx.formationProgress.count({ where: { isCompleted: true } });
      const totalQuizzes = await tx.quiz.count();

      return {
        totalFormations,
        activeFormations,
        totalProgress,
        completedProgress,
        totalQuizzes,
        completionRate: totalProgress > 0 ? (completedProgress / totalProgress) * 100 : 0
      };
    });

    res.json({
      success: true,
      data: stats
    });
    return;

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
    return;
  }
}; 