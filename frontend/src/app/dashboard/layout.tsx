'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  HeartIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading, logout } = useAuth();

  useEffect(() => {
    // Si l'authentification est terminée et que l'utilisateur n'est pas connecté
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
  };

  const navigation = [
    {
      name: 'Tableau de bord',
      href: '/dashboard',
      icon: HomeIcon,
      current: pathname === '/dashboard'
    },
    {
      name: 'Talents',
      href: '/dashboard/talents',
      icon: UserGroupIcon,
      current: pathname.startsWith('/dashboard/talents'),
      roles: ['ENTERPRISE', 'INVESTOR', 'ADMIN']
    },
    {
      name: 'Entreprises',
      href: '/dashboard/enterprises',
      icon: BuildingOfficeIcon,
      current: pathname.startsWith('/dashboard/enterprises'),
      roles: ['ADMIN']
    },
    {
      name: 'Missions',
      href: '/dashboard/missions',
      icon: ChartBarIcon,
      current: pathname.startsWith('/dashboard/missions'),
      roles: ['TALENT', 'ENTERPRISE', 'ADMIN']
    },
    {
      name: 'Matching',
      href: '/dashboard/matching',
      icon: HeartIcon,
      current: pathname.startsWith('/dashboard/matching'),
      roles: ['TALENT', 'ENTERPRISE', 'ADMIN']
    },
    {
      name: 'Académie',
      href: '/dashboard/academy',
      icon: AcademicCapIcon,
      current: pathname.startsWith('/dashboard/academy'),
      roles: ['TALENT', 'ADMIN']
    },
    {
      name: 'Contrats',
      href: '/dashboard/contracts',
      icon: ChartBarIcon,
      current: pathname.startsWith('/dashboard/contracts'),
      roles: ['TALENT', 'ENTERPRISE', 'ADMIN']
    },
    {
      name: 'Paiements',
      href: '/dashboard/payments',
      icon: CreditCardIcon,
      current: pathname.startsWith('/dashboard/payments'),
      roles: ['TALENT', 'ENTERPRISE', 'ADMIN']
    },
    {
      name: 'Paramètres',
      href: '/dashboard/settings',
      icon: CogIcon,
      current: pathname.startsWith('/dashboard/settings')
    }
  ].filter(item => !item.roles || item.roles.includes(user?.role || ''));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Le useEffect redirigera vers la page de connexion
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar pour mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="relative flex w-full max-w-xs flex-1 flex-col bg-white"
            >
              <div className="flex flex-shrink-0 items-center px-6 py-4">
                <h1 className="text-2xl font-bold text-gradient">TalentEx</h1>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="ml-auto rounded-md p-2 text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 px-4 py-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      item.current
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar pour desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center px-6 py-4">
            <h1 className="text-2xl font-bold text-gradient">TalentEx</h1>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-md p-2 text-gray-400 hover:text-gray-500"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="relative">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.firstName?.[0] || user?.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user?.email
                      }
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {user?.role?.toLowerCase()}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-500"
                title="Déconnexion"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenu de la page */}
        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 