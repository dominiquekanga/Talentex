#!/bin/bash

echo "🧪 Test de l'API TalentEx"
echo "=========================="

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 10

# Test de santé du backend
echo "🏥 Test de santé du backend..."
curl -s http://localhost:5001/health | jq '.'

# Test de la documentation Swagger
echo "📚 Test de la documentation Swagger..."
curl -s http://localhost:5001/api-docs | head -20

# Test de l'endpoint des talents (sans authentification)
echo "👥 Test de l'endpoint des talents..."
curl -s http://localhost:5001/api/talents | jq '.'

# Test de l'endpoint des missions
echo "🎯 Test de l'endpoint des missions..."
curl -s http://localhost:5001/api/missions | jq '.'

# Test de l'endpoint de l'académie
echo "🎓 Test de l'endpoint de l'académie..."
curl -s http://localhost:5001/api/academy/formations | jq '.'

echo "✅ Tests terminés !"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5001"
echo "📚 API Docs: http://localhost:5001/api-docs" 