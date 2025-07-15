import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { ApiResponse } from '../types';

export class AcademyController {
  /**
   * Récupérer toutes les formations
   */
  static async getAllFormations(req: Request, res: Response): Promise<void> {
    try {
      const formations = await prisma.formation.findMany({
        where: { isActive: true },
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
   * Récupérer une formation par ID
   */
  static async getFormationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const formation = await prisma.formation.findUnique({
        where: { id }
      });

      if (!formation) {
        res.status(404).json({
          success: false,
          error: 'Formation non trouvée',
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: formation,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération de la formation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Récupérer la progression de l'utilisateur
   */
  static async getUserProgress(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;

      // Récupérer le talent associé à l'utilisateur
      const talent = await prisma.talent.findUnique({
        where: { userId }
      });

      if (!talent) {
        res.status(404).json({
          success: false,
          error: 'Profil talent non trouvé',
        });
        return;
      }

      const progress = await prisma.formationProgress.findMany({
        where: { talentId: talent.id },
        include: {
          formation: true
        }
      });

      const response: ApiResponse = {
        success: true,
        data: progress,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération de la progression:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Commencer une formation
   */
  static async startFormation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      // Récupérer le talent associé à l'utilisateur
      const talent = await prisma.talent.findUnique({
        where: { userId }
      });

      if (!talent) {
        res.status(404).json({
          success: false,
          error: 'Profil talent non trouvé',
        });
        return;
      }

      // Vérifier si la formation existe
      const formation = await prisma.formation.findUnique({
        where: { id }
      });

      if (!formation) {
        res.status(404).json({
          success: false,
          error: 'Formation non trouvée',
        });
        return;
      }

      // Vérifier si l'utilisateur a déjà commencé cette formation
      let progress = await prisma.formationProgress.findFirst({
        where: {
          talentId: talent.id,
          formationId: id
        }
      });

      if (!progress) {
        // Créer une nouvelle progression
        progress = await prisma.formationProgress.create({
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
      }

      const response: ApiResponse = {
        success: true,
        data: progress,
        message: 'Formation commencée avec succès',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors du démarrage de la formation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Mettre à jour la progression
   */
  static async updateProgress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { progress: newProgress } = req.body;
      const userId = (req as any).user.id;

      // Récupérer le talent associé à l'utilisateur
      const talent = await prisma.talent.findUnique({
        where: { userId }
      });

      if (!talent) {
        res.status(404).json({
          success: false,
          error: 'Profil talent non trouvé',
        });
        return;
      }

      const progress = await prisma.formationProgress.updateMany({
        where: {
          talentId: talent.id,
          formationId: id
        },
        data: {
          progress: Math.min(100, Math.max(0, newProgress))
        }
      });

      const updatedProgress = await prisma.formationProgress.findFirst({
        where: {
          talentId: talent.id,
          formationId: id
        },
        include: {
          formation: true
        }
      });

      const response: ApiResponse = {
        success: true,
        data: updatedProgress,
        message: 'Progression mise à jour avec succès',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la progression:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Terminer une formation
   */
  static async completeFormation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      // Récupérer le talent associé à l'utilisateur
      const talent = await prisma.talent.findUnique({
        where: { userId }
      });

      if (!talent) {
        res.status(404).json({
          success: false,
          error: 'Profil talent non trouvé',
        });
        return;
      }

      // Mettre à jour la progression à 100% et marquer comme terminée
      const progress = await prisma.formationProgress.updateMany({
        where: {
          talentId: talent.id,
          formationId: id
        },
        data: {
          progress: 100,
          isCompleted: true,
          completedAt: new Date()
        }
      });

      const updatedProgress = await prisma.formationProgress.findFirst({
        where: {
          talentId: talent.id,
          formationId: id
        },
        include: {
          formation: true
        }
      });

      const response: ApiResponse = {
        success: true,
        data: {
          progress: updatedProgress,
          message: 'Certificat généré avec succès'
        },
        message: 'Formation terminée avec succès !',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la finalisation de la formation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Récupérer les certificats de l'utilisateur
   */
  static async getUserCertificates(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;

      // Pour l'instant, retourner les formations complétées
      const talent = await prisma.talent.findUnique({
        where: { userId }
      });

      if (!talent) {
        res.status(404).json({
          success: false,
          error: 'Profil talent non trouvé',
        });
        return;
      }

      const completedFormations = await prisma.formationProgress.findMany({
        where: { 
          talentId: talent.id,
          isCompleted: true
        },
        include: {
          formation: true
        },
        orderBy: { completedAt: 'desc' }
      });

      const response: ApiResponse = {
        success: true,
        data: completedFormations,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des certificats:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }
} 