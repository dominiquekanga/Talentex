'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserCircleIcon,
  StarIcon,
  MapPinIcon,
  AcademicCapIcon,
  EyeIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../config/api';

interface Talent {
  id: string;
  firstName: string;
  lastName: string;
  bio: string;
  photo: string | null;
  cvUrl: string | null;
  videoUrl: string | null;
  score: number;
  isAvailable: boolean;
  specializations: string[];
  location: string;
  experience: number;
  hourlyRate: number;
  rating: number;
}

export default function TalentsPage() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [filteredTalents, setFilteredTalents] = useState<Talent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const specializations = [
    'Juridique',
    'Consulting',
    'Négociation',
    'Gestion de projet',
    'Finance',
    'Marketing',
    'Technologie',
    'RH'
  ];

  const locations = [
    'Paris',
    'Lyon',
    'Marseille',
    'Toulouse',
    'Bordeaux',
    'Nantes',
    'Strasbourg',
    'Lille'
  ];

  useEffect(() => {
    loadTalents();
  }, []);

  useEffect(() => {
    filterTalents();
  }, [talents, searchTerm, selectedSpecialization, selectedLocation, sortBy]);

  const loadTalents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(API_ENDPOINTS.TALENTS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTalents(data.data || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des talents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTalents = () => {
    let filtered = [...talents];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(talent =>
        `${talent.firstName} ${talent.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtre par spécialisation
    if (selectedSpecialization) {
      filtered = filtered.filter(talent =>
        talent.specializations.includes(selectedSpecialization)
      );
    }

    // Filtre par localisation
    if (selectedLocation) {
      filtered = filtered.filter(talent =>
        talent.location === selectedLocation
      );
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'rating':
          return b.rating - a.rating;
        case 'experience':
          return b.experience - a.experience;
        case 'rate':
          return a.hourlyRate - b.hourlyRate;
        default:
          return 0;
      }
    });

    setFilteredTalents(filtered);
  };

  const handleContact = (talentId: string) => {
    // Logique pour contacter un talent
    console.log('Contacter le talent:', talentId);
  };

  const handleFavorite = (talentId: string) => {
    // Logique pour ajouter aux favoris
    console.log('Ajouter aux favoris:', talentId);
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
          <h1 className="text-3xl font-bold text-gray-900">Talents</h1>
          <p className="mt-2 text-gray-600">
            Découvrez et connectez-vous avec des talents exceptionnels
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Recherche */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un talent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Spécialisation */}
          <select
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Toutes les spécialisations</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
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

          {/* Tri */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="score">Score</option>
            <option value="rating">Note</option>
            <option value="experience">Expérience</option>
            <option value="rate">Tarif</option>
          </select>
        </div>
      </div>

      {/* Résultats */}
      <div className="text-sm text-gray-600 mb-4">
        {filteredTalents.length} talent{filteredTalents.length > 1 ? 's' : ''} trouvé{filteredTalents.length > 1 ? 's' : ''}
      </div>

      {/* Liste des talents */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTalents.map((talent, index) => (
            <motion.div
              key={talent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Photo de profil */}
              <div className="h-48 bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center">
                {talent.photo ? (
                  <img
                    src={talent.photo}
                    alt={`${talent.firstName} ${talent.lastName}`}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <UserCircleIcon className="w-24 h-24 text-gray-400" />
                )}
              </div>

              {/* Informations */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {talent.firstName} {talent.lastName}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4" />
                      <span>{talent.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <StarIcon className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-medium">{talent.rating}</span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {talent.bio}
                </p>

                {/* Spécialisations */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {talent.specializations.slice(0, 3).map((spec) => (
                    <span
                      key={spec}
                      className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                    >
                      {spec}
                    </span>
                  ))}
                  {talent.specializations.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{talent.specializations.length - 3}
                    </span>
                  )}
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Score</span>
                    <div className="font-semibold text-primary-600">{talent.score}/100</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Expérience</span>
                    <div className="font-semibold">{talent.experience} ans</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-primary-600">
                    {talent.hourlyRate}€/h
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleFavorite(talent.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <HeartIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleContact(talent.id)}
                      className="btn-primary btn-sm"
                    >
                      Contacter
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTalents.map((talent, index) => (
            <motion.div
              key={talent.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center space-x-4">
                {/* Photo */}
                <div className="flex-shrink-0">
                  {talent.photo ? (
                    <img
                      src={talent.photo}
                      alt={`${talent.firstName} ${talent.lastName}`}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <UserCircleIcon className="w-16 h-16 text-gray-400" />
                  )}
                </div>

                {/* Informations principales */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {talent.firstName} {talent.lastName}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <MapPinIcon className="h-4 w-4" />
                          <span>{talent.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <AcademicCapIcon className="h-4 w-4" />
                          <span>{talent.experience} ans d'expérience</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <StarIcon className="h-4 w-4 text-yellow-400" />
                          <span>{talent.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">
                        {talent.hourlyRate}€/h
                      </div>
                      <div className="text-sm text-gray-600">
                        Score: {talent.score}/100
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 text-gray-600 line-clamp-2">
                    {talent.bio}
                  </p>

                  {/* Spécialisations */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {talent.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleFavorite(talent.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <HeartIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleContact(talent.id)}
                    className="btn-primary btn-sm"
                  >
                    Contacter
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {filteredTalents.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun talent trouvé</h3>
          <p className="mt-1 text-sm text-gray-500">
            Essayez d'ajuster vos critères de recherche.
          </p>
        </div>
      )}
    </div>
  );
} 