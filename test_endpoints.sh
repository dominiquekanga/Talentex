#!/bin/bash

echo "🧪 Test des endpoints TalentEx"
echo "================================"

# Test du health check
echo "1. Test du health check..."
response=$(curl -s -w "%{http_code}" http://localhost:5050/health)
http_code="${response: -3}"
body="${response%???}"

if [ "$http_code" = "200" ]; then
    echo "✅ Health check OK"
    echo "   Réponse: $body"
else
    echo "❌ Health check échoué (HTTP $http_code)"
fi

echo ""

# Test de l'authentification
echo "2. Test de l'authentification..."
login_response=$(curl -s -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@talenteex.com",
    "password": "admin123"
  }')

if echo "$login_response" | grep -q "success.*true"; then
    echo "✅ Authentification OK"
    token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   Token obtenu: ${token:0:20}..."
else
    echo "❌ Authentification échouée"
    echo "   Réponse: $login_response"
fi

echo ""

# Test de récupération des talents
echo "3. Test de récupération des talents..."
if [ ! -z "$token" ]; then
    talents_response=$(curl -s -X GET http://localhost:5050/api/talents \
      -H "Authorization: Bearer $token")
    
    if echo "$talents_response" | grep -q "success.*true"; then
        echo "✅ Récupération des talents OK"
    else
        echo "❌ Récupération des talents échouée"
        echo "   Réponse: $talents_response"
    fi
else
    echo "⚠️  Impossible de tester les talents sans token"
fi

echo ""

# Test de récupération des entreprises
echo "4. Test de récupération des entreprises..."
if [ ! -z "$token" ]; then
    enterprises_response=$(curl -s -X GET http://localhost:5050/api/enterprises \
      -H "Authorization: Bearer $token")
    
    if echo "$enterprises_response" | grep -q "success.*true"; then
        echo "✅ Récupération des entreprises OK"
    else
        echo "❌ Récupération des entreprises échouée"
        echo "   Réponse: $enterprises_response"
    fi
else
    echo "⚠️  Impossible de tester les entreprises sans token"
fi

echo ""

# Test de récupération des missions
echo "5. Test de récupération des missions..."
if [ ! -z "$token" ]; then
    missions_response=$(curl -s -X GET http://localhost:5050/api/missions \
      -H "Authorization: Bearer $token")
    
    if echo "$missions_response" | grep -q "success.*true"; then
        echo "✅ Récupération des missions OK"
    else
        echo "❌ Récupération des missions échouée"
        echo "   Réponse: $missions_response"
    fi
else
    echo "⚠️  Impossible de tester les missions sans token"
fi

echo ""

# Test de récupération des formations
echo "6. Test de récupération des formations..."
if [ ! -z "$token" ]; then
    formations_response=$(curl -s -X GET http://localhost:5050/api/formations \
      -H "Authorization: Bearer $token")
    
    if echo "$formations_response" | grep -q "success.*true"; then
        echo "✅ Récupération des formations OK"
    else
        echo "❌ Récupération des formations échouée"
        echo "   Réponse: $formations_response"
    fi
else
    echo "⚠️  Impossible de tester les formations sans token"
fi

echo ""
echo "🎉 Tests terminés !" 