'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  UserIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../config/api';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  contractTitle: string;
  userRole: string;
  onSignatureComplete: () => void;
}

interface SignatureStatus {
  contractId: string;
  signatures: Array<{
    signerId: string;
    signerRole: 'TALENT' | 'ENTERPRISE' | 'PLATFORM';
    isSigned: boolean;
    signedAt?: string;
    ipAddress?: string;
    userAgent?: string;
  }>;
  status: 'DRAFT' | 'PENDING_SIGNATURES' | 'SIGNED' | 'COMPLETED';
  requiredSignatures: string[];
}

export default function SignatureModal({
  isOpen,
  onClose,
  contractId,
  contractTitle,
  userRole,
  onSignatureComplete
}: SignatureModalProps) {
  const [signatureStatus, setSignatureStatus] = useState<SignatureStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'review' | 'signing' | 'complete'>('review');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadSignatureStatus();
    }
  }, [isOpen, contractId]);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, []);

  const loadSignatureStatus = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.SIGNATURES_STATUS}/${contractId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSignatureStatus(data.data);
      } else {
        setError('Erreur lors du chargement du statut des signatures');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSignatures = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.SIGNATURES_INITIALIZE}/${contractId}/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await loadSignatureStatus();
      } else {
        setError('Erreur lors de l\'initialisation des signatures');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignContract = async () => {
    try {
      setIsSigning(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_ENDPOINTS.SIGNATURES_SIGN}/${contractId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          signatureData: signatureData || 'SIGNATURE_' + Date.now()
        })
      });

      if (response.ok) {
        setCurrentStep('complete');
        await loadSignatureStatus();
        onSignatureComplete();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la signature');
      }
    } catch (error) {
      setError('Erreur de connexion');
    } finally {
      setIsSigning(false);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData('');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'TALENT':
        return <UserIcon className="h-5 w-5" />;
      case 'ENTERPRISE':
        return <BuildingOfficeIcon className="h-5 w-5" />;
      case 'PLATFORM':
        return <ShieldCheckIcon className="h-5 w-5" />;
      default:
        return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'TALENT':
        return 'Talent';
      case 'ENTERPRISE':
        return 'Entreprise';
      case 'PLATFORM':
        return 'Plateforme TalentEx';
      default:
        return role;
    }
  };

  const canUserSign = () => {
    if (!signatureStatus) return false;
    const userSignature = signatureStatus.signatures.find(
      sig => sig.signerRole === userRole.toUpperCase()
    );
    return userSignature && !userSignature.isSigned;
  };

  const allSignaturesComplete = () => {
    return signatureStatus?.signatures.every(sig => sig.isSigned) || false;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <DocumentTextIcon className="h-8 w-8 text-primary-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Signature Électronique
                </h2>
                <p className="text-sm text-gray-600">{contractTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={loadSignatureStatus}
                  className="btn-primary"
                >
                  Réessayer
                </button>
              </div>
            ) : !signatureStatus ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  Initialiser le processus de signature pour ce contrat
                </p>
                <button
                  onClick={initializeSignatures}
                  className="btn-primary"
                >
                  Initialiser les signatures
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Statut des signatures */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Statut des signatures</h3>
                  <div className="space-y-2">
                    {signatureStatus.signatures.map((signature, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          signature.isSigned
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {getRoleIcon(signature.signerRole)}
                          <div>
                            <p className="font-medium text-gray-900">
                              {getRoleLabel(signature.signerRole)}
                            </p>
                            {signature.isSigned && signature.signedAt && (
                              <p className="text-sm text-gray-600">
                                Signé le {new Date(signature.signedAt).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {signature.isSigned ? (
                            <>
                              <CheckCircleIcon className="h-5 w-5 text-green-600" />
                              <span className="text-sm text-green-600 font-medium">Signé</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">En attente</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interface de signature */}
                {currentStep === 'review' && canUserSign() && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Votre signature
                      </h3>
                      <p className="text-gray-600">
                        Signez ci-dessous pour valider ce contrat
                      </p>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={200}
                        className="border border-gray-300 rounded bg-white cursor-crosshair"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <button
                        onClick={clearSignature}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Effacer la signature
                      </button>
                      <button
                        onClick={() => setCurrentStep('signing')}
                        disabled={!signatureData}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continuer
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirmation de signature */}
                {currentStep === 'signing' && (
                  <div className="text-center space-y-4">
                    <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Confirmer votre signature
                    </h3>
                    <p className="text-gray-600">
                      En signant ce contrat, vous acceptez les termes et conditions.
                      Cette action est irréversible.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => setCurrentStep('review')}
                        className="btn-secondary"
                      >
                        Retour
                      </button>
                      <button
                        onClick={handleSignContract}
                        disabled={isSigning}
                        className="btn-primary"
                      >
                        {isSigning ? 'Signature en cours...' : 'Confirmer la signature'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Signature complétée */}
                {currentStep === 'complete' && (
                  <div className="text-center space-y-4">
                    <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Signature enregistrée !
                    </h3>
                    <p className="text-gray-600">
                      Votre signature a été enregistrée avec succès.
                      {allSignaturesComplete() 
                        ? ' Le contrat est maintenant entièrement signé.'
                        : ' En attente des autres signatures.'
                      }
                    </p>
                    <button
                      onClick={onClose}
                      className="btn-primary"
                    >
                      Fermer
                    </button>
                  </div>
                )}

                {/* Contrat déjà signé */}
                {!canUserSign() && allSignaturesComplete() && (
                  <div className="text-center space-y-4">
                    <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Contrat entièrement signé
                    </h3>
                    <p className="text-gray-600">
                      Toutes les parties ont signé ce contrat.
                    </p>
                    <button
                      onClick={onClose}
                      className="btn-primary"
                    >
                      Fermer
                    </button>
                  </div>
                )}

                {/* En attente d'autres signatures */}
                {!canUserSign() && !allSignaturesComplete() && (
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <h3 className="text-lg font-medium text-gray-900">
                      En attente des autres signatures
                    </h3>
                    <p className="text-gray-600">
                      Vous avez déjà signé ce contrat. En attente des autres parties.
                    </p>
                    <button
                      onClick={onClose}
                      className="btn-secondary"
                    >
                      Fermer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 