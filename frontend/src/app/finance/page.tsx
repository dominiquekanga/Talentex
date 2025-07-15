'use client';

import { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  CreditCardIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface FinancialStats {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  pendingPayments: number;
  completedPayments: number;
  monthlyGrowth: number;
  averageTransaction: number;
}

interface Payment {
  id: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  type: 'INCOMING' | 'OUTGOING';
  description: string;
  createdAt: string;
  contract?: {
    id: string;
    title: string;
  };
  mission?: {
    id: string;
    title: string;
  };
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  netIncome: number;
}

export default function FinancePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    pendingPayments: 0,
    completedPayments: 0,
    monthlyGrowth: 0,
    averageTransaction: 0,
  });
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('month');

  useEffect(() => {
    fetchFinancialData();
  }, [user, period]);

  const fetchFinancialData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Récupérer les statistiques
      const statsResponse = await fetch(`http://localhost:5001/api/finance/stats?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Récupérer les paiements récents
      const paymentsResponse = await fetch('http://localhost:5001/api/finance/payments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setRecentPayments(paymentsData.data);
      }

      // Récupérer les données mensuelles
      const monthlyResponse = await fetch('http://localhost:5001/api/finance/monthly', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (monthlyResponse.ok) {
        const monthlyData = await monthlyResponse.json();
        setMonthlyData(monthlyData.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données financières:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Terminé';
      case 'PENDING':
        return 'En attente';
      case 'FAILED':
        return 'Échoué';
      case 'REFUNDED':
        return 'Remboursé';
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INCOMING':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />;
      case 'OUTGOING':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />;
    }
  };

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
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Financier</h1>
              <p className="mt-1 text-sm text-gray-500">
                Suivi complet de vos finances et paiements
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="quarter">Ce trimestre</option>
                <option value="year">Cette année</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Revenus Totaux</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()} €</p>
                <p className="text-sm text-green-600 flex items-center">
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                  +{stats.monthlyGrowth}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Dépenses Totales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalExpenses.toLocaleString()} €</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BanknotesIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Revenu Net</p>
                <p className="text-2xl font-bold text-gray-900">{stats.netIncome.toLocaleString()} €</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CreditCardIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Transaction Moyenne</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageTransaction.toLocaleString()} €</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Graphique des revenus mensuels */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Évolution des Revenus</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {monthlyData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">{data.month}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">
                          Revenus: {data.revenue.toLocaleString()} €
                        </span>
                        <span className="text-sm text-gray-600">
                          Dépenses: {data.expenses.toLocaleString()} €
                        </span>
                        <span className={`text-sm font-medium ${
                          data.netIncome >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          Net: {data.netIncome.toLocaleString()} €
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Paiements récents */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Paiements Récents</h3>
              </div>
              <div className="p-6">
                {recentPayments.length > 0 ? (
                  <div className="space-y-4">
                    {recentPayments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          {getTypeIcon(payment.type)}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {payment.description}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(payment.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${
                            payment.type === 'INCOMING' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {payment.type === 'INCOMING' ? '+' : '-'}{payment.amount.toLocaleString()} €
                          </p>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {getStatusLabel(payment.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucun paiement récent</p>
                )}
              </div>
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Actions Rapides</h3>
              </div>
              <div className="p-6 space-y-3">
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <DocumentTextIcon className="h-4 w-4 inline mr-2" />
                  Générer Rapport
                </button>
                <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                  <BanknotesIcon className="h-4 w-4 inline mr-2" />
                  Nouveau Paiement
                </button>
                <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  <ChartBarIcon className="h-4 w-4 inline mr-2" />
                  Voir Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 