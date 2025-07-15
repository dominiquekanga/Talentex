'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  AcademicCapIcon, 
  ChartBarIcon,
  ArrowRightIcon,
  PlayIcon,
  CheckIcon,
  StarIcon
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('talents');

  const features = [
    {
      icon: UserGroupIcon,
      title: 'Découvrez des Talents',
      description: 'Accédez à une base de données de talents stratégiques vérifiés et qualifiés.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: AcademicCapIcon,
      title: 'Formez vos Équipes',
      description: 'Académie en ligne avec cours spécialisés, quiz et certificats reconnus.',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: BuildingOfficeIcon,
      title: 'Connectez & Collaborez',
      description: 'Matching intelligent et contrats sécurisés pour vos projets.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      icon: ChartBarIcon,
      title: 'Investissez dans l\'Avenir',
      description: 'ISA (Income Share Agreement) pour investir dans les talents prometteurs.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const testimonials = [
    {
      name: 'Marie Dubois',
      role: 'Directrice RH, TechCorp',
      content: 'TalentEx nous a permis de trouver des talents exceptionnels en quelques jours seulement.',
      rating: 5
    },
    {
      name: 'Jean Martin',
      role: 'Consultant Senior',
      content: 'La plateforme m\'a ouvert de nouvelles opportunités et m\'a aidé à développer mes compétences.',
      rating: 5
    },
    {
      name: 'Sophie Bernard',
      role: 'Investisseuse',
      content: 'Excellent retour sur investissement grâce au système ISA de TalentEx.',
      rating: 5
    }
  ];

  const stats = [
    { label: 'Talents Vérifiés', value: '500+' },
    { label: 'Entreprises Partenaires', value: '200+' },
    { label: 'Missions Réalisées', value: '1000+' },
    { label: 'Taux de Satisfaction', value: '98%' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container-responsive">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gradient">TalentEx</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="nav-link">Fonctionnalités</a>
              <a href="#pricing" className="nav-link">Tarifs</a>
              <a href="#about" className="nav-link">À propos</a>
              <a href="#contact" className="nav-link">Contact</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="btn-secondary">
                Connexion
              </Link>
              <Link href="/auth/register" className="btn-primary">
                Inscription
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-blue-50 py-20">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Découvrez, Formez,{' '}
                <span className="text-gradient">Connectez</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                La plateforme complète pour découvrir, former, connecter et investir 
                dans des talents stratégiques. Juristes, consultants, négociateurs, 
                chefs de projets - trouvez les meilleurs talents pour vos projets.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register" className="btn-primary btn-lg">
                  Commencer Gratuitement
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </Link>
                <button className="btn-secondary btn-lg flex items-center">
                  <PlayIcon className="w-5 h-5 mr-2" />
                  Voir la Démo
                </button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-strong p-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">En ligne</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-primary-600">500+</div>
                      <div className="text-sm text-gray-600">Talents</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-primary-600">200+</div>
                      <div className="text-sm text-gray-600">Entreprises</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container-responsive">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Une Plateforme Complète
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              TalentEx offre tous les outils nécessaires pour gérer vos talents 
              de A à Z, de la découverte à l'investissement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card text-center"
              >
                <div className="card-body">
                  <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20 bg-white">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pour Qui ?
            </h2>
            <p className="text-xl text-gray-600">
              TalentEx s'adresse à tous les acteurs de l'écosystème des talents.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Talents */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`card cursor-pointer transition-all duration-300 ${
                activeTab === 'talents' ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => setActiveTab('talents')}
            >
              <div className="card-body text-center">
                <UserGroupIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Talents
                </h3>
                <p className="text-gray-600 mb-4">
                  Juristes, consultants, négociateurs, chefs de projets
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                    Profil public professionnel
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                    Accès aux formations
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                    Opportunités de missions
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Entreprises */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`card cursor-pointer transition-all duration-300 ${
                activeTab === 'enterprises' ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => setActiveTab('enterprises')}
            >
              <div className="card-body text-center">
                <BuildingOfficeIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Entreprises
                </h3>
                <p className="text-gray-600 mb-4">
                  Recrutement et gestion de talents externes
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                    Accès aux profils talents
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                    Publication de missions
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                    Gestion des contrats
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Investisseurs */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`card cursor-pointer transition-all duration-300 ${
                activeTab === 'investors' ? 'ring-2 ring-primary-500' : ''
              }`}
              onClick={() => setActiveTab('investors')}
            >
              <div className="card-body text-center">
                <ChartBarIcon className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Investisseurs
                </h3>
                <p className="text-gray-600 mb-4">
                  Investissement dans les talents prometteurs
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                    Accès aux profils éligibles
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                    Système ISA
                  </li>
                  <li className="flex items-center">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                    Suivi des rendements
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ce qu'ils disent
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez les témoignages de nos utilisateurs satisfaits.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card"
              >
                <div className="card-body">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="container-responsive text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Rejoignez TalentEx et découvrez comment nous pouvons transformer 
            votre approche des talents stratégiques.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="btn-lg bg-white text-primary-600 hover:bg-gray-100">
              Créer un Compte
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
            <Link href="/contact" className="btn-lg border-2 border-white text-white hover:bg-white hover:text-primary-600">
              Nous Contacter
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container-responsive">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">TalentEx</h3>
              <p className="text-gray-400">
                La plateforme complète pour découvrir, former, connecter et investir 
                dans des talents stratégiques.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-white">Tarifs</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
                <li><a href="#" className="hover:text-white">Intégrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Ressources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
                <li><a href="#" className="hover:text-white">Communauté</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">À propos</a></li>
                <li><a href="#" className="hover:text-white">Carrières</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Presse</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TalentEx. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 