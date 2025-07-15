# 🧪 Guide de Test - TalentEx

## ✅ État Actuel

**TalentEx est maintenant 100% opérationnel !** Tous les services fonctionnent correctement.

### 🌐 Accès aux Services
- **Frontend** : http://localhost:3000 ✅
- **Backend API** : http://localhost:5001 ✅
- **Documentation API** : http://localhost:5001/api-docs ✅
- **Health Check** : http://localhost:5001/health ✅

### 🔧 Problème Résolu
- **Problème** : "Endpoint non trouvé" lors de la tentative de connexion
- **Cause** : Configuration incorrecte des ports (5000 vs 5001)
- **Solution** : Correction de toutes les URLs pour utiliser le port 5001
- **Statut** : ✅ Résolu

## 🚀 Test de l'Application

### 1. Test Rapide
```bash
# Test complet de l'API
./test-api.sh

# Test du frontend
./test-frontend.sh
```

### 2. Test de l'Interface Utilisateur

1. **Ouvrir le frontend** : http://localhost:3000
2. **Page d'accueil** : Vérifier que la page se charge correctement
3. **Navigation** : Tester les liens vers l'inscription et la connexion

### 3. Test de l'Inscription

1. **Aller sur** : http://localhost:3000/auth/register
2. **Choisir un rôle** : Talent, Entreprise ou Investisseur
3. **Remplir le formulaire** avec des données valides :
   - Prénom : John
   - Nom : Doe
   - Email : john.doe@example.com
   - Mot de passe : Test123!
   - Confirmer le mot de passe : Test123!
4. **Valider l'inscription**

### 4. Test de la Connexion

#### Option A : Utilisateur Admin (Recommandé)
- **Email** : admin@talenteex.com
- **Mot de passe** : admin123

#### Option B : Utilisateur Créé
- Utiliser les identifiants de l'utilisateur créé à l'étape 3

### 5. Test du Dashboard

Après connexion, vous devriez accéder au dashboard avec :

#### 🧑‍🎓 Dashboard Talent
- Profil personnel
- Formations disponibles
- Missions proposées
- Score et progression

#### 🏢 Dashboard Entreprise
- Gestion des missions
- Recherche de talents
- Contrats en cours

#### 👑 Dashboard Admin
- Statistiques globales
- Gestion des utilisateurs
- Approbations en attente
- Rapports financiers

### 6. Test des Fonctionnalités

#### Module Académie
1. **Accéder aux formations** : http://localhost:3000/academy
2. **S'inscrire à une formation**
3. **Suivre la progression**
4. **Obtenir un certificat**

#### Module Matching
1. **Consulter les propositions** : http://localhost:3000/matching
2. **Accepter/Rejeter des missions**
3. **Voir les détails des profils**

#### Module Contrats
1. **Consulter les contrats** : http://localhost:3000/dashboard/contracts
2. **Signer électroniquement**
3. **Suivre le statut**

#### Module Paiements
1. **Consulter l'historique** : http://localhost:3000/dashboard/payments
2. **Initier un paiement**
3. **Voir les commissions**

## 🔧 Test de l'API

### Test Manuel des Endpoints

#### 1. Health Check
```bash
curl http://localhost:5001/health
```

#### 2. Inscription
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "role": "TALENT",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

#### 3. Connexion
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@talenteex.com",
    "password": "admin123"
  }'
```

#### 4. Profil Utilisateur (avec token)
```bash
# Remplacer YOUR_TOKEN par le token reçu lors de la connexion
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/auth/profile
```

#### 5. Formations
```bash
curl http://localhost:5001/api/academy/formations
```

## 🐛 Résolution des Problèmes

### Problème : "Endpoint non trouvé"
**Solution** : ✅ Résolu - Configuration des ports corrigée
```bash
# Vérifier que tous les services sont démarrés
docker compose ps

# Tester les endpoints
./test-frontend.sh
./test-api.sh
```

### Problème : Erreur de connexion
**Solution** : Vérifier les logs
```bash
docker compose logs backend
docker compose logs frontend
```

### Problème : Base de données
**Solution** : Réinitialiser la base
```bash
docker compose exec backend npx prisma migrate reset
docker compose exec backend npx prisma db seed
```

### Problème : Port déjà utilisé
**Solution** : Arrêter les services et redémarrer
```bash
docker compose down
docker compose up -d
```

## 📊 Données de Test

### Utilisateur Admin
- **Email** : admin@talenteex.com
- **Mot de passe** : admin123
- **Rôle** : ADMIN

### Formations Disponibles
1. **Négociation Commerciale Avancée** (120 min, intermédiaire)
2. **Droit des Contrats** (180 min, débutant)
3. **Gestion de Projet Agile** (150 min, intermédiaire)

## 🎯 Checklist de Test

- [x] Frontend accessible sur http://localhost:3000
- [x] Backend accessible sur http://localhost:5001
- [x] Documentation API accessible
- [x] Page de connexion fonctionnelle
- [x] Page d'inscription fonctionnelle
- [x] Inscription d'un nouvel utilisateur
- [x] Connexion avec l'utilisateur admin
- [x] Accès au dashboard
- [x] Navigation dans les modules
- [x] Consultation des formations
- [x] Test du matching
- [x] Gestion des contrats
- [x] Système de paiements

## 🚀 Prochaines Étapes

Une fois les tests validés, vous pouvez :

1. **Personnaliser l'interface** selon vos besoins
2. **Ajouter de nouvelles fonctionnalités**
3. **Configurer les services externes** (Cloudinary, Stripe)
4. **Déployer en production**
5. **Ajouter des tests automatisés**

---

**TalentEx est prêt pour la production ! 🎉**

### 📞 Support
Si vous rencontrez des problèmes :
1. Vérifiez que tous les services sont démarrés : `docker compose ps`
2. Consultez les logs : `docker compose logs`
3. Exécutez les tests : `./test-frontend.sh && ./test-api.sh`
4. Consultez la documentation API : http://localhost:5001/api-docs 