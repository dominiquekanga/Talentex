#!/bin/bash

# Script d'installation automatique pour TalentEx
# Usage: ./scripts/setup.sh

set -e

echo "🚀 Installation de TalentEx..."

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Vérifier si Node.js est installé
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js n'est pas installé. Veuillez installer Node.js 18+"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ requis. Version actuelle: $(node -v)"
        exit 1
    fi
    
    print_message "Node.js $(node -v) détecté"
}

# Vérifier si npm est installé
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm n'est pas installé"
        exit 1
    fi
    
    print_message "npm $(npm -v) détecté"
}

# Vérifier si Docker est installé (optionnel)
check_docker() {
    if command -v docker &> /dev/null; then
        # Vérifier si docker compose est disponible (nouvelle syntaxe)
        if docker compose version &> /dev/null; then
            print_message "Docker et Docker Compose détectés"
            DOCKER_AVAILABLE=true
        elif command -v docker-compose &> /dev/null; then
            print_message "Docker et Docker Compose détectés"
            DOCKER_AVAILABLE=true
        else
            print_warning "Docker détecté mais Docker Compose non trouvé. L'installation locale sera utilisée"
            DOCKER_AVAILABLE=false
        fi
    else
        print_warning "Docker non détecté. L'installation locale sera utilisée"
        DOCKER_AVAILABLE=false
    fi
}

# Installer les dépendances globales
install_global_deps() {
    print_step "Installation des dépendances globales..."
    
    # On utilise npx pour concurrently, pas besoin d'installation globale
    print_message "Utilisation de npx pour concurrently (pas d'installation globale nécessaire)"
}

# Installer les dépendances du projet
install_project_deps() {
    print_step "Installation des dépendances du projet..."
    
    # Installer les dépendances racine
    npm install
    
    # Installer les dépendances backend
    cd backend
    npm install
    cd ..
    
    # Installer les dépendances frontend
    cd frontend
    npm install
    cd ..
    
    print_message "Dépendances du projet installées"
}

# Configurer les variables d'environnement
setup_env() {
    print_step "Configuration des variables d'environnement..."
    
    # Backend
    if [ ! -f backend/.env ]; then
        cp backend/env.example backend/.env
        print_message "Fichier .env backend créé"
    else
        print_warning "Fichier .env backend existe déjà"
    fi
    
    # Frontend
    if [ ! -f frontend/.env.local ]; then
        cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=TalentEx
EOF
        print_message "Fichier .env.local frontend créé"
    else
        print_warning "Fichier .env.local frontend existe déjà"
    fi
}

# Configurer la base de données
setup_database() {
    print_step "Configuration de la base de données..."
    
    if [ "$DOCKER_AVAILABLE" = true ]; then
        print_message "Démarrage de PostgreSQL avec Docker..."
        # Utiliser la nouvelle syntaxe docker compose si disponible
        if docker compose version &> /dev/null; then
            docker compose up -d postgres
        else
            docker-compose up -d postgres
        fi
        
        # Attendre que PostgreSQL soit prêt
        print_message "Attente du démarrage de PostgreSQL..."
        sleep 10
        
        # Générer le client Prisma
        cd backend
        npx prisma generate
        
        # Appliquer les migrations
        npx prisma migrate dev --name init
        
        cd ..
    else
        print_warning "Docker non disponible. Veuillez configurer PostgreSQL manuellement"
        print_message "Puis exécutez: cd backend && npx prisma migrate dev"
    fi
}

# Créer les dossiers nécessaires
create_directories() {
    print_step "Création des dossiers nécessaires..."
    
    mkdir -p backend/uploads
    mkdir -p frontend/public/uploads
    mkdir -p logs
    
    print_message "Dossiers créés"
}

# Vérifier l'installation
verify_installation() {
    print_step "Vérification de l'installation..."
    
    # Vérifier les fichiers de configuration
    if [ -f backend/.env ] && [ -f frontend/.env.local ]; then
        print_message "✓ Fichiers de configuration OK"
    else
        print_error "✗ Fichiers de configuration manquants"
        exit 1
    fi
    
    # Vérifier les dépendances
    if [ -d "node_modules" ] && [ -d "backend/node_modules" ] && [ -d "frontend/node_modules" ]; then
        print_message "✓ Dépendances installées"
    else
        print_error "✗ Dépendances manquantes"
        exit 1
    fi
    
    print_message "Installation vérifiée avec succès"
}

# Afficher les instructions de démarrage
show_startup_instructions() {
    echo ""
    echo "🎉 Installation terminée avec succès !"
    echo ""
    echo "📋 Instructions de démarrage :"
    echo ""
    
    if [ "$DOCKER_AVAILABLE" = true ]; then
        echo "🐳 Avec Docker (recommandé) :"
        echo "  docker-compose up"
        echo ""
        echo "🔧 Sans Docker :"
        echo "  1. Démarrez PostgreSQL"
        echo "  2. npm run dev"
        echo ""
    else
        echo "🔧 Démarrage local :"
        echo "  1. Configurez PostgreSQL"
        echo "  2. npm run dev"
        echo ""
    fi
    
    echo "🌐 URLs d'accès :"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:5000"
    echo "  - Documentation API: http://localhost:5000/api-docs"
    echo "  - Prisma Studio: http://localhost:5555"
    echo ""
    echo "📚 Documentation :"
    echo "  - README.md pour plus d'informations"
    echo "  - .env.example pour la configuration"
    echo ""
}

# Fonction principale
main() {
    echo "🎯 TalentEx - Script d'installation automatique"
    echo "================================================"
    echo ""
    
    check_node
    check_npm
    check_docker
    install_global_deps
    install_project_deps
    setup_env
    create_directories
    setup_database
    verify_installation
    show_startup_instructions
}

# Exécuter le script principal
main "$@" 