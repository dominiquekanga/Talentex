#!/bin/bash

echo "🔐 Test d'authentification TalentEx"
echo "=================================="

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}1. Test de connexion avec l'utilisateur admin...${NC}"

# Test de connexion
response=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@talenteex.com","password":"admin123"}' \
  http://localhost:3000/api/auth/login)

echo "Réponse de l'API: $response"

# Vérifier si la connexion a réussi
if echo "$response" | grep -q "success.*true"; then
    echo -e "${GREEN}✅ Connexion réussie${NC}"
    
    # Extraire le token
    token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$token" ]; then
        echo -e "${GREEN}✅ Token JWT récupéré${NC}"
        
        echo -e "\n${YELLOW}2. Test d'accès au dashboard...${NC}"
        
        # Test d'accès au dashboard avec le token
        dashboard_response=$(curl -s -H "Authorization: Bearer $token" \
          http://localhost:3000/api/dashboard/stats)
        
        echo "Réponse du dashboard: $dashboard_response"
        
        if echo "$dashboard_response" | grep -q "success\|data"; then
            echo -e "${GREEN}✅ Accès au dashboard réussi${NC}"
        else
            echo -e "${RED}❌ Erreur d'accès au dashboard${NC}"
        fi
    else
        echo -e "${RED}❌ Token JWT non trouvé dans la réponse${NC}"
    fi
else
    echo -e "${RED}❌ Échec de la connexion${NC}"
    echo "Détails de l'erreur: $response"
fi

echo -e "\n${YELLOW}3. Test avec un utilisateur inexistant...${NC}"

# Test avec un utilisateur inexistant
error_response=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"nonexistent@test.com","password":"wrongpassword"}' \
  http://localhost:3000/api/auth/login)

echo "Réponse d'erreur: $error_response"

if echo "$error_response" | grep -q "success.*false"; then
    echo -e "${GREEN}✅ Gestion d'erreur correcte${NC}"
else
    echo -e "${RED}❌ Problème dans la gestion d'erreur${NC}"
fi

echo -e "\n${YELLOW}4. Vérification des endpoints disponibles...${NC}"

# Test des endpoints principaux
endpoints=(
    "/api/auth/login"
    "/api/auth/register"
    "/api/dashboard/stats"
    "/api/talents"
    "/api/missions"
    "/api/academy/formations"
)

for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$endpoint")
    if [ "$response" = "200" ] || [ "$response" = "401" ] || [ "$response" = "404" ]; then
        echo -e "${GREEN}✅ $endpoint (HTTP $response)${NC}"
    else
        echo -e "${RED}❌ $endpoint (HTTP $response)${NC}"
    fi
done

echo -e "\n${GREEN}🎉 Test d'authentification terminé !${NC}"
echo -e "\n${YELLOW}Pour tester manuellement :${NC}"
echo "1. Ouvrez http://localhost:3000/auth/login"
echo "2. Connectez-vous avec admin@talenteex.com / admin123"
echo "3. Vous devriez être redirigé vers le dashboard"
echo "4. Vérifiez que les icônes s'affichent correctement" 