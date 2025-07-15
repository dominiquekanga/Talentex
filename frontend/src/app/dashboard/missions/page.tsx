'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyEuroIcon,
  BuildingOfficeIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../config/api';

interface Mission {
  id: string;
  title: string;
  description: string;
  enterprise: {
    id: string;
    name: string;
    logo?: string;
  };
  location: string;
  duration: number;
  budget: {
    min: number;
    max: number;
  };
  skills: string[];
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  applications: number;
  isOwner: boolean;
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  const statuses = [
    { id: 'all', name: 'Tous les statuts' },
    { id: 'open', name: 'Ouvertes' },
    { id: 'in_progress', name: 'En cours' },
    { id: 'completed', name: 'Terminées' },
    { id: 'cancelled', name: 'Annulées' }
  ];

  const locations = [
    'Paris',
    'Lyon',
    'Marseille',
    'Toulouse',
    'Bordeaux',
    'Nantes',
    'Strasbourg',
    'Lille',
    'Remote'
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadMissions();
  }, []);

  useEffect(() => {
    filterMissions();
  }, [missions, searchTerm, selectedStatus, selectedLocation]);

  const loadMissions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.MISSIONS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMissions(data.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des missions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterMissions = () => {
    let filtered = [...missions];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(mission =>
        mission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mission.enterprise.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(mission => mission.status === selectedStatus);
    }

    // Filtre par localisation
    if (selectedLocation) {
      filtered = filtered.filter(mission => mission.location === selectedLocation);
    }

    setFilteredMissions(filtered);
  };

  const handleCreateMission = () => {
    setShowCreateModal(true);
  };

  const handleEditMission = (missionId: string) => {
    // Logique pour éditer une mission
    console.log('Éditer la mission:', missionId);
  };

  const handleDeleteMission = (missionId: string) => {
    // Logique pour supprimer une mission
    console.log('Supprimer la mission:', missionId);
  };

  const handleApplyMission = (missionId: string) => {
    // Logique pour postuler à une mission
    console.log('Postuler à la mission:', missionId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Ouverte';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Missions</h1>
          <p className="mt-2 text-gray-600">
            Découvrez et gérez les opportunités de collaboration
          </p>
        </div>
        {user?.role === 'ENTERPRISE' && (
          <button
            onClick={handleCreateMission}
            className="mt-4 sm:mt-0 btn-primary flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Publier une mission
          </button>
        )}
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une mission..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Statut */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {statuses.map((status) => (
              <option key={status.id} value={status.id}>{status.name}</option>
            ))}
          </select>

          {/* Localisation */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Toutes les localisations</option>
            {locations.map((location) => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>

          {/* Budget */}
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">Tous les budgets</option>
            <option value="0-1000">0 - 1000€</option>
            <option value="1000-5000">1000€ - 5000€</option>
            <option value="5000-10000">5000€ - 10000€</option>
            <option value="10000+">10000€+</option>
          </select>
        </div>
      </div>

      {/* Résultats */}
      <div className="text-sm text-gray-600 mb-4">
        {filteredMissions.length} mission{filteredMissions.length > 1 ? 's' : ''} trouvée{filteredMissions.length > 1 ? 's' : ''}
      </div>

      {/* Liste des missions */}
      <div className="space-y-4">
        {filteredMissions.map((mission, index) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {mission.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <BuildingOfficeIcon className="h-4 w-4" />
                        <span>{mission.enterprise.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{mission.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{mission.duration} jours</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(mission.status)}`}>
                      {getStatusText(mission.status)}
                    </span>
                    {mission.isOwner && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEditMission(mission.id)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMission(mission.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {mission.description}
                </p>

                {/* Compétences requises */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {mission.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Informations supplémentaires */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <CurrencyEuroIcon className="h-4 w-4" />
                      <span>{mission.budget.min}€ - {mission.budget.max}€</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <EyeIcon className="h-4 w-4" />
                      <span>{mission.applications} candidature{mission.applications > 1 ? 's' : ''}</span>
                    </div>
                    <div className="text-gray-500">
                      Publiée le {new Date(mission.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!mission.isOwner && mission.status === 'open' && user?.role === 'TALENT' && (
                      <button
                        onClick={() => handleApplyMission(mission.id)}
                        className="btn-primary btn-sm"
                      >
                        Postuler
                      </button>
                    )}
                    <button className="btn-secondary btn-sm">
                      Voir détails
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredMissions.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune mission trouvée</h3>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'ENTERPRISE' 
              ? 'Publiez votre première mission pour commencer.'
              : 'Aucune mission ne correspond à vos critères.'
            }
          </p>
          {user?.role === 'ENTERPRISE' && (
            <button
              onClick={handleCreateMission}
              className="mt-4 btn-primary"
            >
              Publier une mission
            </button>
          )}
        </div>
      )}

      {/* Modal de création (placeholder) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Publier une nouvelle mission
            </h2>
            <p className="text-gray-600 mb-4">
              Formulaire de création de mission en cours de développement...
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button className="btn-primary">
                Publier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 