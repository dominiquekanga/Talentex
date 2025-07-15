#!/bin/bash

echo "🧪 Test du Frontend TalentEx"
echo "============================"

# Test de la page d'accueil
echo "🏠 Test de la page d'accueil..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
if [ $? -eq 0 ]; then
    echo " ✅ Page d'accueil accessible"
else
    echo " ❌ Erreur page d'accueil"
fi

# Test de la page de connexion
echo "🔐 Test de la page de connexion..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/login
if [ $? -eq 0 ]; then
    echo " ✅ Page de connexion accessible"
else
    echo " ❌ Erreur page de connexion"
fi

# Test de la page d'inscription
echo "📝 Test de la page d'inscription..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/register
if [ $? -eq 0 ]; then
    echo " ✅ Page d'inscription accessible"
else
    echo " ❌ Erreur page d'inscription"
fi

# Test de l'API backend
echo "🔧 Test de l'API backend..."
curl -s http://localhost:5001/health | grep -q "success"
if [ $? -eq 0 ]; then
    echo " ✅ API backend opérationnelle"
else
    echo " ❌ Erreur API backend"
fi

echo ""
echo "🌐 Accès aux services :"
echo "   Frontend: http://localhost:3000"
echo "   Connexion: http://localhost:3000/auth/login"
echo "   Inscription: http://localhost:3000/auth/register"
echo "   Backend: http://localhost:5001"
echo "   API Docs: http://localhost:5001/api-docs"
echo ""
echo "✅ Tests terminés !" 