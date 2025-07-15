import { Request, Response } from 'express';

// Étendre le type Request pour inclure la propriété user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}
import { PrismaClient } from '@prisma/client';
import { MatchingService } from '../services/matchingService';

const prisma = new PrismaClient();

export class MatchingController {
  /**
   * @route GET /api/matching/missions/:missionId
   * @desc Récupère les meilleurs talents pour une mission
   * @access Private (Entreprises)
   */
  static async getMatchesForMission(req: AuthenticatedRequest, res: Response) {
    try {
      const { missionId } = req.params;
      const { limit = 10 } = req.query;

      // Vérifier que l'utilisateur est l'entreprise propriétaire de la mission
      const mission = await prisma.mission.findUnique({
        where: { id: missionId },
        include: { enterprise: true }
      });

      if (!mission) {
        return res.status(404).json({
          success: false,
          message: 'Mission non trouvée'
        });
      }

      if (mission.enterprise.userId !== req.user?.id) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      const matches = await MatchingService.findMatchesForMission(missionId, Number(limit));

      // Enrichir avec les détails des talents
      const enrichedMatches = await Promise.all(
        matches.map(async (match) => {
          const talent = await prisma.talent.findUnique({
            where: { id: match.talentId },
            include: {
              user: {
                select: { email: true }
              }
            }
          });

          return {
            ...match,
            talent: {
              id: talent?.id,
              firstName: talent?.firstName,
              lastName: talent?.lastName,
              bio: talent?.bio,
              photo: talent?.photo,
              score: talent?.score,
              domain: talent?.domain,
              skills: talent?.skills,
              experience: talent?.experience,
              hourlyRate: talent?.hourlyRate,
              email: talent?.user?.email
            }
          };
        })
      );

      return res.status(200).json({
        success: true,
        data: enrichedMatches,
        message: 'Matches récupérés avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des matches:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * @route GET /api/matching/talents/:talentId
   * @desc Récupère les meilleures missions pour un talent
   * @access Private (Talents)
   */
  static async getMatchesForTalent(req: AuthenticatedRequest, res: Response) {
    try {
      const { talentId } = req.params;
      const { limit = 10 } = req.query;

      // Vérifier que l'utilisateur est le talent propriétaire
      const talent = await prisma.talent.findUnique({
        where: { id: talentId }
      });

      if (!talent) {
        return res.status(404).json({
          success: false,
          message: 'Talent non trouvé'
        });
      }

      if (talent.userId !== req.user?.id) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      const matches = await MatchingService.findMatchesForTalent(talentId, Number(limit));

      // Enrichir avec les détails des missions
      const enrichedMatches = await Promise.all(
        matches.map(async (match) => {
          const mission = await prisma.mission.findUnique({
            where: { id: match.missionId },
            include: {
              enterprise: {
                include: {
                  user: {
                    select: { email: true }
                  }
                }
              }
            }
          });

          return {
            ...match,
            mission: {
              id: mission?.id,
              title: mission?.title,
              description: mission?.description,
              domain: mission?.domain,
              skills: mission?.skills,
              duration: mission?.duration,
              budget: mission?.budget,
              location: mission?.location,
              isRemote: mission?.isRemote,
              enterprise: {
                id: mission?.enterprise?.id,
                name: mission?.enterprise?.name,
                logo: mission?.enterprise?.logo,
                industry: mission?.enterprise?.industry
              }
            }
          };
        })
      );

      return res.status(200).json({
        success: true,
        data: enrichedMatches,
        message: 'Matches récupérés avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des matches:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * @route POST /api/matching/accept
   * @desc Accepte un matching (talent accepte une mission)
   * @access Private (Talents)
   */
  static async acceptMatching(req: AuthenticatedRequest, res: Response) {
    try {
      const { missionId, talentId } = req.body;

      // Vérifier que l'utilisateur est le talent
      if (req.user?.role !== 'TALENT') {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      // Vérifier que le talent existe et appartient à l'utilisateur
      const talent = await prisma.talent.findFirst({
        where: {
          id: talentId,
          userId: req.user.id
        }
      });

      if (!talent) {
        return res.status(404).json({
          success: false,
          message: 'Talent non trouvé'
        });
      }

      // Vérifier que la mission existe et est ouverte
      const mission = await prisma.mission.findUnique({
        where: { id: missionId }
      });

      if (!mission || mission.status !== 'OPEN') {
        return res.status(400).json({
          success: false,
          message: 'Mission non disponible'
        });
      }

      // Créer ou mettre à jour le matching
      const matching = await prisma.matching.upsert({
        where: {
          missionId_talentId: {
            missionId,
            talentId
          }
        },
        update: {
          status: 'accepted'
        },
        create: {
          missionId,
          talentId,
          score: 0, // Sera calculé par le service
          status: 'accepted'
        }
      });

      // Créer un contrat en brouillon
      const contract = await prisma.contract.create({
        data: {
          missionId,
          talentId,
          enterpriseId: mission.enterpriseId,
          amount: mission.budget,
          commission: mission.budget * 0.1, // 10% de commission
          netAmount: mission.budget * 0.9,
          startDate: new Date(),
          endDate: new Date(Date.now() + mission.duration * 24 * 60 * 60 * 1000), // Durée en jours
          status: 'draft'
        }
      });

      return res.status(200).json({
        success: true,
        data: {
          matching,
          contract
        },
        message: 'Matching accepté avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de l\'acceptation du matching:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * @route POST /api/matching/reject
   * @desc Rejette un matching
   * @access Private (Talents)
   */
  static async rejectMatching(req: AuthenticatedRequest, res: Response) {
    try {
      const { missionId, talentId } = req.body;

      // Vérifier que l'utilisateur est le talent
      if (req.user?.role !== 'TALENT') {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      // Vérifier que le talent existe et appartient à l'utilisateur
      const talent = await prisma.talent.findFirst({
        where: {
          id: talentId,
          userId: req.user.id
        }
      });

      if (!talent) {
        return res.status(404).json({
          success: false,
          message: 'Talent non trouvé'
        });
      }

      // Mettre à jour le matching
      const matching = await prisma.matching.update({
        where: {
          missionId_talentId: {
            missionId,
            talentId
          }
        },
        data: {
          status: 'rejected'
        }
      });

      return res.status(200).json({
        success: true,
        data: matching,
        message: 'Matching rejeté avec succès'
      });
    } catch (error) {
      console.error('Erreur lors du rejet du matching:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * @route POST /api/matching/update/:missionId
   * @desc Met à jour les matchings pour une mission (recalcul automatique)
   * @access Private (Entreprises)
   */
  static async updateMissionMatchings(req: AuthenticatedRequest, res: Response) {
    try {
      const { missionId } = req.params;

      // Vérifier que l'utilisateur est l'entreprise propriétaire
      const mission = await prisma.mission.findUnique({
        where: { id: missionId },
        include: { enterprise: true }
      });

      if (!mission) {
        return res.status(404).json({
          success: false,
          message: 'Mission non trouvée'
        });
      }

      if (mission.enterprise.userId !== req.user?.id) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }

      // Mettre à jour les matchings
      await MatchingService.updateMissionMatchings(missionId);

      return res.status(200).json({
        success: true,
        message: 'Matchings mis à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des matchings:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * @route GET /api/matching/stats
   * @desc Récupère les statistiques de matching
   * @access Private (Admin)
   */
  static async getMatchingStats(req: AuthenticatedRequest, res: Response) {
    try {
      const totalMatchings = await prisma.matching.count();
      const acceptedMatchings = await prisma.matching.count({
        where: { status: 'accepted' }
      });
      const pendingMatchings = await prisma.matching.count({
        where: { status: 'pending' }
      });
      const rejectedMatchings = await prisma.matching.count({
        where: { status: 'rejected' }
      });

      const avgScore = await prisma.matching.aggregate({
        _avg: {
          score: true
        }
      });

      return res.status(200).json({
        success: true,
        data: {
          total: totalMatchings,
          accepted: acceptedMatchings,
          pending: pendingMatchings,
          rejected: rejectedMatchings,
          averageScore: avgScore._avg.score || 0,
          acceptanceRate: totalMatchings > 0 ? (acceptedMatchings / totalMatchings) * 100 : 0
        },
        message: 'Statistiques récupérées avec succès'
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
} 