'use client';

import { useState, useEffect } from 'react';
import { 
  AcademicCapIcon, 
  PlayIcon, 
  DocumentTextIcon,
  ClockIcon,
  StarIcon,
  FilterIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface Formation {
  id: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  pdfUrl?: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  domain: string;
  isActive: boolean;
  createdAt: string;
}

interface FormationProgress {
  formationId: string;
  progress: number;
  isCompleted: boolean;
  completedAt?: string;
}

export default function AcademyPage() {
  const { user } = useAuth();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [progress, setProgress] = useState<FormationProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    fetchFormations();
    if (user?.role === 'TALENT') {
      fetchProgress();
    }
  }, [user]);

  const fetchFormations = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/academy/formations');
      if (response.ok) {
        const data = await response.json();
        setFormations(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des formations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/academy/progress', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProgress(data.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la progression:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'Débutant';
      case 'intermediate':
        return 'Intermédiaire';
      case 'advanced':
        return 'Avancé';
      default:
        return difficulty;
    }
  };

  const getFormationProgress = (formationId: string) => {
    const formationProgress = progress.find(p => p.formationId === formationId);
    return formationProgress?.progress || 0;
  };

  const isFormationCompleted = (formationId: string) => {
    const formationProgress = progress.find(p => p.formationId === formationId);
    return formationProgress?.isCompleted || false;
  };

  const filteredFormations = formations.filter(formation => {
    if (selectedDomain !== 'all' && formation.domain !== selectedDomain) return false;
    if (selectedDifficulty !== 'all' && formation.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const domains = [...new Set(formations.map(f => f.domain))];

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
              <AcademicCapIcon className="h-12 w-12 text-blue-600 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Académie TalentEx</h1>
                <p className="mt-1 text-lg text-gray-500">
                  Développez vos compétences avec nos formations expertes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center mb-4">
            <FilterIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domaine
              </label>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les domaines</option>
                {domains.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les niveaux</option>
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grille des formations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFormations.map((formation) => {
            const progress = getFormationProgress(formation.id);
            const isCompleted = isFormationCompleted(formation.id);
            
            return (
              <div key={formation.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                      {formation.title}
                    </h3>
                    {isCompleted && (
                      <StarIcon className="h-6 w-6 text-yellow-500 flex-shrink-0 ml-2" />
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {formation.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(formation.difficulty)}`}>
                      {getDifficultyLabel(formation.difficulty)}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {formation.duration} min
                    </div>
                  </div>

                  {/* Barre de progression */}
                  {user?.role === 'TALENT' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progression</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-600 capitalize">
                      {formation.domain}
                    </span>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      {isCompleted ? 'Revoir' : 'Commencer'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredFormations.length === 0 && (
          <div className="text-center py-12">
            <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune formation trouvée</h3>
            <p className="text-gray-500">
              Essayez de modifier vos filtres pour voir plus de formations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 