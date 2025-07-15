import { PrismaClient } from '@prisma/client';
import { Talent, Mission, Matching } from '@prisma/client';

const prisma = new PrismaClient();

export interface MatchingScore {
  talentId: string;
  missionId: string;
  score: number;
  breakdown: {
    domainMatch: number;
    skillsMatch: number;
    experienceMatch: number;
    availabilityMatch: number;
    locationMatch: number;
  };
}

export class MatchingService {
  /**
   * Calcule le score de compatibilité entre un talent et une mission
   */
  static async calculateMatchingScore(talent: Talent, mission: Mission): Promise<MatchingScore> {
    const breakdown = {
      domainMatch: this.calculateDomainMatch(talent.domain, mission.domain),
      skillsMatch: this.calculateSkillsMatch(talent.skills, mission.skills),
      experienceMatch: this.calculateExperienceMatch(talent.experience, mission.duration),
      availabilityMatch: talent.isAvailable ? 1 : 0,
      locationMatch: this.calculateLocationMatch(mission.location, mission.isRemote)
    };

    // Pondération des critères
    const weights = {
      domainMatch: 0.3,
      skillsMatch: 0.25,
      experienceMatch: 0.2,
      availabilityMatch: 0.15,
      locationMatch: 0.1
    };

    const totalScore = Object.entries(breakdown).reduce((score, [key, value]) => {
      return score + (value * weights[key as keyof typeof weights]);
    }, 0);

    return {
      talentId: talent.id,
      missionId: mission.id,
      score: Math.round(totalScore * 100) / 100, // Arrondir à 2 décimales
      breakdown
    };
  }

  /**
   * Trouve les meilleurs matches pour une mission donnée
   */
  static async findMatchesForMission(missionId: string, limit: number = 10): Promise<MatchingScore[]> {
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: { enterprise: true }
    });

    if (!mission) {
      throw new Error('Mission non trouvée');
    }

    // Récupérer tous les talents disponibles
    const talents = await prisma.talent.findMany({
      where: { isAvailable: true }
    });

    // Calculer les scores pour tous les talents
    const scores = await Promise.all(
      talents.map(talent => this.calculateMatchingScore(talent, mission))
    );

    // Trier par score décroissant et limiter
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Trouve les meilleures missions pour un talent donné
   */
  static async findMatchesForTalent(talentId: string, limit: number = 10): Promise<MatchingScore[]> {
    const talent = await prisma.talent.findUnique({
      where: { id: talentId }
    });

    if (!talent) {
      throw new Error('Talent non trouvé');
    }

    // Récupérer toutes les missions ouvertes
    const missions = await prisma.mission.findMany({
      where: { status: 'open' },
      include: { enterprise: true }
    });

    // Calculer les scores pour toutes les missions
    const scores = await Promise.all(
      missions.map(mission => this.calculateMatchingScore(talent, mission))
    );

    // Trier par score décroissant et limiter
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Crée ou met à jour les matchings pour une mission
   */
  static async updateMissionMatchings(missionId: string): Promise<void> {
    const matches = await this.findMatchesForMission(missionId, 20);

    // Supprimer les anciens matchings
    await prisma.matching.deleteMany({
      where: { missionId }
    });

    // Créer les nouveaux matchings
    await prisma.matching.createMany({
      data: matches.map(match => ({
        missionId: match.missionId,
        talentId: match.talentId,
        score: match.score,
        status: 'pending'
      }))
    });
  }

  /**
   * Calcule la correspondance des domaines
   */
  private static calculateDomainMatch(talentDomains: string[], missionDomains: string[]): number {
    if (talentDomains.length === 0 || missionDomains.length === 0) return 0;
    
    const intersection = talentDomains.filter(domain => 
      missionDomains.includes(domain)
    );
    
    return intersection.length / Math.max(talentDomains.length, missionDomains.length);
  }

  /**
   * Calcule la correspondance des compétences
   */
  private static calculateSkillsMatch(talentSkills: string[], missionSkills: string[]): number {
    if (talentSkills.length === 0 || missionSkills.length === 0) return 0;
    
    const intersection = talentSkills.filter(skill => 
      missionSkills.includes(skill)
    );
    
    return intersection.length / Math.max(talentSkills.length, missionSkills.length);
  }

  /**
   * Calcule la correspondance de l'expérience
   */
  private static calculateExperienceMatch(talentExperience: number, missionDuration: number): number {
    // Plus l'expérience est élevée par rapport à la durée, meilleur c'est
    const ratio = talentExperience / (missionDuration / 30); // Convertir en mois
    return Math.min(ratio / 2, 1); // Normaliser entre 0 et 1
  }

  /**
   * Calcule la correspondance de localisation
   */
  private static calculateLocationMatch(location: string | null, isRemote: boolean): number {
    if (isRemote) return 1; // Mission remote = compatible avec tous
    if (!location) return 0.5; // Localisation non spécifiée
    return 0.8; // Mission en présentiel (pourrait être amélioré avec géolocalisation)
  }

  /**
   * Récupère les matchings existants avec détails
   */
  static async getMatchingsWithDetails(missionId?: string, talentId?: string): Promise<any[]> {
    const where: any = {};
    if (missionId) where.missionId = missionId;
    if (talentId) where.talentId = talentId;

    return await prisma.matching.findMany({
      where,
      include: {
        mission: {
          include: { enterprise: true }
        },
        talent: {
          include: { user: true }
        }
      },
      orderBy: { score: 'desc' }
    });
  }
} 