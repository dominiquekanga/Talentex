'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  StarIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import SignatureModal from '../../../components/SignatureModal';
import { API_ENDPOINTS } from '../../config/api';

interface Contract {
  id: string;
  missionId: string;
  talentId: string;
  enterpriseId: string;
  amount: number;
  commission: number;
  netAmount: number;
  startDate: string;
  endDate: string;
  status: string;
  rating?: number;
  signedAt?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  mission: {
    id: string;
    title: string;
    description: string;
    enterprise: {
      id: string;
      name: string;
      logo?: string;
    };
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
  signatures: Array<{
    id: string;
    signerId: string;
    signerRole: string;
    signedAt: string;
    isSigned: boolean;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    paidAt?: string;
  }>;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [selectedContractForSignature, setSelectedContractForSignature] = useState<Contract | null>(null);

  const statuses = [
    { id: 'all', name: 'Tous les contrats', color: 'text-gray-600' },
    { id: 'draft', name: 'Brouillon', color: 'text-gray-500' },
    { id: 'active', name: 'Actif', color: 'text-green-600' },
    { id: 'completed', name: 'Terminé', color: 'text-blue-600' },
    { id: 'cancelled', name: 'Annulé', color: 'text-red-600' }
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadContracts();
  }, [selectedStatus, currentPage]);

  const loadContracts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const params = new URLSearchParams({
        status: selectedStatus,
        page: currentPage.toString(),
        limit: '10'
      });

      const response = await fetch(`${API_ENDPOINTS.CONTRACTS}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContracts(data.data.contracts || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des contrats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignContract = (contract: Contract) => {
    setSelectedContractForSignature(contract);
    setShowSignatureModal(true);
  };

  const handleSignatureComplete = () => {
    setShowSignatureModal(false);
    setSelectedContractForSignature(null);
    loadContracts();
  };

  const handleUpdateStatus = async (contractId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.CONTRACTS}/${contractId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert('Statut mis à jour avec succès !');
        loadContracts();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleRateContract = async (contractId: string, rating: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.CONTRACTS}/${contractId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating })
      });

      if (response.ok) {
        alert('Contrat noté avec succès !');
        loadContracts();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de la notation:', error);
      alert('Erreur lors de la notation du contrat');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <DocumentTextIcon className="h-5 w-5" />;
      case 'active': return <CheckCircleIcon className="h-5 w-5" />;
      case 'completed': return <CheckCircleIcon className="h-5 w-5" />;
      case 'cancelled': return <XCircleIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canSignContract = (contract: Contract) => {
    if (user?.role === 'TALENT') {
      return contract.talent.userId === user.id && contract.status === 'draft';
    }
    if (user?.role === 'ENTERPRISE') {
      return contract.enterprise.userId === user.id && contract.status === 'draft';
    }
    return false;
  };

  const hasSigned = (contract: Contract, role: string) => {
    return contract.signatures.some(sig => sig.signerRole === role && sig.isSigned);
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
            Mes Contrats
          </h1>
          <p className="text-gray-600">
            Gérez vos contrats de mission et suivez leur progression
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
            <div className="text-sm text-gray-600">
              {contracts.length} contrat{contracts.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Liste des contrats */}
        <div className="grid gap-6">
          {contracts.map((contract, index) => (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(contract.status)}`}>
                        {getStatusIcon(contract.status)}
                        <span>{statuses.find(s => s.id === contract.status)?.name || contract.status}</span>
                      </div>
                      {contract.rating && (
                        <div className="flex items-center space-x-1 text-yellow-600">
                          <StarIcon className="h-4 w-4" />
                          <span className="text-sm">{contract.rating}/5</span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {contract.mission.title}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                        {contract.enterprise.name}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        {contract.talent.firstName} {contract.talent.lastName}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CurrencyEuroIcon className="h-4 w-4 mr-2" />
                        {contract.amount.toLocaleString()}€
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Du {new Date(contract.startDate).toLocaleDateString()} au {new Date(contract.endDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <DocumentTextIcon className="h-4 w-4 mr-2" />
                        Commission: {contract.commission.toLocaleString()}€ (10%)
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Signatures</h4>
                      <div className="flex space-x-4">
                        <div className={`flex items-center space-x-2 ${hasSigned(contract, 'PLATFORM') ? 'text-green-600' : 'text-gray-400'}`}>
                          <CheckCircleIcon className="h-4 w-4" />
                          <span className="text-xs">Plateforme</span>
                        </div>
                        <div className={`flex items-center space-x-2 ${hasSigned(contract, 'ENTERPRISE') ? 'text-green-600' : 'text-gray-400'}`}>
                          <CheckCircleIcon className="h-4 w-4" />
                          <span className="text-xs">Entreprise</span>
                        </div>
                        <div className={`flex items-center space-x-2 ${hasSigned(contract, 'TALENT') ? 'text-green-600' : 'text-gray-400'}`}>
                          <CheckCircleIcon className="h-4 w-4" />
                          <span className="text-xs">Talent</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedContract(contract);
                        setShowDetails(true);
                      }}
                      className="btn-secondary flex items-center"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Détails
                    </button>
                    
                    {canSignContract(contract) && (
                      <button
                        onClick={() => handleSignContract(contract)}
                        className="btn-primary flex items-center"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Signer
                      </button>
                    )}

                    {contract.status === 'active' && (
                      <button
                        onClick={() => handleUpdateStatus(contract.id, 'completed')}
                        className="btn-success flex items-center"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Terminer
                      </button>
                    )}

                    {contract.status === 'completed' && !contract.rating && (
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => handleRateContract(contract.id, rating)}
                            className="text-gray-400 hover:text-yellow-500 transition-colors"
                          >
                            <StarIcon className="h-4 w-4" />
                          </button>
                        ))}
                      </div>
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

        {contracts.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun contrat trouvé</h3>
            <p className="mt-1 text-sm text-gray-500">
              Vous n'avez pas encore de contrats.
            </p>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      {showDetails && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Détails du Contrat
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Mission</h3>
                <p className="text-gray-600">{selectedContract.mission.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Montants</h3>
                  <div className="space-y-1 text-sm">
                    <div>Total: {selectedContract.amount.toLocaleString()}€</div>
                    <div>Commission: {selectedContract.commission.toLocaleString()}€</div>
                    <div>Net: {selectedContract.netAmount.toLocaleString()}€</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Dates</h3>
                  <div className="space-y-1 text-sm">
                    <div>Début: {new Date(selectedContract.startDate).toLocaleDateString()}</div>
                    <div>Fin: {new Date(selectedContract.endDate).toLocaleDateString()}</div>
                    {selectedContract.signedAt && (
                      <div>Signé: {new Date(selectedContract.signedAt).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>

              {selectedContract.terms && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Termes du Contrat</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedContract.terms}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 space-x-2">
              <button
                onClick={() => setShowDetails(false)}
                className="btn-secondary"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  // TODO: Implémenter le téléchargement PDF
                  alert('Fonctionnalité PDF en cours de développement');
                }}
                className="btn-primary flex items-center"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Télécharger PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de signature électronique */}
      {showSignatureModal && selectedContractForSignature && (
        <SignatureModal
          isOpen={showSignatureModal}
          onClose={() => {
            setShowSignatureModal(false);
            setSelectedContractForSignature(null);
          }}
          contractId={selectedContractForSignature.id}
          contractTitle={selectedContractForSignature.mission.title}
          userRole={user?.role || ''}
          onSignatureComplete={handleSignatureComplete}
        />
      )}
    </div>
  );
} 