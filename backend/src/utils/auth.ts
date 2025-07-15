import bcrypt from 'bcryptjs';
import jwt, { Secret } from 'jsonwebtoken';
import { User, UserRole } from '@prisma/client';
import { JWTPayload } from '../types';

const JWT_SECRET: Secret = process.env['JWT_SECRET'] || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] || '7d';
const BCRYPT_ROUNDS = parseInt(process.env['BCRYPT_ROUNDS'] || '12');

export class AuthUtils {
  /**
   * Hash un mot de passe avec bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /**
   * Compare un mot de passe avec son hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Génère un token JWT
   */
  static generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Vérifie et décode un token JWT
   */
  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  /**
   * Génère un token de réinitialisation de mot de passe
   */
  static generateResetToken(userId: string): string {
    return jwt.sign({ userId, type: 'reset' }, JWT_SECRET, {
      expiresIn: '1h',
    } as jwt.SignOptions);
  }

  /**
   * Vérifie un token de réinitialisation
   */
  static verifyResetToken(token: string): { userId: string; type: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; type: string };
      if (decoded.type !== 'reset') {
        throw new Error('Type de token invalide');
      }
      return decoded;
    } catch (error) {
      throw new Error('Token de réinitialisation invalide');
    }
  }

  /**
   * Génère un mot de passe aléatoire
   */
  static generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Valide la force d'un mot de passe
   */
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }

    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extrait le token du header Authorization
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Vérifie si un utilisateur a les permissions nécessaires
   */
  static hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(userRole);
  }

  /**
   * Vérifie si un utilisateur peut accéder à une ressource
   */
  static canAccessResource(userId: string, resourceUserId: string, userRole: UserRole): boolean {
    // L'utilisateur peut accéder à sa propre ressource
    if (userId === resourceUserId) {
      return true;
    }

    // Les admins peuvent accéder à toutes les ressources
    if (userRole === 'ADMIN') {
      return true;
    }

    return false;
  }
} 