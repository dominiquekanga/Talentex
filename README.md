# 🚀 TalentEx - Plateforme de Découverte et Formation de Talents

**TalentEx** est une plateforme SaaS complète pour découvrir, former, connecter et investir dans des talents stratégiques (juristes, consultants, négociateurs, chefs de projets).

## ✨ Fonctionnalités Principales

### 🧑‍🎓 Espace Talent
- Création de compte et profil public
- Accès aux formations et certifications
- Tableau de bord personnel avec score et progression
- Gestion des opportunités et missions

### 🏢 Espace Entreprise
- Compte entreprise avec abonnement
- Accès aux profils talents avec filtres avancés
- Publication d'opportunités et missions
- Historique des contrats et facturation

### 🎓 Module Académie
- Formations en ligne avec vidéos, quiz et PDF
- Suivi de progression avec barres et badges
- Certificats de formation
- Évaluations finales

### 🤝 Matching & Contrats
- Matching automatique profils ↔ missions
- Génération de contrats tripartites
- Signature électronique simulée
- Suivi des contrats en temps réel

### 💸 Paiement & Commissions
- Paiement des missions via la plateforme
- Commission automatique (10%)
- Reversement net aux talents
- Dashboard financier complet

### 📈 Investissement dans les Talents
- Espace investisseur dédié
- Accès aux profils éligibles
- ISA (revenus futurs)
- Suivi rendement & performance

## 🛠️ Stack Technique

### Frontend
- **Next.js 14** avec App Router
- **TypeScript** pour la sécurité des types
- **TailwindCSS** pour le styling
- **Framer Motion** pour les animations
- **React Query** pour la gestion d'état
- **Socket.io Client** pour les notifications temps réel

### Backend
- **Node.js** avec **Express**
- **TypeScript** pour la sécurité des types
- **Prisma** comme ORM
- **PostgreSQL** comme base de données
- **Redis** pour le cache et les sessions
- **Socket.io** pour les notifications temps réel
- **JWT** pour l'authentification
- **Swagger** pour la documentation API

### Infrastructure
- **Docker** et **Docker Compose**
- **PostgreSQL** pour la persistance
- **Redis** pour le cache
- **Cloudinary** (préparé) pour les fichiers
- **Stripe/PayDunya** (préparé) pour les paiements

## 🚀 Installation et Démarrage

### Prérequis
- Docker et Docker Compose
- Node.js 18+ (pour le développement local)

### Démarrage Rapide

1. **Cloner le repository**
```bash
git clone <repository-url>
cd Talentex1
```

2. **Configurer les variables d'environnement**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. **Démarrer avec Docker**
```bash
docker compose up -d
```

4. **Vérifier le démarrage**
```bash
./test-api.sh
```

### Accès aux Services

- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:5001
- 📚 **Documentation API**: http://localhost:5001/api-docs
- 🏥 **Health Check**: http://localhost:5001/health
- 🗄️ **Base de données**: localhost:5432
- 🔴 **Redis**: localhost:6379

## 📊 Structure du Projet

```
Talentex1/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── controllers/     # Contrôleurs métier
│   │   ├── middleware/      # Middlewares (auth, validation)
│   │   ├── models/          # Modèles Prisma
│   │   ├── routes/          # Routes API
│   │   ├── services/        # Services métier
│   │   ├── utils/           # Utilitaires
│   │   └── app.ts          # Point d'entrée
│   ├── prisma/             # Schéma et migrations
│   └── package.json
├── frontend/               # Application Next.js
│   ├── src/
│   │   ├── app/            # Pages App Router
│   │   ├── components/     # Composants React
│   │   ├── contexts/       # Contextes React
│   │   ├── hooks/          # Hooks personnalisés
│   │   ├── services/       # Services API
│   │   └── styles/         # Styles CSS
│   └── package.json
├── docker-compose.yml      # Configuration Docker
├── .env.example           # Variables d'environnement
└── README.md
```

## 🔐 Authentification et Rôles

### Rôles Utilisateurs
- **TALENT**: Accès aux formations, missions, profil
- **ENTERPRISE**: Gestion des missions, recrutement
- **INVESTOR**: Investissement dans les talents
- **ADMIN**: Administration complète

### Sécurité
- Authentification JWT
- Middleware de rôles
- Validation des données
- Rate limiting
- CORS configuré
- Helmet pour la sécurité

## 📈 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur
- `POST /api/auth/logout` - Déconnexion

### Talents
- `GET /api/talents` - Liste des talents
- `GET /api/talents/:id` - Détail d'un talent
- `POST /api/talents` - Créer un profil
- `PUT /api/talents/:id` - Modifier un profil

### Missions
- `GET /api/missions` - Liste des missions
- `POST /api/missions` - Créer une mission
- `PUT /api/missions/:id` - Modifier une mission

### Académie
- `GET /api/academy/formations` - Formations disponibles
- `GET /api/academy/progress` - Progression utilisateur
- `POST /api/academy/enroll` - S'inscrire à une formation

### Matching
- `GET /api/matching` - Propositions de matching
- `POST /api/matching/accept` - Accepter une proposition
- `POST /api/matching/reject` - Rejeter une proposition

### Contrats
- `GET /api/contracts` - Liste des contrats
- `POST /api/contracts` - Créer un contrat
- `PUT /api/contracts/:id/status` - Modifier le statut

### Paiements
- `GET /api/payments/user` - Historique des paiements
- `POST /api/payments/initiate` - Initier un paiement
- `POST /api/payments/webhook` - Webhook de paiement

### Administration
- `GET /api/admin/stats` - Statistiques globales
- `GET /api/admin/users` - Gestion des utilisateurs
- `GET /api/admin/approvals` - Demandes d'approbation

## 🧪 Tests

### Test de l'API
```bash
./test-api.sh
```

### Tests manuels
1. Créer un compte talent
2. Se connecter
3. Accéder au dashboard
4. Parcourir les formations
5. Consulter les missions disponibles

## 🔧 Développement

### Variables d'environnement Backend
```env
DATABASE_URL="postgresql://user:password@localhost:5432/talenteex"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
NODE_ENV="development"
PORT=5000
```

### Variables d'environnement Frontend
```env
NEXT_PUBLIC_API_URL="http://localhost:5001"
NEXT_PUBLIC_APP_NAME="TalentEx"
```

### Commandes de développement
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev

# Base de données
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

## 🚀 Déploiement

### Production avec Docker
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Variables d'environnement Production
- Configurer les URLs de production
- Utiliser des secrets sécurisés
- Configurer les services externes (Cloudinary, Stripe)

## 📝 Documentation

- **API Documentation**: http://localhost:5001/api-docs
- **Schéma Base de données**: `backend/prisma/schema.prisma`
- **Architecture**: Voir la structure du projet ci-dessus

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commiter les changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Consulter la documentation API
- Vérifier les logs Docker : `docker compose logs`

---

**TalentEx** - Découvrir, Former, Connecter, Investir dans les Talents Stratégiques 🚀 