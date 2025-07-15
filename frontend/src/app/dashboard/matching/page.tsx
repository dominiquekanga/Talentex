'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  ChartBarIcon,
  CheckIcon,
  XMarkIcon,
  StarIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyEuroIcon,
  EyeIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../config/api';

interface Matching {
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
  talent?: {
    id: string;
    firstName: string;
    lastName: string;
    bio?: string;
    photo?: string;
    score: number;
    domain: string[];
    skills: string[];
    experience: number;
    hourlyRate?: number;
    email: string;
  };
  mission?: {
    id: string;
    title: string;
    description: string;
    domain: string[];
    skills: string[];
    duration: number;
    budget: number;
    location?: string;
    isRemote: boolean;
    enterprise: {
      id: string;
      name: string;
      logo?: string;
      industry: string;
    };
  };
}

export default function MatchingPage() {
  const [matchings, setMatchings] = useState<Matching[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedMatching, setSelectedMatching] = useState<Matching | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filterScore, setFilterScore] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadMatchings();
  }, []);

  const loadMatchings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user) return;

      let url = '';
      if (user.role === 'TALENT') {
        const talent = await getTalentByUserId(user.id);
        if (talent) {
          url = `${API_ENDPOINTS.MATCHING}/talents/${talent.id}`;
        }
      } else if (user.role === 'ENTERPRISE') {
        // Pour les entreprises, on charge les matchings de leurs missions
        const missions = await getEnterpriseMissions(user.id);
        const allMatchings: Matching[] = [];
        
        for (const mission of missions) {
          const response = await fetch(`${API_ENDPOINTS.MATCHING}/missions/${mission.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            allMatchings.push(...data.data);
          }
        }
        
        setMatchings(allMatchings);
        setIsLoading(false);
        return;
      }

      if (url) {
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setMatchings(data.data || []);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des matchings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTalentByUserId = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.TALENTS}/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil talent:', error);
    }
    return null;
  };

  const getEnterpriseMissions = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.MISSIONS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des missions:', error);
    }
    return [];
  };

  const handleAcceptMatching = async (matching: Matching) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.MATCHING}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          missionId: matching.missionId,
          talentId: matching.talentId
        })
      });

      if (response.ok) {
        // Recharger les matchings
        loadMatchings();
        alert('Matching accepté avec succès !');
      }
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
      alert('Erreur lors de l\'acceptation du matching');
    }
  };

  const handleRejectMatching = async (matching: Matching) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.MATCHING}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          missionId: matching.missionId,
          talentId: matching.talentId
        })
      });

      if (response.ok) {
        // Recharger les matchings
        loadMatchings();
        alert('Matching rejeté');
      }
    } catch (error) {
      console.error('Erreur lors du rejet:', error);
      alert('Erreur lors du rejet du matching');
    }
  };

  const filteredMatchings = matchings.filter(matching => matching.score >= filterScore);

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 0.8) return '⭐';
    if (score >= 0.6) return '✨';
    return '💡';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user?.role === 'TALENT' ? 'Missions Recommandées' : 'Talents Recommandés'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'TALENT' 
              ? 'Découvrez les missions qui correspondent le mieux à votre profil'
              : 'Trouvez les talents les plus adaptés à vos missions'
            }
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Score minimum:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={filterScore}
                onChange={(e) => setFilterScore(parseFloat(e.target.value))}
                className="w-32"
              />
              <span className="text-sm text-gray-600">{Math.round(filterScore * 100)}%</span>
            </div>
            <div className="text-sm text-gray-600">
              {filteredMatchings.length} résultat{filteredMatchings.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Liste des matchings */}
        <div className="grid gap-6">
          {filteredMatchings.map((matching, index) => (
            <motion.div
              key={`${matching.missionId}-${matching.talentId}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(matching.score)}`}>
                        {getScoreIcon(matching.score)} {Math.round(matching.score * 100)}% de compatibilité
                      </div>
                      <StarIcon className="h-5 w-5 text-yellow-400" />
                      <span className="text-sm text-gray-600">
                        Score: {matching.score.toFixed(2)}
                      </span>
                    </div>

                    {user?.role === 'TALENT' && matching.mission && (
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {matching.mission.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {matching.mission.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                            {matching.mission.enterprise.name}
                          </div>
                          <div className="flex items-center">
                            <CurrencyEuroIcon className="h-4 w-4 mr-1" />
                            {matching.mission.budget.toLocaleString()}€
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {matching.mission.duration} jours
                          </div>
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            {matching.mission.isRemote ? 'Remote' : matching.mission.location || 'Non spécifié'}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {matching.mission.domain.map((domain, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {domain}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {user?.role === 'ENTERPRISE' && matching.talent && (
                      <div>
                        <div className="flex items-center space-x-4 mb-4">
                          {matching.talent.photo ? (
                            <img 
                              src={matching.talent.photo} 
                              alt={`${matching.talent.firstName} ${matching.talent.lastName}`}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                              <UserGroupIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              {matching.talent.firstName} {matching.talent.lastName}
                            </h3>
                            <p className="text-gray-600">{matching.talent.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <StarIcon className="h-4 w-4 text-yellow-400" />
                              <span className="text-sm text-gray-600">
                                Score: {matching.talent.score.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {matching.talent.bio && (
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {matching.talent.bio}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center">
                            <ChartBarIcon className="h-4 w-4 mr-1" />
                            {matching.talent.experience} ans d'expérience
                          </div>
                          {matching.talent.hourlyRate && (
                            <div className="flex items-center">
                              <CurrencyEuroIcon className="h-4 w-4 mr-1" />
                              {matching.talent.hourlyRate}€/h
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {matching.talent.domain.map((domain, idx) => (
                            <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {domain}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Breakdown du score */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Détail du score</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium">Domaines</div>
                          <div className="text-gray-600">{Math.round(matching.breakdown.domainMatch * 100)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Compétences</div>
                          <div className="text-gray-600">{Math.round(matching.breakdown.skillsMatch * 100)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Expérience</div>
                          <div className="text-gray-600">{Math.round(matching.breakdown.experienceMatch * 100)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Disponibilité</div>
                          <div className="text-gray-600">{Math.round(matching.breakdown.availabilityMatch * 100)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">Localisation</div>
                          <div className="text-gray-600">{Math.round(matching.breakdown.locationMatch * 100)}%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => setSelectedMatching(matching)}
                      className="btn-secondary flex items-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Détails
                    </button>
                    
                    {user?.role === 'TALENT' && (
                      <>
                        <button
                          onClick={() => handleAcceptMatching(matching)}
                          className="btn-primary flex items-center"
                        >
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Accepter
                        </button>
                        <button
                          onClick={() => handleRejectMatching(matching)}
                          className="btn-danger flex items-center"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Rejeter
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredMatchings.length === 0 && (
          <div className="text-center py-12">
            <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun matching trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              {user?.role === 'TALENT' 
                ? 'Aucune mission ne correspond actuellement à vos critères.'
                : 'Aucun talent ne correspond actuellement à vos missions.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showDetails && selectedMatching && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Détails du matching
            </h2>
            {/* Contenu détaillé du matching */}
            <div className="space-y-4">
              {/* Ajouter ici le contenu détaillé */}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="btn-secondary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 