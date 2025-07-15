import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export class NotificationController {
  /**
   * Récupérer toutes les notifications d'un utilisateur
   */
  static async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { page = 1, limit = 20, unreadOnly = false } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const whereClause = {
        userId,
        ...(unreadOnly === 'true' && { isRead: false }),
      };

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit as string),
        }),
        prisma.notification.count({ where: whereClause }),
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          notifications,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
          },
        },
        message: 'Notifications récupérées avec succès',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Marquer une notification comme lue
   */
  static async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const notification = await prisma.notification.update({
        where: { id, userId },
        data: { isRead: true },
      });

      const response: ApiResponse = {
        success: true,
        data: { notification },
        message: 'Notification marquée comme lue',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors du marquage de la notification:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  static async markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;

      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Toutes les notifications ont été marquées comme lues',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors du marquage des notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Supprimer une notification
   */
  static async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      await prisma.notification.delete({
        where: { id, userId },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Notification supprimée avec succès',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Obtenir le nombre de notifications non lues
   */
  static async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;

      const count = await prisma.notification.count({
        where: { userId, isRead: false },
      });

      const response: ApiResponse = {
        success: true,
        data: { count },
        message: 'Nombre de notifications non lues récupéré',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Créer une notification (pour les tests et l'admin)
   */
  static async createNotification(req: Request, res: Response): Promise<void> {
    try {
      const { userId, title, message, type, metadata } = req.body;

      // Vérifier que l'utilisateur est admin ou crée une notification pour lui-même
      const currentUser = (req as any).user;
      if (currentUser.role !== 'ADMIN' && currentUser.id !== userId) {
        res.status(403).json({
          success: false,
          error: 'Accès non autorisé',
        });
        return;
      }

      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      const response: ApiResponse = {
        success: true,
        data: { notification },
        message: 'Notification créée avec succès',
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Erreur lors de la création de la notification:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }
} 