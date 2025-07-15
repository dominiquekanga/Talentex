import { Request, Response } from 'express';
import { AuthUtils } from '../utils/auth';
import { prisma } from '../utils/database';
import { RegisterData, LoginData, ApiResponse } from '../types';

export class AuthController {
  /**
   * Inscription d'un nouvel utilisateur
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, role, firstName, lastName, companyName }: RegisterData = req.body;

      // Validation des données
      if (!email || !password || !role) {
        res.status(400).json({
          success: false,
          error: 'Email, mot de passe et rôle requis',
        });
        return;
      }

      // Vérification de la force du mot de passe
      const passwordValidation = AuthUtils.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Mot de passe trop faible',
          details: passwordValidation.errors,
        });
        return;
      }

      // Vérification si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'Un utilisateur avec cet email existe déjà',
        });
        return;
      }

      // Hash du mot de passe
      const hashedPassword = await AuthUtils.hashPassword(password);

      // Création de l'utilisateur
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
        },
      });

      // Création du profil selon le rôle
      if (role === 'TALENT' && firstName && lastName) {
        await prisma.talent.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
          },
        });
      } else if (role === 'ENTERPRISE' && companyName) {
        await prisma.enterprise.create({
          data: {
            userId: user.id,
            name: companyName,
          },
        });
      } else if (role === 'INVESTOR' && companyName) {
        await prisma.investor.create({
          data: {
            userId: user.id,
            name: companyName,
          },
        });
      }

      // Génération du token
      const token = AuthUtils.generateToken(user);

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
          token,
        },
        message: 'Inscription réussie',
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginData = req.body;

      // Validation des données
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email et mot de passe requis',
        });
        return;
      }

      // Recherche de l'utilisateur
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          talent: true,
          enterprise: true,
          investor: true,
          admin: true,
        },
      });

      if (!user || !user.isActive) {
        res.status(401).json({
          success: false,
          error: 'Email ou mot de passe incorrect',
        });
        return;
      }

      // Vérification du mot de passe
      const isPasswordValid = await AuthUtils.comparePassword(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: 'Email ou mot de passe incorrect',
        });
        return;
      }

      // Génération du token
      const token = AuthUtils.generateToken(user);

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            profile: user.talent || user.enterprise || user.investor || user.admin,
          },
          token,
        },
        message: 'Connexion réussie',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Récupération du profil utilisateur connecté
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // L'utilisateur est déjà attaché par le middleware d'authentification
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Utilisateur non authentifié',
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            isVerified: user.isVerified,
            createdAt: user.createdAt,
            profile: user.talent || user.enterprise || user.investor || user.admin,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Déconnexion (invalidation du token côté client)
   */
  static async logout(_req: Request, res: Response): Promise<void> {
    try {
      // En production, on pourrait implémenter une liste noire de tokens
      const response: ApiResponse = {
        success: true,
        message: 'Déconnexion réussie',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Demande de réinitialisation de mot de passe
   */
  static async forgotPassword(_req: Request, res: Response): Promise<void> {
    try {
      const { email } = _req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email requis',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Pour des raisons de sécurité, on ne révèle pas si l'email existe
        res.status(200).json({
          success: true,
          message: "Si l'email existe, un lien de réinitialisation a été envoyé",
        });
        return;
      }

      // En production, envoyer l'email avec le lien de réinitialisation
      // await sendResetPasswordEmail(user.email, /* resetToken */);

      const response: ApiResponse = {
        success: true,
        message: "Si l'email existe, un lien de réinitialisation a été envoyé",
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }

  /**
   * Réinitialisation du mot de passe
   */
  static async resetPassword(_req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = _req.body;

      if (!token || !newPassword) {
        res.status(400).json({
          success: false,
          error: 'Token et nouveau mot de passe requis',
        });
        return;
      }

      // Vérification de la force du nouveau mot de passe
      const passwordValidation = AuthUtils.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Mot de passe trop faible',
          details: passwordValidation.errors,
        });
        return;
      }

      // Vérification du token
      const payload = AuthUtils.verifyResetToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        res.status(400).json({
          success: false,
          error: 'Token invalide',
        });
        return;
      }

      // Hash du nouveau mot de passe
      const hashedPassword = await AuthUtils.hashPassword(newPassword);

      // Mise à jour du mot de passe
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Mot de passe réinitialisé avec succès',
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
      });
    }
  }
} 