#!/bin/bash

echo "🧪 Test des routes CRUD TalentEx"
echo "=================================="

# Variables
API_URL="http://localhost:5000/api"
TOKEN=""

echo ""
echo "1. Test de création d'un talent"
echo "-------------------------------"
TALENT_RESPONSE=$(curl -s -X POST "$API_URL/talents" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@talent.com",
    "password": "password123",
    "firstName": "Jean",
    "lastName": "Dupont",
    "bio": "Développeur full-stack expérimenté",
    "domain": ["Développement", "Web"],
    "skills": ["JavaScript", "React", "Node.js"],
    "experience": 5,
    "hourlyRate": 75
  }')

echo "Réponse: $TALENT_RESPONSE"

echo ""
echo "2. Test de création d'une entreprise"
echo "------------------------------------"
ENTERPRISE_RESPONSE=$(curl -s -X POST "$API_URL/enterprises" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contact@entreprise.com",
    "password": "password123",
    "name": "TechCorp",
    "description": "Entreprise spécialisée dans le développement web",
    "industry": "Technologie",
    "size": "50-100",
    "website": "https://techcorp.com"
  }')

echo "Réponse: $ENTERPRISE_RESPONSE"

echo ""
echo "3. Test de connexion pour obtenir un token"
echo "------------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@talenteex.com",
    "password": "admin123"
  }')

echo "Réponse: $LOGIN_RESPONSE"

# Extraire le token de la réponse
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "Token obtenu: ${TOKEN:0:20}..."
  
  echo ""
  echo "4. Test de récupération des talents (avec token)"
  echo "------------------------------------------------"
  TALENTS_RESPONSE=$(curl -s -X GET "$API_URL/talents" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  echo "Réponse: $TALENTS_RESPONSE"
  
  echo ""
  echo "5. Test de récupération des entreprises (avec token)"
  echo "----------------------------------------------------"
  ENTERPRISES_RESPONSE=$(curl -s -X GET "$API_URL/enterprises" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json")
  
  echo "Réponse: $ENTERPRISES_RESPONSE"
  
  echo ""
  echo "6. Test de récupération des formations (publique)"
  echo "-------------------------------------------------"
  FORMATIONS_RESPONSE=$(curl -s -X GET "$API_URL/formations" \
    -H "Content-Type: application/json")
  
  echo "Réponse: $FORMATIONS_RESPONSE"
  
else
  echo "❌ Impossible d'obtenir le token"
fi

echo ""
echo "✅ Tests terminés" 