import { Request, Response, NextFunction } from 'express';

type UserRole = 'TALENT' | 'ENTERPRISE' | 'INVESTOR' | 'ADMIN';

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié',
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé - Permissions insuffisantes',
      });
    }

    next();
    return;
  };
};

export const requireAdmin = requireRole(['ADMIN']);
export const requireEnterprise = requireRole(['ENTERPRISE']);
export const requireTalent = requireRole(['TALENT']);
export const requireInvestor = requireRole(['INVESTOR']); 