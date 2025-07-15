#!/bin/bash

echo "🔧 Correction des URLs API dans le frontend..."

# Fonction pour ajouter l'import API_ENDPOINTS si nécessaire
add_api_import() {
    local file=$1
    if ! grep -q "import.*API_ENDPOINTS" "$file"; then
        # Trouver la ligne après les imports existants
        local import_line=$(grep -n "import.*from" "$file" | tail -1 | cut -d: -f1)
        if [ -n "$import_line" ]; then
            # Calculer le chemin relatif vers config/api
            local dir_depth=$(echo "$file" | sed 's/[^/]//g' | wc -c)
            local api_path=""
            for ((i=1; i<dir_depth-1; i++)); do
                api_path="../$api_path"
            done
            api_path="${api_path}config/api"
            
            # Ajouter l'import
            sed -i "${import_line}a\\
import { API_ENDPOINTS } from '${api_path}';" "$file"
        fi
    fi
}

# Fonction pour remplacer les URLs hardcodées
replace_urls() {
    local file=$1
    echo "  📝 Correction de $file"
    
    # Ajouter l'import si nécessaire
    add_api_import "$file"
    
    # Remplacer les URLs hardcodées par les endpoints configurés
    sed -i 's|http://localhost:5001/api/auth/login|${API_ENDPOINTS.LOGIN}|g' "$file"
    sed -i 's|http://localhost:5001/api/auth/register|${API_ENDPOINTS.REGISTER}|g' "$file"
    sed -i 's|http://localhost:5001/api/auth/profile|${API_ENDPOINTS.PROFILE}|g' "$file"
    sed -i 's|http://localhost:5001/api/talents|${API_ENDPOINTS.TALENTS}|g' "$file"
    sed -i 's|http://localhost:5001/api/talents/profile|${API_ENDPOINTS.TALENT_PROFILE}|g' "$file"
    sed -i 's|http://localhost:5001/api/missions|${API_ENDPOINTS.MISSIONS}|g' "$file"
    sed -i 's|http://localhost:5001/api/academy/formations|${API_ENDPOINTS.ACADEMY_FORMATIONS}|g' "$file"
    sed -i 's|http://localhost:5001/api/academy/courses|${API_ENDPOINTS.ACADEMY_COURSES}|g' "$file"
    sed -i 's|http://localhost:5001/api/academy/progress|${API_ENDPOINTS.ACADEMY_PROGRESS}|g' "$file"
    sed -i 's|http://localhost:5001/api/matching|${API_ENDPOINTS.MATCHING}|g' "$file"
    sed -i 's|http://localhost:5001/api/matching/talents|${API_ENDPOINTS.MATCHING_TALENTS}|g' "$file"
    sed -i 's|http://localhost:5001/api/matching/missions|${API_ENDPOINTS.MATCHING_MISSIONS}|g' "$file"
    sed -i 's|http://localhost:5001/api/matching/accept|${API_ENDPOINTS.MATCHING_ACCEPT}|g' "$file"
    sed -i 's|http://localhost:5001/api/matching/reject|${API_ENDPOINTS.MATCHING_REJECT}|g' "$file"
    sed -i 's|http://localhost:5001/api/contracts|${API_ENDPOINTS.CONTRACTS}|g' "$file"
    sed -i 's|http://localhost:5001/api/payments/user|${API_ENDPOINTS.PAYMENTS_USER}|g' "$file"
    sed -i 's|http://localhost:5001/api/payments/initiate|${API_ENDPOINTS.PAYMENTS_INITIATE}|g' "$file"
    sed -i 's|http://localhost:5001/api/payments/retry|${API_ENDPOINTS.PAYMENTS_RETRY}|g' "$file"
    sed -i 's|http://localhost:5001/api/finance/stats|${API_ENDPOINTS.FINANCE_STATS}|g' "$file"
    sed -i 's|http://localhost:5001/api/finance/payments|${API_ENDPOINTS.FINANCE_PAYMENTS}|g' "$file"
    sed -i 's|http://localhost:5001/api/finance/monthly|${API_ENDPOINTS.FINANCE_MONTHLY}|g' "$file"
    sed -i 's|http://localhost:5001/api/admin/stats|${API_ENDPOINTS.ADMIN_STATS}|g' "$file"
    sed -i 's|http://localhost:5001/api/admin/activity|${API_ENDPOINTS.ADMIN_ACTIVITY}|g' "$file"
    sed -i 's|http://localhost:5001/api/dashboard/stats|${API_ENDPOINTS.DASHBOARD_STATS}|g' "$file"
    sed -i 's|http://localhost:5001/api/dashboard/activities|${API_ENDPOINTS.DASHBOARD_ACTIVITIES}|g' "$file"
    sed -i 's|http://localhost:5001/api/signatures|${API_ENDPOINTS.SIGNATURES_STATUS}|g' "$file"
}

# Trouver tous les fichiers TypeScript/React qui contiennent des URLs hardcodées
files=$(find frontend/src -name "*.tsx" -o -name "*.ts" | xargs grep -l "localhost:5001" 2>/dev/null)

if [ -n "$files" ]; then
    echo "📁 Fichiers à corriger :"
    echo "$files" | while read -r file; do
        replace_urls "$file"
    done
    echo "✅ Correction terminée !"
else
    echo "✅ Aucun fichier à corriger trouvé."
fi 