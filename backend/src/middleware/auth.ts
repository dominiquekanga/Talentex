import { Response, NextFunction } from 'express';
import { AuthUtils } from '../utils/auth';
import { prisma } from '../utils/database';
import { AuthenticatedRequest } from '../types';

export interface AuthMiddleware {
  authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
  authorize: (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
  optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
}

/**
 * Middleware d'authentification principal
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token d\'authentification manquant',
      });
      return;
    }

    const payload = AuthUtils.verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
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
        error: 'Utilisateur non trouvé ou inactif',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token invalide',
    });
  }
};

/**
 * Middleware d'autorisation basé sur les rôles
 */
export const authorize = (roles: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentification requise',
        });
        return;
      }

      if (!roles.includes(req.user['role'])) {
        res.status(403).json({
          success: false,
          error: 'Permissions insuffisantes',
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification des permissions',
      });
    }
  };
};

/**
 * Middleware d'authentification optionnelle
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthUtils.extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const payload = AuthUtils.verifyToken(token);
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: {
            talent: true,
            enterprise: true,
            investor: true,
            admin: true,
          },
        });

        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token invalide, mais on continue sans authentification
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Middleware pour vérifier l'accès à une ressource
 */
export const checkResourceAccess = (resourceType: 'talent' | 'enterprise' | 'mission' | 'contract') => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentification requise',
        });
        return;
      }

      const resourceId = req.params.id;
      if (!resourceId) {
        res.status(400).json({
          success: false,
          error: 'ID de ressource manquant',
        });
        return;
      }

      let hasAccess = false;

      switch (resourceType) {
        case 'talent':
          const talent = await prisma.talent.findUnique({
            where: { id: resourceId },
          });
          hasAccess = !!(talent && AuthUtils.canAccessResource(req.user['id'], talent.userId, req.user.role));
          break;

        case 'enterprise':
          const enterprise = await prisma.enterprise.findUnique({
            where: { id: resourceId },
          });
          hasAccess = !!(enterprise && AuthUtils.canAccessResource(req.user['id'], enterprise.userId, req.user.role));
          break;

        case 'mission':
          const mission = await prisma.mission.findUnique({
            where: { id: resourceId },
          });
          hasAccess = !!(mission && AuthUtils.canAccessResource(req.user['id'], mission.enterpriseId, req.user.role));
          break;

        case 'contract':
          const contract = await prisma.contract.findUnique({
            where: { id: resourceId },
          });
          hasAccess = !!(contract && (
            AuthUtils.canAccessResource(req.user['id'], contract.talentId, req.user.role) ||
            AuthUtils.canAccessResource(req.user['id'], contract.enterpriseId, req.user.role)
          ));
          break;
      }

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: 'Accès non autorisé à cette ressource',
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la vérification d\'accès',
      });
    }
  };
};

/**
 * Middleware pour vérifier l'abonnement actif
 */
export const requireActiveSubscription = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'ENTERPRISE') {
      res.status(403).json({
        success: false,
        error: 'Abonnement requis pour les entreprises',
      });
      return;
    }

    const enterprise = await prisma.enterprise.findUnique({
      where: { userId: req.user['id'] },
      include: { subscription: true },
    });

    if (!enterprise?.subscription || enterprise.subscription.status !== 'active') {
      res.status(402).json({
        success: false,
        error: 'Abonnement actif requis',
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification de l\'abonnement',
    });
  }
}; 