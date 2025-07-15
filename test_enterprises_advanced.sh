#!/bin/bash

echo "🏢 Test des endpoints avancés TalentEx - Module Entreprises"
echo "=========================================================="

# Variables
API_BASE="http://localhost:5050"
ADMIN_EMAIL="admin@talenteex.com"
ADMIN_PASSWORD="admin123"

# Fonction pour obtenir le token d'authentification
get_auth_token() {
    local email=$1
    local password=$2
    
    response=$(curl -s -X POST ${API_BASE}/api/auth/login \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"${email}\",
            \"password\": \"${password}\"
        }")
    
    echo $response | jq -r '.data.token'
}

# Fonction pour tester un endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local token=$3
    local data=$4
    local description=$5
    
    echo "Testing: $description"
    
    if [ "$method" = "GET" ]; then
        if [ -n "$token" ]; then
            response=$(curl -s -w "%{http_code}" -X GET "${API_BASE}${endpoint}" \
                -H "Authorization: Bearer ${token}")
        else
            response=$(curl -s -w "%{http_code}" -X GET "${API_BASE}${endpoint}")
        fi
    elif [ "$method" = "POST" ]; then
        if [ -n "$token" ]; then
            response=$(curl -s -w "%{http_code}" -X POST "${API_BASE}${endpoint}" \
                -H "Authorization: Bearer ${token}" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "%{http_code}" -X POST "${API_BASE}${endpoint}" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    elif [ "$method" = "PUT" ]; then
        if [ -n "$token" ]; then
            response=$(curl -s -w "%{http_code}" -X PUT "${API_BASE}${endpoint}" \
                -H "Authorization: Bearer ${token}" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "%{http_code}" -X PUT "${API_BASE}${endpoint}" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    fi
    
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "✅ Succès (HTTP $http_code)"
        echo "   Réponse: $(echo $body | jq -c '.')"
    else
        echo "❌ Échec (HTTP $http_code)"
        echo "   Réponse: $(echo $body | jq -c '.')"
    fi
    echo ""
}

# 1. Test de création d'une entreprise
echo "1. Test de création d'une entreprise..."
test_endpoint "POST" "/api/enterprises" "" '{
    "email": "test.enterprise@example.com",
    "password": "password123",
    "name": "TechCorp Solutions",
    "description": "Entreprise spécialisée dans le développement de solutions innovantes",
    "industry": "TECHNOLOGY",
    "size": "MEDIUM",
    "website": "https://techcorp.com"
}' "Création d'une nouvelle entreprise"

# 2. Test de connexion de l'entreprise
echo "2. Test de connexion de l'entreprise..."
ENTERPRISE_TOKEN=$(get_auth_token "test.enterprise@example.com" "password123")
if [ "$ENTERPRISE_TOKEN" != "null" ] && [ -n "$ENTERPRISE_TOKEN" ]; then
    echo "✅ Connexion entreprise réussie"
else
    echo "❌ Échec de connexion entreprise"
    exit 1
fi

# 3. Test des statistiques de l'entreprise
echo "3. Test des statistiques de l'entreprise..."
test_endpoint "GET" "/api/enterprises/profile/stats" "$ENTERPRISE_TOKEN" "" "Récupération des statistiques de l'entreprise"

# 4. Test des talents recommandés
echo "4. Test des talents recommandés..."
test_endpoint "GET" "/api/enterprises/profile/recommendations" "$ENTERPRISE_TOKEN" "" "Récupération des talents recommandés"

# 5. Test de l'historique des missions
echo "5. Test de l'historique des missions..."
test_endpoint "GET" "/api/enterprises/profile/history" "$ENTERPRISE_TOKEN" "" "Récupération de l'historique des missions"

# 6. Test d'upload de logo (simulé)
echo "6. Test d'upload de logo..."
test_endpoint "POST" "/api/enterprises/profile/upload-logo" "$ENTERPRISE_TOKEN" '{}' "Upload de logo"

# 7. Test de création d'abonnement
echo "7. Test de création d'abonnement..."
test_endpoint "POST" "/api/enterprises/profile/subscription" "$ENTERPRISE_TOKEN" '{
    "plan": "pro",
    "stripeId": "sub_test123"
}' "Création d'un abonnement"

# 8. Test du profil de l'entreprise
echo "8. Test du profil de l'entreprise..."
test_endpoint "GET" "/api/enterprises/profile" "$ENTERPRISE_TOKEN" "" "Récupération du profil entreprise"

# 9. Test de mise à jour du profil
echo "9. Test de mise à jour du profil..."
test_endpoint "PUT" "/api/enterprises/profile" "$ENTERPRISE_TOKEN" '{
    "description": "Entreprise spécialisée dans le développement de solutions innovantes - Mise à jour",
    "size": "LARGE",
    "preferences": {
        "remoteWork": true,
        "contractTypes": ["FREELANCE", "CONTRACT"],
        "budgetRange": { "min": 2000, "max": 100000 },
        "projectDuration": { "min": 2, "max": 24 }
    }
}' "Mise à jour du profil entreprise"

# 10. Test des top entreprises par industrie
echo "10. Test des top entreprises par industrie..."
test_endpoint "GET" "/api/enterprises/top/TECHNOLOGY" "" "" "Top entreprises en technologie"

# 11. Test de la liste des entreprises avec filtres avancés
echo "11. Test de la liste des entreprises avec filtres avancés..."
test_endpoint "GET" "/api/enterprises?industry=TECHNOLOGY&hasSubscription=true&sortBy=createdAt&sortOrder=desc" "" "" "Liste des entreprises avec filtres avancés"

# 12. Test de connexion admin
echo "12. Test de connexion admin..."
ADMIN_TOKEN=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
    echo "✅ Connexion admin réussie"
else
    echo "❌ Échec de connexion admin"
    exit 1
fi

# 13. Test de récupération d'une entreprise par ID (admin)
echo "13. Test de récupération d'une entreprise par ID..."
# D'abord, récupérer la liste pour avoir un ID
enterprises_response=$(curl -s -X GET "${API_BASE}/api/enterprises" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}")
enterprise_id=$(echo $enterprises_response | jq -r '.data.enterprises[0].id')

if [ "$enterprise_id" != "null" ] && [ -n "$enterprise_id" ]; then
    test_endpoint "GET" "/api/enterprises/${enterprise_id}" "$ADMIN_TOKEN" "" "Récupération d'une entreprise par ID"
else
    echo "❌ Impossible de récupérer un ID d'entreprise"
fi

# 14. Test de vérification d'entreprise (admin)
echo "14. Test de vérification d'entreprise..."
if [ "$enterprise_id" != "null" ] && [ -n "$enterprise_id" ]; then
    test_endpoint "POST" "/api/enterprises/${enterprise_id}/verify" "$ADMIN_TOKEN" '{
        "isVerified": true
    }' "Vérification d'une entreprise"
else
    echo "❌ Impossible de vérifier une entreprise"
fi

echo ""
echo "🎉 Tests des endpoints avancés terminés !"
echo "==========================================" 