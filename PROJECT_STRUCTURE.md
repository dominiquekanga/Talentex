# Structure du Projet TalentEx

## 📁 Vue d'ensemble

```
TalentEx/
├── 📁 backend/                 # API Node.js/Express
├── 📁 frontend/               # Application Next.js
├── 📁 scripts/                # Scripts d'installation et déploiement
├── 📄 package.json            # Scripts globaux et dépendances
├── 📄 docker-compose.yml      # Configuration Docker
├── 📄 README.md               # Documentation principale
├── 📄 DEPLOYMENT.md           # Guide de déploiement
└── 📄 .gitignore              # Fichiers ignorés par Git
```

## 🗂️ Backend (Node.js/Express)

### Structure des dossiers
```
backend/
├── 📁 src/
│   ├── 📁 controllers/        # Contrôleurs API
│   │   └── 📄 authController.ts
│   ├── 📁 middleware/         # Middleware (auth, validation)
│   │   └── 📄 auth.ts
│   ├── 📁 routes/             # Routes API
│   │   └── 📄 auth.ts
│   ├── 📁 services/           # Services métier
│   ├── 📁 types/              # Types TypeScript
│   │   └── 📄 index.ts
│   ├── 📁 utils/              # Utilitaires
│   │   ├── 📄 auth.ts
│   │   └── 📄 database.ts
│   └── 📄 app.ts              # Point d'entrée
├── 📁 prisma/                 # Schéma et migrations DB
│   └── 📄 schema.prisma       # Schéma de base de données
├── 📄 package.json            # Dépendances backend
├── 📄 tsconfig.json           # Configuration TypeScript
├── 📄 env.example             # Variables d'environnement
├── 📄 Dockerfile.dev          # Dockerfile de développement
└── 📄 nodemon.json            # Configuration Nodemon
```

### Modèles de données (Prisma)
- **User**: Utilisateurs de base avec rôles
- **Talent**: Profils des talents (juristes, consultants, etc.)
- **Enterprise**: Profils des entreprises
- **Investor**: Profils des investisseurs
- **Formation**: Cours et formations
- **Mission**: Missions et opportunités
- **Contract**: Contrats entre parties
- **Payment**: Paiements et commissions
- **Investment**: Investissements ISA
- **Notification**: Notifications système
- **Message**: Messagerie interne

### API Endpoints
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/forgot-password` - Mot de passe oublié
- `POST /api/auth/reset-password` - Réinitialisation mot de passe

## 🗂️ Frontend (Next.js)

### Structure des dossiers
```
frontend/
├── 📁 src/
│   ├── 📁 app/                # App Router Next.js 14
│   │   ├── 📄 layout.tsx      # Layout principal
│   │   ├── 📄 page.tsx        # Page d'accueil
│   │   └── 📄 globals.css     # Styles globaux
│   ├── 📁 components/         # Composants React
│   │   ├── 📁 ui/             # Composants UI de base
│   │   ├── 📁 forms/          # Composants de formulaires
│   │   ├── 📁 layout/         # Composants de mise en page
│   │   └── 📁 features/       # Composants spécifiques
│   ├── 📁 contexts/           # Contextes React
│   │   └── 📄 AuthContext.tsx
│   ├── 📁 hooks/              # Hooks personnalisés
│   ├── 📁 services/           # Services API
│   ├── 📁 types/              # Types TypeScript
│   └── 📁 utils/              # Utilitaires
├── 📄 package.json            # Dépendances frontend
├── 📄 next.config.js          # Configuration Next.js
├── 📄 tailwind.config.js      # Configuration Tailwind
├── 📄 tsconfig.json           # Configuration TypeScript
├── 📄 postcss.config.js       # Configuration PostCSS
├── 📄 Dockerfile.dev          # Dockerfile de développement
└── 📄 .env.local              # Variables d'environnement
```

### Pages principales
- **Page d'accueil**: Landing page avec présentation
- **Authentification**: Login/Register
- **Dashboard Talent**: Espace personnel des talents
- **Dashboard Enterprise**: Espace entreprise
- **Dashboard Investor**: Espace investisseur
- **Académie**: Formations et cours
- **Missions**: Recherche et gestion de missions
- **Matching**: Système de matching
- **Contrats**: Gestion des contrats
- **Paiements**: Suivi financier

## 🛠️ Technologies utilisées

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **File Upload**: Cloudinary
- **Payments**: Stripe
- **Email**: Nodemailer
- **Real-time**: Socket.io
- **Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Icons**: Heroicons
- **UI Components**: Headless UI
- **Notifications**: React Hot Toast

### DevOps & Tools
- **Containerization**: Docker & Docker Compose
- **Version Control**: Git
- **Package Manager**: npm
- **Linting**: ESLint
- **Formatting**: Prettier
- **Process Manager**: PM2 (production)
- **Monitoring**: Logs + Health checks

## 🔧 Configuration

### Variables d'environnement Backend
```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/talenteex"

# JWT
JWT_SECRET="votre-secret-jwt-super-securise"
JWT_EXPIRES_IN="7d"

# Cloudinary
CLOUDINARY_CLOUD_NAME="votre-cloud-name"
CLOUDINARY_API_KEY="votre-api-key"
CLOUDINARY_API_SECRET="votre-api-secret"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_COMMISSION_PERCENTAGE=10

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="votre-email@gmail.com"
SMTP_PASS="votre-mot-de-passe-app"

# Serveur
PORT=5000
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
```

### Variables d'environnement Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=votre-cloud-name
NEXT_PUBLIC_APP_NAME=TalentEx
```

## 🚀 Scripts disponibles

### Scripts globaux (package.json racine)
```bash
npm run dev              # Démarre backend + frontend
npm run dev:backend      # Démarre uniquement le backend
npm run dev:frontend     # Démarre uniquement le frontend
npm run build            # Build de production
npm run install:all      # Installe toutes les dépendances
npm run db:generate      # Génère le client Prisma
npm run db:migrate       # Applique les migrations
npm run db:studio        # Lance Prisma Studio
```

### Scripts backend
```bash
cd backend
npm run dev              # Démarre en mode développement
npm run build            # Build TypeScript
npm run start            # Démarre en production
npm run test             # Lance les tests
npm run db:seed          # Seed la base de données
```

### Scripts frontend
```bash
cd frontend
npm run dev              # Démarre en mode développement
npm run build            # Build de production
npm run start            # Démarre en production
npm run lint             # Vérifie le code
npm run type-check       # Vérifie les types TypeScript
```

## 📊 Base de données

### Schéma principal
```sql
-- Utilisateurs
users (id, email, password, role, isActive, isVerified, createdAt, updatedAt)

-- Profils spécifiques
talents (id, userId, firstName, lastName, bio, photo, cvUrl, videoUrl, score, domain[], skills[], experience, hourlyRate, isAvailable)
enterprises (id, userId, name, description, logo, website, industry, size, isVerified)
investors (id, userId, name, description, logo, website)

-- Formations
formations (id, title, description, content, videoUrl, pdfUrl, duration, difficulty, domain, isActive)
formation_progress (id, talentId, formationId, progress, isCompleted, completedAt)

-- Missions et contrats
missions (id, enterpriseId, title, description, domain[], skills[], duration, budget, location, isRemote, status)
matchings (id, missionId, talentId, score, status)
contracts (id, missionId, talentId, enterpriseId, amount, commission, netAmount, startDate, endDate, status)

-- Paiements et investissements
payments (id, contractId, talentId, amount, commission, netAmount, stripeId, status, paidAt)
investments (id, investorId, talentId, amount, percentage, duration, startDate, endDate, status, totalReturn)

-- Communication
notifications (id, userId, title, message, type, isRead, createdAt)
messages (id, senderId, receiverId, content, isRead, createdAt)
```

## 🔒 Sécurité

### Authentification
- JWT avec expiration configurable
- Hash des mots de passe avec bcrypt
- Validation de force des mots de passe
- Tokens de réinitialisation sécurisés

### Autorisation
- Middleware de vérification des rôles
- Contrôle d'accès aux ressources
- Vérification des abonnements actifs

### Protection
- Rate limiting
- Headers de sécurité (Helmet)
- Validation des données (Joi)
- Protection CSRF
- CORS configuré

## 📈 Fonctionnalités principales

### 🧑‍🎓 Espace Talent
- Création de profil public
- Upload de CV et vidéo
- Accès aux formations
- Tableau de bord personnel
- Gestion des opportunités

### 🏢 Espace Entreprise
- Compte entreprise avec abonnement
- Recherche de talents avec filtres
- Publication de missions
- Gestion des contrats
- Facturation automatisée

### 🎓 Module Académie
- Cours vidéo et PDF
- Quiz interactifs
- Suivi de progression
- Badges et certificats
- Évaluation finale

### 🤝 Matching & Contrats
- Algorithme de matching intelligent
- Génération de contrats tripartites
- Signature électronique
- Suivi des statuts

### 💸 Paiement & Commissions
- Intégration Stripe Connect
- Commission automatique (10%)
- Facturation automatisée
- Dashboard financier

### 📈 Investissement ISA
- Espace investisseur
- Profils éligibles à l'investissement
- Système ISA (Income Share Agreement)
- Suivi des rendements

## 🔄 Workflow de développement

1. **Installation**
   ```bash
   git clone <repository>
   cd TalentEx
   ./scripts/setup.sh
   ```

2. **Développement**
   ```bash
   npm run dev  # Démarre backend + frontend
   ```

3. **Base de données**
   ```bash
   npm run db:studio  # Interface Prisma Studio
   ```

4. **Tests**
   ```bash
   cd backend && npm test
   cd frontend && npm run type-check
   ```

5. **Déploiement**
   ```bash
   # Voir DEPLOYMENT.md pour les détails
   ```

## 📞 Support et documentation

- **README.md**: Guide principal
- **DEPLOYMENT.md**: Guide de déploiement
- **API Documentation**: http://localhost:5000/api-docs
- **Prisma Studio**: http://localhost:5555
- **Email**: support@talenteex.com

---

Cette structure offre une base solide pour développer et maintenir TalentEx, avec une séparation claire des responsabilités et une architecture scalable. 