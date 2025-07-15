#!/bin/bash

echo "🧪 Test complet de l'application TalentEx"
echo "========================================"

# Couleurs pour les messages
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

echo -e "\n${YELLOW}1. Vérification des services Docker...${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep talenteex

echo -e "\n${YELLOW}2. Test de l'API backend...${NC}"

# Test health check
echo "   - Health check..."
curl -s http://localhost:5001/health > /dev/null
print_result $? "Health check backend"

# Test API docs
echo "   - Documentation Swagger..."
curl -s http://localhost:5001/api-docs > /dev/null
print_result $? "Documentation Swagger"

# Test endpoint auth
echo "   - Endpoint d'authentification..."
response=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test123"}' http://localhost:5001/api/auth/login)
if echo "$response" | grep -q "success"; then
    print_result 0 "Endpoint d'authentification"
else
    print_result 1 "Endpoint d'authentification"
fi

echo -e "\n${YELLOW}3. Test du frontend...${NC}"

# Test page d'accueil
echo "   - Page d'accueil..."
curl -s http://localhost:3000 > /dev/null
print_result $? "Page d'accueil"

# Test page de connexion
echo "   - Page de connexion..."
curl -s http://localhost:3000/auth/login > /dev/null
print_result $? "Page de connexion"

# Test page d'inscription
echo "   - Page d'inscription..."
curl -s http://localhost:3000/auth/register > /dev/null
print_result $? "Page d'inscription"

# Test manifest.json
echo "   - Manifest.json..."
curl -s http://localhost:3000/manifest.json > /dev/null
print_result $? "Manifest.json"

echo -e "\n${YELLOW}4. Test de l'API via le frontend...${NC}"

# Test API via les rewrites Next.js
echo "   - API via frontend..."
response=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"test123"}' http://localhost:3000/api/auth/login)
if echo "$response" | grep -q "success\|error"; then
    print_result 0 "API via frontend"
else
    print_result 1 "API via frontend"
fi

echo -e "\n${YELLOW}5. Vérification des logs...${NC}"

# Vérification des logs backend
echo "   - Logs backend (dernières 5 lignes)..."
docker logs talenteex-backend --tail 5 2>/dev/null | grep -E "(error|Error|ERROR)" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${RED}⚠️  Erreurs détectées dans les logs backend${NC}"
else
    echo -e "${GREEN}✅ Aucune erreur dans les logs backend${NC}"
fi

# Vérification des logs frontend
echo "   - Logs frontend (dernières 5 lignes)..."
docker logs talenteex-frontend --tail 5 2>/dev/null | grep -E "(error|Error|ERROR)" > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${RED}⚠️  Erreurs détectées dans les logs frontend${NC}"
else
    echo -e "${GREEN}✅ Aucune erreur dans les logs frontend${NC}"
fi

echo -e "\n${YELLOW}6. Test de la base de données...${NC}"

# Test connexion base de données
echo "   - Connexion PostgreSQL..."
docker exec talenteex-postgres pg_isready -U postgres > /dev/null 2>&1
print_result $? "Connexion PostgreSQL"

# Test Redis
echo "   - Connexion Redis..."
docker exec talenteex-redis redis-cli ping > /dev/null 2>&1
print_result $? "Connexion Redis"

echo -e "\n${YELLOW}7. Résumé des ports...${NC}"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend:  http://localhost:5001"
echo "   - API Docs: http://localhost:5001/api-docs"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"

echo -e "\n${GREEN}🎉 Test complet terminé !${NC}"
echo -e "\n${YELLOW}Pour tester l'application :${NC}"
echo "1. Ouvrez http://localhost:3000 dans votre navigateur"
echo "2. Créez un compte ou connectez-vous"
echo "3. Explorez les différentes fonctionnalités"

echo -e "\n${YELLOW}Comptes de test disponibles :${NC}"
echo "- Admin: admin@talenteex.com / admin123"
echo "- Talent: talent@test.com / test123"
echo "- Entreprise: entreprise@test.com / test123" 