# Guide de Déploiement - TalentEx

Ce guide vous accompagne dans le déploiement de TalentEx en production.

## 🚀 Déploiement Rapide

### Option 1: Déploiement avec Docker (Recommandé)

```bash
# Cloner le projet
git clone <repository-url>
cd TalentEx

# Configurer les variables d'environnement
cp backend/env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Éditer les fichiers .env avec vos configurations de production

# Démarrer avec Docker
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Déploiement Manuel

```bash
# Installer les dépendances
npm run install:all

# Configurer la base de données
npm run db:generate
npm run db:migrate

# Build de production
npm run build

# Démarrer les services
npm start
```

## 🌐 Déploiement sur Plateformes Cloud

### Vercel (Frontend)

1. **Connecter le repository**
   ```bash
   vercel --prod
   ```

2. **Configurer les variables d'environnement**
   - `NEXT_PUBLIC_API_URL`: URL de votre API backend
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Clé publique Stripe

3. **Déployer**
   ```bash
   git push origin main
   ```

### Railway (Backend + Base de données)

1. **Connecter le repository**
   ```bash
   railway login
   railway init
   ```

2. **Configurer les services**
   - PostgreSQL Database
   - Node.js Backend

3. **Variables d'environnement**
   ```env
   DATABASE_URL=postgresql://...
   JWT_SECRET=votre-secret-jwt
   CLOUDINARY_CLOUD_NAME=votre-cloud-name
   STRIPE_SECRET_KEY=sk_live_...
   ```

4. **Déployer**
   ```bash
   railway up
   ```

### Heroku

1. **Créer l'application**
   ```bash
   heroku create talenteex-app
   ```

2. **Ajouter PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

3. **Configurer les variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=votre-secret-jwt
   heroku config:set CLOUDINARY_CLOUD_NAME=votre-cloud-name
   ```

4. **Déployer**
   ```bash
   git push heroku main
   ```

## 🔧 Configuration de Production

### Variables d'Environnement Backend

```env
# Base de données
DATABASE_URL="postgresql://user:password@host:port/database"

# Sécurité
JWT_SECRET="secret-jwt-super-securise-en-production"
NODE_ENV=production

# Services externes
CLOUDINARY_CLOUD_NAME="votre-cloud-name"
CLOUDINARY_API_KEY="votre-api-key"
CLOUDINARY_API_SECRET="votre-api-secret"

STRIPE_SECRET_KEY="sk_live_votre-cle-stripe"
STRIPE_WEBHOOK_SECRET="whsec_votre-webhook-secret"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="votre-email@gmail.com"
SMTP_PASS="votre-mot-de-passe-app"

# Serveur
PORT=5000
CORS_ORIGIN="https://votre-domaine.com"
```

### Variables d'Environnement Frontend

```env
NEXT_PUBLIC_API_URL=https://api.votre-domaine.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_votre-cle-stripe
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=votre-cloud-name
NEXT_PUBLIC_APP_NAME=TalentEx
```

## 🗄️ Configuration de la Base de Données

### PostgreSQL

1. **Créer la base de données**
   ```sql
   CREATE DATABASE talenteex;
   CREATE USER talenteex WITH PASSWORD 'mot-de-passe-securise';
   GRANT ALL PRIVILEGES ON DATABASE talenteex TO talenteex;
   ```

2. **Appliquer les migrations**
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma generate
   ```

3. **Seed des données (optionnel)**
   ```bash
   npm run db:seed
   ```

### Redis (Optionnel)

Pour améliorer les performances :

```bash
# Installer Redis
sudo apt-get install redis-server

# Configurer
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

## 🔒 Sécurité

### SSL/TLS

1. **Certificat SSL**
   ```bash
   # Avec Let's Encrypt
   sudo certbot --nginx -d votre-domaine.com
   ```

2. **Configuration Nginx**
   ```nginx
   server {
       listen 443 ssl;
       server_name votre-domaine.com;
       
       ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /api {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 📊 Monitoring

### PM2 (Process Manager)

```bash
# Installer PM2
npm install -g pm2

# Démarrer l'application
pm2 start backend/dist/app.js --name "talenteex-backend"
pm2 start frontend/.next/server.js --name "talenteex-frontend"

# Configurer le démarrage automatique
pm2 startup
pm2 save
```

### Logs

```bash
# Voir les logs
pm2 logs

# Monitoring en temps réel
pm2 monit
```

## 🔄 CI/CD

### GitHub Actions

Créer `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        npm ci
        cd backend && npm ci
        cd ../frontend && npm ci
        
    - name: Build
      run: |
        cd backend && npm run build
        cd ../frontend && npm run build
        
    - name: Deploy to server
      run: |
        # Script de déploiement personnalisé
        ./scripts/deploy.sh
```

## 🚨 Troubleshooting

### Problèmes Courants

1. **Erreur de connexion à la base de données**
   ```bash
   # Vérifier la connexion
   psql -h host -U user -d database
   
   # Vérifier les variables d'environnement
   echo $DATABASE_URL
   ```

2. **Erreur CORS**
   ```javascript
   // Vérifier CORS_ORIGIN dans backend/.env
   CORS_ORIGIN="https://votre-domaine.com"
   ```

3. **Erreur JWT**
   ```bash
   # Régénérer le secret JWT
   openssl rand -base64 32
   ```

4. **Problèmes de build**
   ```bash
   # Nettoyer le cache
   rm -rf node_modules
   rm -rf .next
   npm install
   ```

### Logs de Débogage

```bash
# Backend
cd backend
DEBUG=* npm run dev

# Frontend
cd frontend
NODE_ENV=development npm run dev
```

## 📈 Performance

### Optimisations

1. **Compression**
   ```javascript
   // Backend - déjà configuré
   app.use(compression());
   ```

2. **Cache Redis**
   ```javascript
   // Implémenter le cache Redis
   const redis = require('redis');
   const client = redis.createClient();
   ```

3. **CDN**
   - Configurer Cloudinary pour les images
   - Utiliser un CDN pour les assets statiques

4. **Database Indexing**
   ```sql
   -- Index pour les recherches fréquentes
   CREATE INDEX idx_talents_domain ON talents USING GIN(domain);
   CREATE INDEX idx_missions_status ON missions(status);
   ```

## 🔄 Mises à Jour

### Procédure de Mise à Jour

1. **Sauvegarder la base de données**
   ```bash
   pg_dump talenteex > backup_$(date +%Y%m%d).sql
   ```

2. **Puller les changements**
   ```bash
   git pull origin main
   ```

3. **Mettre à jour les dépendances**
   ```bash
   npm run install:all
   ```

4. **Appliquer les migrations**
   ```bash
   npm run db:migrate
   ```

5. **Redémarrer les services**
   ```bash
   pm2 restart all
   ```

## 📞 Support

Pour toute question ou problème :

- 📧 Email: support@talenteex.com
- 📖 Documentation: `/docs`
- 🐛 Issues: GitHub Issues
- 💬 Discord: [Lien Discord]

---

**Note**: Ce guide est un point de départ. Adaptez-le selon vos besoins spécifiques et votre infrastructure. 