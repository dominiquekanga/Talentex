'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCardIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  EyeIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../config/api';

interface Payment {
  id: string;
  contractId: string;
  amount: number;
  currency: string;
  status: string;
  type?: string;
  paymentMethod?: string;
  transactionId?: string;
  paidAt?: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
  contract: {
    id: string;
    mission: {
      id: string;
      title: string;
      description: string;
    };
    talent: {
      id: string;
      firstName: string;
      lastName: string;
      user: {
        email: string;
      };
    };
    enterprise: {
      id: string;
      name: string;
      user: {
        email: string;
      };
    };
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  const statuses = [
    { id: 'all', name: 'Tous les statuts', color: 'text-gray-600' },
    { id: 'pending', name: 'En attente', color: 'text-yellow-600' },
    { id: 'completed', name: 'Terminé', color: 'text-green-600' },
    { id: 'failed', name: 'Échoué', color: 'text-red-600' },
    { id: 'cancelled', name: 'Annulé', color: 'text-gray-500' }
  ];

  const types = [
    { id: 'all', name: 'Tous les types', color: 'text-gray-600' },
    { id: 'payment', name: 'Paiement', color: 'text-blue-600' },
    { id: 'commission', name: 'Commission', color: 'text-purple-600' },
    { id: 'reversal', name: 'Reversement', color: 'text-green-600' }
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadPayments();
  }, [selectedStatus, selectedType, currentPage]);

  const loadPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const params = new URLSearchParams({
        status: selectedStatus,
        type: selectedType,
        page: currentPage.toString(),
        limit: '10'
      });

      const response = await fetch(`${API_ENDPOINTS.PAYMENTS}/user?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.data.payments || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paiements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiatePayment = async (contractId: string, amount: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.PAYMENTS}/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contractId,
          amount,
          currency: 'EUR',
          description: `Paiement pour le contrat ${contractId}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Rediriger vers la page de paiement MyTouchPoint
        if (data.data.paymentUrl) {
          window.open(data.data.paymentUrl, '_blank');
        }
        alert('Paiement initialisé avec succès !');
        loadPayments();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du paiement:', error);
      alert('Erreur lors de l\'initialisation du paiement');
    }
  };

  const handleRetryPayment = async (transactionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.PAYMENTS}/retry/${transactionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data.paymentUrl) {
          window.open(data.data.paymentUrl, '_blank');
        }
        alert('Paiement relancé avec succès !');
        loadPayments();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de la relance du paiement:', error);
      alert('Erreur lors de la relance du paiement');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <ClockIcon className="h-5 w-5" />;
      case 'completed': return <CheckCircleIcon className="h-5 w-5" />;
      case 'failed': return <XCircleIcon className="h-5 w-5" />;
      case 'cancelled': return <XCircleIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-blue-100 text-blue-800';
      case 'commission': return 'bg-purple-100 text-purple-800';
      case 'reversal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canInitiatePayment = (payment: Payment) => {
    return user?.role === 'ENTERPRISE' && 
           payment.contract.enterprise.userId === user.id && 
           payment.status === 'failed';
  };

  const canRetryPayment = (payment: Payment) => {
    return user?.role === 'ENTERPRISE' && 
           payment.contract.enterprise.userId === user.id && 
           payment.status === 'failed' && 
           payment.type === 'payment';
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
            Mes Paiements
          </h1>
          <p className="text-gray-600">
            Gérez vos transactions et suivez vos paiements
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Statut:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                {statuses.map(status => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                {types.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-600">
              {payments.length} paiement{payments.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Liste des paiements */}
        <div className="grid gap-6">
          {payments.map((payment, index) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span>{statuses.find(s => s.id === payment.status)?.name || payment.status}</span>
                      </div>
                      {payment.type && (
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(payment.type)}`}>
                          {types.find(t => t.id === payment.type)?.name || payment.type}
                        </div>
                      )}
                      {payment.transactionId && (
                        <div className="text-sm text-gray-500">
                          ID: {payment.transactionId}
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {payment.contract.mission.title}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                        {payment.contract.enterprise.name}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        {payment.contract.talent.firstName} {payment.contract.talent.lastName}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CurrencyEuroIcon className="h-4 w-4 mr-2" />
                        {payment.amount.toLocaleString()} {payment.currency}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CreditCardIcon className="h-4 w-4 mr-2" />
                        {payment.paymentMethod || 'Non spécifié'}
                      </div>
                    </div>

                    {payment.metadata && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Détails</h4>
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(JSON.parse(payment.metadata), null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedContract(payment.contract);
                        setShowPaymentModal(true);
                      }}
                      className="btn-secondary flex items-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Détails
                    </button>
                    
                    {canRetryPayment(payment) && (
                      <button
                        onClick={() => handleRetryPayment(payment.transactionId!)}
                        className="btn-warning flex items-center"
                      >
                        <ArrowPathIcon className="h-4 w-4 mr-1" />
                        Relancer
                      </button>
                    )}

                    {canInitiatePayment(payment) && (
                      <button
                        onClick={() => handleInitiatePayment(payment.contractId, payment.amount)}
                        className="btn-primary flex items-center"
                      >
                        <CreditCardIcon className="h-4 w-4 mr-1" />
                        Payer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="px-3 py-2 text-sm text-gray-600">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {payments.length === 0 && (
          <div className="text-center py-12">
            <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun paiement trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              Vous n'avez pas encore de transactions.
            </p>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showPaymentModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Détails du Paiement
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Mission</h3>
                <p className="text-gray-600">{selectedContract.mission.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Parties</h3>
                  <div className="space-y-1 text-sm">
                    <div>Entreprise: {selectedContract.enterprise.name}</div>
                    <div>Talent: {selectedContract.talent.firstName} {selectedContract.talent.lastName}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Informations</h3>
                  <div className="space-y-1 text-sm">
                    <div>ID Contrat: {selectedContract.id}</div>
                    <div>Email Talent: {selectedContract.talent.user.email}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
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