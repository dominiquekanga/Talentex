#!/bin/bash

echo "🧪 Test des endpoints avancés TalentEx - Module Talents"
echo "======================================================"

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

# 1. Test de création d'un talent
echo "1. Test de création d'un talent..."
test_endpoint "POST" "/api/talents" "" '{
    "email": "test.talent@example.com",
    "password": "password123",
    "firstName": "Jean",
    "lastName": "Dupont",
    "bio": "Expert en développement web avec 5 ans d'expérience",
    "domain": ["DEVELOPPEMENT", "WEB"],
    "skills": ["React", "Node.js", "TypeScript"],
    "experience": 5,
    "hourlyRate": 75
}' "Création d'un nouveau talent"

# 2. Test de connexion du talent
echo "2. Test de connexion du talent..."
TALENT_TOKEN=$(get_auth_token "test.talent@example.com" "password123")
if [ "$TALENT_TOKEN" != "null" ] && [ -n "$TALENT_TOKEN" ]; then
    echo "✅ Connexion talent réussie"
else
    echo "❌ Échec de connexion talent"
    exit 1
fi

# 3. Test des statistiques du talent
echo "3. Test des statistiques du talent..."
test_endpoint "GET" "/api/talents/profile/stats" "$TALENT_TOKEN" "" "Récupération des statistiques du talent"

# 4. Test des missions recommandées
echo "4. Test des missions recommandées..."
test_endpoint "GET" "/api/talents/profile/recommendations" "$TALENT_TOKEN" "" "Récupération des missions recommandées"

# 5. Test de l'historique des missions
echo "5. Test de l'historique des missions..."
test_endpoint "GET" "/api/talents/profile/history" "$TALENT_TOKEN" "" "Récupération de l'historique des missions"

# 6. Test d'upload de CV (simulé)
echo "6. Test d'upload de CV..."
test_endpoint "POST" "/api/talents/profile/upload-cv" "$TALENT_TOKEN" '{}' "Upload de CV"

# 7. Test d'upload de vidéo (simulé)
echo "7. Test d'upload de vidéo..."
test_endpoint "POST" "/api/talents/profile/upload-video" "$TALENT_TOKEN" '{}' "Upload de vidéo"

# 8. Test du profil du talent
echo "8. Test du profil du talent..."
test_endpoint "GET" "/api/talents/profile" "$TALENT_TOKEN" "" "Récupération du profil talent"

# 9. Test de mise à jour du profil
echo "9. Test de mise à jour du profil..."
test_endpoint "PUT" "/api/talents/profile" "$TALENT_TOKEN" '{
    "bio": "Expert en développement web avec 5 ans d'expérience - Mise à jour",
    "skills": ["React", "Node.js", "TypeScript", "Python"],
    "hourlyRate": 80
}' "Mise à jour du profil talent"

# 10. Test des top talents par domaine
echo "10. Test des top talents par domaine..."
test_endpoint "GET" "/api/talents/top/DEVELOPPEMENT" "" "" "Top talents en développement"

# 11. Test de la liste des talents avec filtres avancés
echo "11. Test de la liste des talents avec filtres avancés..."
test_endpoint "GET" "/api/talents?domain=DEVELOPPEMENT&minExperience=3&maxHourlyRate=100&sortBy=score&sortOrder=desc" "" "" "Liste des talents avec filtres avancés"

# 12. Test de connexion admin
echo "12. Test de connexion admin..."
ADMIN_TOKEN=$(get_auth_token "$ADMIN_EMAIL" "$ADMIN_PASSWORD")
if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
    echo "✅ Connexion admin réussie"
else
    echo "❌ Échec de connexion admin"
    exit 1
fi

# 13. Test de récupération d'un talent par ID (admin)
echo "13. Test de récupération d'un talent par ID..."
# D'abord, récupérer la liste pour avoir un ID
talents_response=$(curl -s -X GET "${API_BASE}/api/talents" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}")
talent_id=$(echo $talents_response | jq -r '.data.talents[0].id')

if [ "$talent_id" != "null" ] && [ -n "$talent_id" ]; then
    test_endpoint "GET" "/api/talents/${talent_id}" "$ADMIN_TOKEN" "" "Récupération d'un talent par ID"
else
    echo "❌ Impossible de récupérer un ID de talent"
fi

echo ""
echo "🎉 Tests des endpoints avancés terminés !"
echo "==========================================" 