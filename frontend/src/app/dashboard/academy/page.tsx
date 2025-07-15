'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlayIcon,
  AcademicCapIcon,
  ClockIcon,
  StarIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../config/api';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  category: string;
  rating: number;
  enrolledStudents: number;
  lessons: Lesson[];
  progress: number;
  isCompleted: boolean;
  certificate?: string;
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'quiz' | 'document';
  duration: number;
  isCompleted: boolean;
  isLocked: boolean;
}

export default function AcademyPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [userProgress, setUserProgress] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
    averageScore: 0
  });

  const categories = [
    { id: 'all', name: 'Tous les cours' },
    { id: 'juridique', name: 'Juridique' },
    { id: 'consulting', name: 'Consulting' },
    { id: 'negociation', name: 'Négociation' },
    { id: 'gestion-projet', name: 'Gestion de projet' },
    { id: 'finance', name: 'Finance' },
    { id: 'marketing', name: 'Marketing' }
  ];

  const levels = [
    { id: 'all', name: 'Tous les niveaux' },
    { id: 'debutant', name: 'Débutant' },
    { id: 'intermediaire', name: 'Intermédiaire' },
    { id: 'avance', name: 'Avancé' }
  ];

  useEffect(() => {
    loadAcademyData();
  }, []);

  const loadAcademyData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Charger les cours
      const coursesResponse = await fetch(API_ENDPOINTS.ACADEMY_COURSES, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData.data || []);
      }

      // Charger la progression
      const progressResponse = await fetch(API_ENDPOINTS.ACADEMY_PROGRESS, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setUserProgress(progressData.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'académie:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const categoryMatch = selectedCategory === 'all' || course.category.toLowerCase() === selectedCategory;
    const levelMatch = selectedLevel === 'all' || course.level.toLowerCase() === selectedLevel;
    return categoryMatch && levelMatch;
  });

  const handleStartCourse = (courseId: string) => {
    // Logique pour démarrer un cours
    console.log('Démarrer le cours:', courseId);
  };

  const handleContinueCourse = (courseId: string) => {
    // Logique pour continuer un cours
    console.log('Continuer le cours:', courseId);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Débutant':
        return 'bg-green-100 text-green-800';
      case 'Intermédiaire':
        return 'bg-yellow-100 text-yellow-800';
      case 'Avancé':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Académie TalentEx</h1>
        <p className="mt-2 text-gray-600">
          Développez vos compétences avec nos formations spécialisées
        </p>
      </div>

      {/* Statistiques de progression */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cours suivis</p>
              <p className="text-2xl font-bold text-gray-900">{userProgress.completedCourses}/{userProgress.totalCourses}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Leçons terminées</p>
              <p className="text-2xl font-bold text-gray-900">{userProgress.completedLessons}/{userProgress.totalLessons}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Score moyen</p>
              <p className="text-2xl font-bold text-gray-900">{userProgress.averageScore}%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Temps total</p>
              <p className="text-2xl font-bold text-gray-900">24h</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <StarIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Certificats</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {levels.map((level) => (
                <option key={level.id} value={level.id}>{level.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des cours */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Thumbnail */}
            <div className="relative h-48 bg-gradient-to-br from-primary-50 to-blue-50">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <AcademicCapIcon className="w-16 h-16 text-gray-400" />
                </div>
              )}
              
              {/* Badge de progression */}
              {course.progress > 0 && (
                <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 shadow-sm">
                  <span className="text-sm font-medium text-primary-600">{course.progress}%</span>
                </div>
              )}

              {/* Badge de niveau */}
              <div className="absolute bottom-4 left-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
                  {course.level}
                </span>
              </div>

              {/* Badge de certification */}
              {course.isCompleted && (
                <div className="absolute top-4 left-4 bg-green-500 rounded-full p-2">
                  <CheckCircleIcon className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Contenu */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

              {/* Statistiques */}
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>{course.duration}h</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <StarIcon className="h-4 w-4 text-yellow-400" />
                    <span>{course.rating}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {course.enrolledStudents} étudiants
                </div>
              </div>

              {/* Barre de progression */}
              {course.progress > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progression</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                {course.isCompleted ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Terminé</span>
                  </div>
                ) : course.progress > 0 ? (
                  <button
                    onClick={() => handleContinueCourse(course.id)}
                    className="btn-primary btn-sm"
                  >
                    Continuer
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartCourse(course.id)}
                    className="btn-primary btn-sm"
                  >
                    Commencer
                  </button>
                )}

                {course.certificate && (
                  <button className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                    Voir certificat
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredCourses.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun cours trouvé</h3>
          <p className="mt-1 text-sm text-gray-500">
            Essayez d'ajuster vos filtres de recherche.
          </p>
        </div>
      )}

      {/* Cours recommandés */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cours recommandés</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {courses.slice(0, 4).map((course) => (
            <div key={course.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                <p className="text-xs text-gray-500">{course.duration}h</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 