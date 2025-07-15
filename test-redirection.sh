#!/bin/bash

echo "🔄 Test de redirection après authentification"
echo "=============================================="

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}1. Test de l'API d'authentification...${NC}"

# Test de connexion
response=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@talenteex.com","password":"admin123"}' \
  http://localhost:3000/api/auth/login)

echo "Réponse de l'API: $response"

# Vérifier si la connexion a réussi
if echo "$response" | grep -q "success.*true"; then
    echo -e "${GREEN}✅ Authentification réussie${NC}"
    
    # Extraire le token
    token=$(echo "$response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$token" ]; then
        echo -e "${GREEN}✅ Token JWT récupéré${NC}"
        
        echo -e "\n${YELLOW}2. Test d'accès au dashboard avec le token...${NC}"
        
        # Test d'accès au dashboard
        dashboard_response=$(curl -s -H "Authorization: Bearer $token" \
          http://localhost:3000/dashboard)
        
        if echo "$dashboard_response" | grep -q "TalentEx"; then
            echo -e "${GREEN}✅ Accès au dashboard réussi${NC}"
        else
            echo -e "${RED}❌ Problème d'accès au dashboard${NC}"
        fi
    else
        echo -e "${RED}❌ Token non trouvé dans la réponse${NC}"
    fi
else
    echo -e "${RED}❌ Échec de l'authentification${NC}"
fi

echo -e "\n${YELLOW}3. Instructions pour tester manuellement :${NC}"
echo -e "${GREEN}1. Ouvrez http://localhost:3000/auth/login${NC}"
echo -e "${GREEN}2. Connectez-vous avec admin@talenteex.com / admin123${NC}"
echo -e "${GREEN}3. Vous devriez être automatiquement redirigé vers /dashboard${NC}"
echo -e "${GREEN}4. Vérifiez que vous pouvez naviguer dans le dashboard${NC}"

echo -e "\n${YELLOW}4. Vérification des logs du frontend...${NC}"
docker logs talenteex-frontend --tail 5

echo -e "\n🎉 Test terminé !" 