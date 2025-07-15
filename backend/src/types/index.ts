import { Request } from 'express';
import { User, UserRole } from '@prisma/client';

// Types d'authentification
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

// Types pour les talents
export interface CreateTalentData {
  firstName: string;
  lastName: string;
  bio?: string;
  domain: string[];
  skills: string[];
  experience: number;
  hourlyRate?: number;
}

export interface UpdateTalentData {
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
}

// Types pour les entreprises
export interface CreateEnterpriseData {
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
}

export interface UpdateEnterpriseData {
  name?: string;
  description?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: string;
}

// Types pour les missions
export interface CreateMissionData {
  title: string;
  description: string;
  domain: string[];
  skills: string[];
  duration: number;
  budget: number;
  location?: string;
  isRemote?: boolean;
}

export interface UpdateMissionData {
  title?: string;
  description?: string;
  domain?: string[];
  skills?: string[];
  duration?: number;
  budget?: number;
  location?: string;
  isRemote?: boolean;
  status?: string;
}

// Types pour les formations
export interface CreateFormationData {
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  pdfUrl?: string;
  duration: number;
  difficulty: string;
  domain: string;
}

export interface UpdateFormationData {
  title?: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  pdfUrl?: string;
  duration?: number;
  difficulty?: string;
  domain?: string;
  isActive?: boolean;
}

// Types pour les contrats
export interface CreateContractData {
  missionId: string;
  talentId: string;
  amount: number;
  startDate: Date;
  endDate: Date;
}

export interface UpdateContractData {
  status?: string;
  signedAt?: Date;
}

// Types pour les paiements
export interface CreatePaymentData {
  contractId: string;
  talentId: string;
  amount: number;
  stripeId?: string;
}

// Types pour les investissements
export interface CreateInvestmentData {
  talentId: string;
  amount: number;
  percentage: number;
  duration: number;
  startDate: Date;
  endDate: Date;
}

// Types pour les notifications
export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: string;
}

// Types pour les messages
export interface CreateMessageData {
  receiverId: string;
  content: string;
}

// Types pour l'authentification
export interface RegisterData {
  email: string;
  password: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types pour les filtres
export interface TalentFilters {
  domain?: string[];
  skills?: string[];
  minExperience?: number;
  maxHourlyRate?: number;
  isAvailable?: boolean;
  search?: string;
}

export interface MissionFilters {
  domain?: string[];
  skills?: string[];
  minBudget?: number;
  maxBudget?: number;
  isRemote?: boolean;
  status?: string;
  search?: string;
}

// Types pour les uploads
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

// Types pour les webhooks Stripe
export interface StripeWebhookEvent {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: any;
  livemode: boolean;
  pending_webhooks: number;
  request: any;
  type: string;
}

// Types pour les statistiques
export interface DashboardStats {
  totalTalents: number;
  totalEnterprises: number;
  totalMissions: number;
  totalContracts: number;
  totalRevenue: number;
  monthlyRevenue: number;
  activeSubscriptions: number;
}

// Types pour les erreurs
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// Types pour la validation
export interface ValidationError {
  field: string;
  message: string;
}

// Types pour les sessions
export interface SessionData {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
} 