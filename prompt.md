Tu es un assistant de développement expert en SaaS.

Je veux créer une plateforme web nommée **TalentEx**, qui permet de découvrir, former, connecter et investir dans des talents stratégiques (juristes, consultants, négociateurs, chefs de projets). Voici les modules à générer :

### Objectif :
Créer un site complet avec front-end, back-end, base de données, système d’authentification et interface admin.

---

### 🧑‍🎓 Espace Talent :
- Création de compte
- Profil public (photo, bio, CV, vidéo, score, historique de missions)
- Accès aux formations
- Tableau de bord personnel (score, progression, opportunités)

### 🏢 Espace Entreprise :
- Compte entreprise
- Abonnement payant obligatoire
- Accès profils talents (filtres + fiches)
- Publication d’opportunités (missions, stages)
- Historique contrats + facturation

### 🎓 Module Académie :
- Accès à des cours (vidéos, quiz, PDF)
- Suivi de progression (barre, badges, certificats)
- Évaluation finale

### 🤝 Matching & Contrats :
- Matching automatique profils <-> missions (score, domaine, compétences)
- Génération de contrats tripartites (entreprise-talent-plateforme)
- Suivi des contrats + signature électronique

### 💸 Paiement & Commissions :
- Paiement des missions via la plateforme
- Commission automatique prélevée par TalentEx (ex : 10%)
- Reversement net au talent
- Facturation automatisée + dashboard financier

### 📈 Investissement dans les Talents :
- Espace investisseur
- Accès à des profils éligibles à l’investissement
- ISA (revenus futurs)
- Suivi rendement & performance

---

### Stack technique à respecter :
- **Frontend :** Next.js + TailwindCSS
- **Backend :** Node.js + Express (ou Laravel si PHP)
- **BDD :** PostgreSQL
- **Auth :** JWT ou Firebase Auth
- **Fichiers :** Cloudinary (CV, vidéo)
- **Paiement :** Stripe Connect ou PayDunya
- **Messagerie interne :** Socket.io

---

### Base de données à inclure :
- Utilisateurs (id, email, mot de passe, rôle)
- Talents (bio, score, progression, CV, vidéo)
- Entreprises (infos, abonnement)
- Formations (titre, vidéo, quiz)
- Missions (titre, domaine, durée, rémunération)
- Matchings (mission_id, talent_id, score)
- Contrats (montant, durée, statut, commission)
- Paiements (total, net, commission)
- Investissements (ISA, rendement cible)

---

### Fonctionnalités techniques importantes :
- Gestion des rôles : Talent, Entreprise, Investisseur, Admin
- Authentification sécurisée (JWT)
- API REST/GraphQL
- Dashboard Admin (gestion utilisateurs, stats, contenu)
- Système de fichiers (Cloudinary)
- Stripe ou PayDunya pour les paiements
- Signatures numériques de contrat (DocuSign ou intégration native)

---

### Sécurité :
- RGPD compliant
- Données chiffrées au repos (AES-256) et en transit (HTTPS)
- Audit logs + accès admin sécurisé

---

Génère la structure complète du projet avec les dossiers front (Next.js), back (Node/Express), fichiers `.env.example`, routes API, et base PostgreSQL. Utilise Prisma si possible. Commence par les modèles, les routes principales, les composants front et une première version du dashboard.