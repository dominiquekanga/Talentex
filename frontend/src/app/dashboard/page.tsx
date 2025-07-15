'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { API_ENDPOINTS } from '../../config/api';
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CurrencyEuroIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  role: 'TALENT' | 'ENTERPRISE' | 'INVESTOR' | 'ADMIN';
  firstName?: string;
  lastName?: string;
}

interface DashboardStats {
  totalTalents?: number;
  totalEnterprises?: number;
  totalMissions?: number;
  totalContracts?: number;
  totalRevenue?: number;
  monthlyRevenue?: number;
  activeSubscriptions?: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats>({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Charger les statistiques
      const statsResponse = await fetch(`${API_ENDPOINTS.DASHBOARD_STATS}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Charger les activités récentes
      const activitiesResponse = await fetch(`${API_ENDPOINTS.DASHBOARD_ACTIVITIES}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setRecentActivities(activitiesData.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) greeting = 'Bonjour';
    else if (hour < 18) greeting = 'Bon après-midi';
    else greeting = 'Bonsoir';

    return `${greeting}, ${user?.firstName || 'Utilisateur'} !`;
  };

  const getRoleSpecificStats = () => {
    switch (user?.role) {
      case 'TALENT':
        return [
          { name: 'Missions disponibles', value: stats.totalMissions || 0, icon: ChartBarIcon, color: 'text-blue-600' },
          { name: 'Contrats actifs', value: stats.totalContracts || 0, icon: CheckCircleIcon, color: 'text-green-600' },
          { name: 'Revenus totaux', value: `${stats.totalRevenue || 0}€`, icon: CurrencyEuroIcon, color: 'text-yellow-600' },
          { name: 'Formations suivies', value: '5', icon: AcademicCapIcon, color: 'text-purple-600' }
        ];
      case 'ENTERPRISE':
        return [
          { name: 'Talents disponibles', value: stats.totalTalents || 0, icon: UserGroupIcon, color: 'text-blue-600' },
          { name: 'Missions publiées', value: stats.totalMissions || 0, icon: ChartBarIcon, color: 'text-green-600' },
          { name: 'Contrats actifs', value: stats.totalContracts || 0, icon: CheckCircleIcon, color: 'text-yellow-600' },
          { name: 'Abonnement', value: 'Actif', icon: ArrowTrendingUpIcon, color: 'text-purple-600' }
        ];
      case 'ADMIN':
        return [
          { name: 'Talents', value: stats.totalTalents || 0, icon: UserGroupIcon, color: 'text-blue-600' },
          { name: 'Entreprises', value: stats.totalEnterprises || 0, icon: BuildingOfficeIcon, color: 'text-green-600' },
          { name: 'Missions', value: stats.totalMissions || 0, icon: ChartBarIcon, color: 'text-yellow-600' },
          { name: 'Revenus mensuels', value: `${stats.monthlyRevenue || 0}€`, icon: CurrencyEuroIcon, color: 'text-purple-600' }
        ];
      default:
        return [];
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
        <h1 className="text-3xl font-bold text-gray-900">{getWelcomeMessage()}</h1>
        <p className="mt-2 text-gray-600">
          Voici un aperçu de votre activité sur TalentEx
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getRoleSpecificStats().map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center">
              <div className={`p-2 rounded-lg bg-gray-50`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Graphiques et activités récentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des revenus */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des revenus</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Graphique en cours de développement</p>
          </div>
        </motion.div>

        {/* Activités récentes */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activités récentes</h3>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity: any, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">Bienvenue sur TalentEx !</p>
                    <p className="text-xs text-gray-500">Il y a quelques minutes</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">Votre compte a été créé avec succès</p>
                    <p className="text-xs text-gray-500">Il y a 1 heure</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Actions rapides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {user?.role === 'TALENT' && (
            <>
              <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <ChartBarIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium">Voir les missions</span>
              </button>
              <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <AcademicCapIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium">Accéder à l'académie</span>
              </button>
              <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <UserGroupIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium">Compléter mon profil</span>
              </button>
            </>
          )}
          {user?.role === 'ENTERPRISE' && (
            <>
              <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <UserGroupIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium">Rechercher des talents</span>
              </button>
              <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <ChartBarIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium">Publier une mission</span>
              </button>
              <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <BuildingOfficeIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium">Gérer l'abonnement</span>
              </button>
            </>
          )}
          {user?.role === 'ADMIN' && (
            <>
              <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <UserGroupIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium">Gérer les utilisateurs</span>
              </button>
              <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <ChartBarIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium">Voir les statistiques</span>
              </button>
              <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <CogIcon className="h-5 w-5 text-primary-600 mr-3" />
                <span className="text-sm font-medium">Paramètres système</span>
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
} 