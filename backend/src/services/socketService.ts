import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface NotificationData {
  id: string;
  type: 'CONTRACT_CREATED' | 'CONTRACT_SIGNED' | 'PAYMENT_RECEIVED' | 'MISSION_ASSIGNED' | 'FORMATION_COMPLETED' | 'MATCHING_FOUND';
  title: string;
  message: string;
  userId: string;
  isRead: boolean;
  metadata?: any;
  createdAt: Date;
}

export class SocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Middleware d'authentification Socket.io
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Token d\'authentification manquant'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            talent: true,
            enterprise: true,
            investor: true,
            admin: true,
          },
        });

        if (!user) {
          return next(new Error('Utilisateur non trouvé'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Token invalide'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = socket.data.user;
      console.log(`🔌 Utilisateur connecté: ${user.email} (${user.role})`);

      // Associer l'utilisateur à son socket
      this.userSockets.set(user.id, socket.id);

      // Rejoindre les rooms spécifiques à l'utilisateur
      socket.join(`user:${user.id}`);
      socket.join(`role:${user.role}`);

      // Événement de déconnexion
      socket.on('disconnect', () => {
        console.log(`🔌 Utilisateur déconnecté: ${user.email}`);
        this.userSockets.delete(user.id);
      });

      // Marquer une notification comme lue
      socket.on('markNotificationRead', async (notificationId: string) => {
        try {
          await prisma.notification.update({
            where: { id: notificationId, userId: user.id },
            data: { isRead: true },
          });

          socket.emit('notificationUpdated', { id: notificationId, isRead: true });
        } catch (error) {
          socket.emit('error', { message: 'Erreur lors de la mise à jour de la notification' });
        }
      });

      // Marquer toutes les notifications comme lues
      socket.on('markAllNotificationsRead', async () => {
        try {
          await prisma.notification.updateMany({
            where: { userId: user.id, isRead: false },
            data: { isRead: true },
          });

          socket.emit('allNotificationsRead');
        } catch (error) {
          socket.emit('error', { message: 'Erreur lors de la mise à jour des notifications' });
        }
      });

      // Demander les notifications non lues
      socket.on('getUnreadNotifications', async () => {
        try {
          const notifications = await prisma.notification.findMany({
            where: { userId: user.id, isRead: false },
            orderBy: { createdAt: 'desc' },
            take: 10,
          });

          socket.emit('unreadNotifications', notifications);
        } catch (error) {
          socket.emit('error', { message: 'Erreur lors de la récupération des notifications' });
        }
      });
    });
  }

  // Méthodes publiques pour envoyer des notifications

  /**
   * Envoyer une notification à un utilisateur spécifique
   */
  public async sendNotificationToUser(userId: string, notificationData: Omit<NotificationData, 'id' | 'userId' | 'isRead' | 'createdAt'>) {
    try {
      // Sauvegarder la notification en base
      const notification = await prisma.notification.create({
        data: {
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          userId,
          metadata: notificationData.metadata ? JSON.stringify(notificationData.metadata) : null,
        },
      });

      // Envoyer via Socket.io si l'utilisateur est connecté
      const socketId = this.userSockets.get(userId);
      if (socketId) {
        this.io.to(socketId).emit('newNotification', notification);
      }

      return notification;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de notification:', error);
      throw error;
    }
  }

  /**
   * Envoyer une notification à tous les utilisateurs d'un rôle
   */
  public async sendNotificationToRole(role: string, notificationData: Omit<NotificationData, 'id' | 'userId' | 'isRead' | 'createdAt'>) {
    try {
      // Récupérer tous les utilisateurs du rôle
      const users = await prisma.user.findMany({
        where: { role: role as any },
        select: { id: true },
      });

      // Créer les notifications en base
      const notifications = await Promise.all(
        users.map((user: { id: string }) =>
          prisma.notification.create({
            data: {
              type: notificationData.type,
              title: notificationData.title,
              message: notificationData.message,
              userId: user.id,
              metadata: notificationData.metadata ? JSON.stringify(notificationData.metadata) : null,
            },
          })
        )
      );

      // Envoyer via Socket.io
      this.io.to(`role:${role}`).emit('newNotification', notificationData);

      return notifications;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de notification par rôle:', error);
      throw error;
    }
  }

  /**
   * Envoyer une notification à tous les utilisateurs connectés
   */
  public async sendNotificationToAll(notificationData: Omit<NotificationData, 'id' | 'userId' | 'isRead' | 'createdAt'>) {
    try {
      // Récupérer tous les utilisateurs
      const users = await prisma.user.findMany({
        select: { id: true },
      });

      // Créer les notifications en base
      const notifications = await Promise.all(
        users.map((user: { id: string }) =>
          prisma.notification.create({
            data: {
              type: notificationData.type,
              title: notificationData.title,
              message: notificationData.message,
              userId: user.id,
              metadata: notificationData.metadata ? JSON.stringify(notificationData.metadata) : null,
            },
          })
        )
      );

      // Envoyer via Socket.io
      this.io.emit('newNotification', notificationData);

      return notifications;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de notification globale:', error);
      throw error;
    }
  }

  /**
   * Obtenir le nombre de notifications non lues d'un utilisateur
   */
  public async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Obtenir l'instance Socket.io
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
} 