'use client';

import { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  BriefcaseIcon, 
  StarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';

interface Matching {
  id: string;
  missionId: string;
  talentId: string;
  score: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
  mission: {
    id: string;
    title: string;
    description: string;
    domain: string;
    duration: number;
    budget: number;
    location: string;
    enterprise: {
      name: string;
      logo?: string;
    };
  };
  talent: {
    id: string;
    firstName: string;
    lastName: string;
    bio: string;
    skills: string[];
    experience: number;
    rating: number;
    avatar?: string;
  };
}

export default function MatchingPage() {
  const { user } = useAuth();
  const [matchings, setMatchings] = useState<Matching[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchMatchings();
  }, [user]);

  const fetchMatchings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.MATCHING, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMatchings(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des matchings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptMatching = async (matchingId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.MATCHING}/${matchingId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Mettre à jour la liste des matchings
        setMatchings(prev => prev.map(m => 
          m.id === matchingId ? { ...m, status: 'ACCEPTED' } : m
        ));
      }
    } catch (error) {
      console.error('Erreur lors de l\'acceptation du matching:', error);
    }
  };

  const handleRejectMatching = async (matchingId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.MATCHING}/${matchingId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Mettre à jour la liste des matchings
        setMatchings(prev => prev.map(m => 
          m.id === matchingId ? { ...m, status: 'REJECTED' } : m
        ));
      }
    } catch (error) {
      console.error('Erreur lors du rejet du matching:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Accepté';
      case 'REJECTED':
        return 'Rejeté';
      case 'COMPLETED':
        return 'Terminé';
      default:
        return status;
    }
  };

  const filteredMatchings = matchings.filter(matching => {
    if (filter === 'all') return true;
    return matching.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center">
              <UserGroupIcon className="h-12 w-12 text-blue-600 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Matching Intelligent</h1>
                <p className="mt-1 text-lg text-gray-500">
                  Découvrez les meilleures opportunités adaptées à votre profil
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous ({matchings.length})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'PENDING' 
                  ? 'bg-yellow-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente ({matchings.filter(m => m.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setFilter('ACCEPTED')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'ACCEPTED' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Acceptés ({matchings.filter(m => m.status === 'ACCEPTED').length})
            </button>
            <button
              onClick={() => setFilter('COMPLETED')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'COMPLETED' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Terminés ({matchings.filter(m => m.status === 'COMPLETED').length})
            </button>
          </div>
        </div>

        {/* Liste des matchings */}
        <div className="space-y-6">
          {filteredMatchings.map((matching) => (
            <div key={matching.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {matching.mission.title}
                      </h3>
                      <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(matching.status)}`}>
                        {getStatusLabel(matching.status)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">
                      {matching.mission.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <BriefcaseIcon className="h-4 w-4 mr-2" />
                          <span className="font-medium">Domaine:</span>
                          <span className="ml-2 capitalize">{matching.mission.domain}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-2" />
                          <span className="font-medium">Localisation:</span>
                          <span className="ml-2">{matching.mission.location}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          <span className="font-medium">Durée:</span>
                          <span className="ml-2">{matching.mission.duration} jours</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                          <span className="font-medium">Budget:</span>
                          <span className="ml-2">{matching.mission.budget.toLocaleString()} €</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <StarIcon className="h-4 w-4 mr-2" />
                          <span className="font-medium">Score de compatibilité:</span>
                          <span className="ml-2 font-semibold text-blue-600">{matching.score}%</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium">Entreprise:</span>
                          <span className="ml-2">{matching.mission.enterprise.name}</span>
                        </div>
                        {user?.role === 'ENTERPRISE' && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">Talent:</span>
                            <span className="ml-2">{matching.talent.firstName} {matching.talent.lastName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {matching.status === 'PENDING' && (
                  <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleRejectMatching(matching.id)}
                      className="flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Rejeter
                    </button>
                    <button
                      onClick={() => handleAcceptMatching(matching.id)}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Accepter
                    </button>
                  </div>
                )}

                {matching.status === 'ACCEPTED' && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600 font-medium">
                        ✓ Matching accepté - Contrat en cours de génération
                      </span>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Voir le contrat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredMatchings.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'Aucun matching trouvé' : `Aucun matching ${getStatusLabel(filter).toLowerCase()}`}
            </h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'Les matchings apparaîtront ici une fois que notre algorithme aura trouvé des opportunités adaptées.'
                : 'Aucun matching dans cette catégorie pour le moment.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 