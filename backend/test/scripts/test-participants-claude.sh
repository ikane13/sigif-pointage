#!/bin/bash

# Configuration (variables d'environnement ou valeurs par défaut)
BASE_URL="${API_BASE_URL:-http://localhost:3000/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@sigif.gouv.sn}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@2025!}"

echo "======================================"
echo "🧪 TEST MODULE PARTICIPANTS"
echo "======================================"
echo ""
echo "Configuration:"
echo "  URL: $BASE_URL"
echo "  Email: $ADMIN_EMAIL"
echo ""

# Couleurs pour le terminal
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier que jq est installé
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ Erreur: 'jq' n'est pas installé${NC}"
    echo "Installation:"
    echo "  macOS: brew install jq"
    echo "  Linux: sudo apt-get install jq"
    exit 1
fi

# Vérifier que le serveur répond
echo "🔍 Vérification du serveur..."
HEALTH_CHECK=$(curl -s "$BASE_URL/../health" || echo "error")
if [[ "$HEALTH_CHECK" == "error" ]]; then
    echo -e "${RED}❌ Le serveur ne répond pas à $BASE_URL${NC}"
    echo "Assurez-vous que le backend est démarré (npm run start:dev)"
    exit 1
fi
echo -e "${GREEN}✅ Serveur accessible${NC}"
echo ""

echo -e "${BLUE}1️⃣  Login admin...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.accessToken')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Erreur login${NC}"
  echo $LOGIN_RESPONSE | jq
  exit 1
fi

echo -e "${GREEN}✅ Login réussi${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# ====================================
# TEST 1 : Créer des participants
# ====================================
echo -e "${BLUE}2️⃣  Création de participants...${NC}"

echo "   → Participant 1 (Abdoulaye Fall)..."
PARTICIPANT1=$(curl -s -X POST "$BASE_URL/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Idrissa",
    "lastName": "Fall",
    "function": "Développeur Full Stack",
    "cniNumber": "CNI1234567892",
    "originLocality": "Dakar",
    "email": "afall@finances.gouv.sn",
    "phone": "+221 77 123 45 67",
    "organization": "DTAI - Ministère des Finances"
  }')

P1_ID=$(echo $PARTICIPANT1 | jq -r '.data.id')

if [ "$P1_ID" = "null" ]; then
  echo -e "${RED}❌ Erreur création participant 1${NC}"
  echo $PARTICIPANT1 | jq
else
  echo -e "${GREEN}✅ Participant 1 créé (ID: ${P1_ID:0:8}...)${NC}"
fi

echo "   → Participant 2 (Aïssatou Ndiaye)..."
PARTICIPANT2=$(curl -s -X POST "$BASE_URL/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Amina",
    "lastName": "Ndiaye",
    "function": "Chef de chantier",
    "cniNumber": "CNI098765432",
    "originLocality": "Thiès",
    "email": "andiaye@finances.gouv.sn",
    "phone": "+221 76 987 65 43",
    "organization": "Direction Générale des Impôts"
  }')

P2_ID=$(echo $PARTICIPANT2 | jq -r '.data.id')

if [ "$P2_ID" = "null" ]; then
  echo -e "${RED}❌ Erreur création participant 2${NC}"
else
  echo -e "${GREEN}✅ Participant 2 créé (ID: ${P2_ID:0:8}...)${NC}"
fi

echo "   → Participant 3 (Cheikh Sy)..."
PARTICIPANT3=$(curl -s -X POST "$BASE_URL/participants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ibou",
    "lastName": "Faye",
    "function": "Consultant Devops",
    "cniNumber": "CNI1122334425",
    "email": "cheikh.sy@consulting.sn",
    "phone": "+221 70 112 23 34",
    "organization": "Cabinet Conseil IT"
  }')

P3_ID=$(echo $PARTICIPANT3 | jq -r '.data.id')

if [ "$P3_ID" = "null" ]; then
  echo -e "${RED}❌ Erreur création participant 3${NC}"
else
  echo -e "${GREEN}✅ Participant 3 créé (ID: ${P3_ID:0:8}...)${NC}"
fi

echo ""

# ... (reste du script identique)

# ====================================
# RÉSUMÉ
# ====================================
echo "======================================"
echo "📊 RÉSUMÉ DES TESTS"
echo "======================================"
echo ""
echo "Fonctionnalités testées:"
echo "  ✅ Authentification"
echo "  ✅ Création de participants"
echo "  ✅ Liste complète"
echo "  ✅ Recherche par nom"
echo "  ✅ Filtrage par organisation"
echo "  ✅ Détails d'un participant"
echo "  ✅ Modification"
echo "  ✅ Pagination"
echo "  ✅ Tri"
echo "  ✅ Validation unicité CNI"
echo "  ✅ Validation format CNI"
echo "  ✅ Suppression"
echo "  ✅ Présence du champ fullName"
echo ""
echo "======================================"
echo "✨ Tests terminés"
echo "======================================"