#!/bin/bash

# Configuration
BASE_URL="${API_BASE_URL:-http://localhost:3000/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@sigif.gouv.sn}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@2025!}"

echo "======================================"
echo "🧪 TEST MODULE ATTENDANCES (RIGOUREUX)"
echo "======================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0

# Fonction pour vérifier un test
check_test() {
  local test_name="$1"
  local condition="$2"
  
  if [ "$condition" = "true" ]; then
    echo -e "${GREEN}✅ $test_name${NC}"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ $test_name${NC}"
    ((TESTS_FAILED++))
  fi
}

# Vérifier jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ 'jq' n'est pas installé${NC}"
    exit 1
fi

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
  exit 1
fi

echo -e "${GREEN}✅ Login réussi${NC}"
echo ""

echo -e "${BLUE}2️⃣  Création d'un événement de test...${NC}"
EVENT=$(curl -s -X POST "$BASE_URL/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Pointage Rigoureux - Atelier Signatures",
    "eventType": "workshop",
    "startDate": "2025-12-20T09:00:00Z",
    "location": "Salle Test Rigoureux"
  }')

EVENT_ID=$(echo $EVENT | jq -r '.data.id')

if [ "$EVENT_ID" = "null" ]; then
  echo -e "${RED}❌ Erreur création événement${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Événement créé (ID: ${EVENT_ID:0:8}...)${NC}"
echo ""

echo -e "${BLUE}3️⃣  Génération d'une signature de test...${NC}"
SIGNATURE="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
echo -e "${GREEN}✅ Signature générée${NC}"
echo ""

echo -e "${BLUE}4️⃣  TEST 1: Premier pointage avec signature...${NC}"

ATTENDANCE1=$(curl -s -X POST "$BASE_URL/attendances" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\": \"$EVENT_ID\",
    \"participant\": {
      \"firstName\": \"Mamadou\",
      \"lastName\": \"Diop\",
      \"function\": \"Développeur Backend\",
      \"cniNumber\": \"CNI5555666677\",
      \"email\": \"mdiop@test.sn\",
      \"phone\": \"+221 77 555 66 67\",
      \"organization\": \"DTAI Test\"
    },
    \"signature\": \"$SIGNATURE\",
    \"notes\": \"Premier test de pointage\"
  }")

ATT1_ID=$(echo $ATTENDANCE1 | jq -r '.data.id')
ATT1_SUCCESS=$(echo $ATTENDANCE1 | jq -r '.success')
ATT1_PARTICIPANT_ID=$(echo $ATTENDANCE1 | jq -r '.data.participantId')

check_test "Pointage 1 créé avec succès" "$ATT1_SUCCESS"
check_test "Pointage 1 a un ID valide" "$([ "$ATT1_ID" != "null" ] && echo true || echo false)"
check_test "Pointage 1 a un participantId" "$([ "$ATT1_PARTICIPANT_ID" != "null" ] && echo true || echo false)"

echo "   Participant ID: ${ATT1_PARTICIPANT_ID:0:8}..."
echo "   Attendance ID: ${ATT1_ID:0:8}..."
echo ""

echo -e "${BLUE}5️⃣  TEST 2: Deuxième pointage (participant différent)...${NC}"

ATTENDANCE2=$(curl -s -X POST "$BASE_URL/attendances" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\": \"$EVENT_ID\",
    \"participant\": {
      \"firstName\": \"Fatou\",
      \"lastName\": \"Sall\",
      \"function\": \"Chef de Projet\",
      \"cniNumber\": \"CNI8888999900\",
      \"email\": \"fsall@test.sn\",
      \"phone\": \"+221 76 888 99 90\",
      \"organization\": \"DGI Test\"
    },
    \"signature\": \"$SIGNATURE\"
  }")

ATT2_ID=$(echo $ATTENDANCE2 | jq -r '.data.id')
ATT2_SUCCESS=$(echo $ATTENDANCE2 | jq -r '.success')
ATT2_PARTICIPANT_ID=$(echo $ATTENDANCE2 | jq -r '.data.participantId')

check_test "Pointage 2 créé avec succès" "$ATT2_SUCCESS"
check_test "Pointage 2 a un participantId différent" "$([ "$ATT2_PARTICIPANT_ID" != "$ATT1_PARTICIPANT_ID" ] && echo true || echo false)"

echo "   Participant ID: ${ATT2_PARTICIPANT_ID:0:8}..."
echo ""

echo -e "${BLUE}6️⃣  TEST 3: Détection doublon (même CNI + email)...${NC}"

DUPLICATE=$(curl -s -X POST "$BASE_URL/attendances" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\": \"$EVENT_ID\",
    \"participant\": {
      \"firstName\": \"Mamadou\",
      \"lastName\": \"Diop\",
      \"cniNumber\": \"CNI5555666677\",
      \"email\": \"mdiop@test.sn\"
    },
    \"signature\": \"$SIGNATURE\"
  }")

DUP_STATUS=$(echo "$DUPLICATE" | jq -r '.statusCode // "null"')
DUP_ERROR=$(echo "$DUPLICATE" | jq -r '.message // "null"')

check_test "Doublon rejeté (statusCode 409)" "$([ "$DUP_STATUS" = "409" ] && echo true || echo false)"
check_test "Message d'erreur contient 'déjà pointé'" "$(echo $DUP_ERROR | grep -q 'déjà pointé' && echo true || echo false)"

echo "   StatusCode: $DUP_STATUS"
echo "   Message: $DUP_ERROR"
echo ""

echo -e "${BLUE}7️⃣  TEST 4 EDGE CASE: Même email, CNI différent (RÈGLE STRICTE)...${NC}"
echo "   → Doit rejeter car conflit CNI/Email"

EDGE_EMAIL=$(curl -s -X POST "$BASE_URL/attendances" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\": \"$EVENT_ID\",
    \"participant\": {
      \"firstName\": \"Mamadou\",
      \"lastName\": \"Diop Updated\",
      \"cniNumber\": \"CNI9999888777\",
      \"email\": \"mdiop@test.sn\"
    },
    \"signature\": \"$SIGNATURE\"
  }")

EDGE_STATUS=$(echo "$EDGE_EMAIL" | jq -r '.statusCode // "null"')
EDGE_MESSAGE=$(echo "$EDGE_EMAIL" | jq -r '.message // "null"')

check_test "Conflit CNI/Email détecté (statusCode 409)" "$([ "$EDGE_STATUS" = "409" ] && echo true || echo false)"
check_test "Message contient 'CNI différent'" "$(echo $EDGE_MESSAGE | grep -qi 'CNI différent' && echo true || echo false)"

echo "   StatusCode: $EDGE_STATUS"
echo "   Message: $EDGE_MESSAGE"
echo ""

echo -e "${BLUE}8️⃣  TEST 5 EDGE CASE: Même CNI, email différent (CNI prioritaire)...${NC}"
echo "   → Doit retrouver le participant par CNI et mettre à jour l'email"

EDGE_CNI=$(curl -s -X POST "$BASE_URL/attendances" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\": \"$EVENT_ID\",
    \"participant\": {
      \"firstName\": \"Mamadou\",
      \"lastName\": \"Diop\",
      \"cniNumber\": \"CNI5555666677\",
      \"email\": \"mdiop.new@test.sn\"
    },
    \"signature\": \"$SIGNATURE\"
  }")

EDGE_CNI_STATUS=$(echo "$EDGE_CNI" | jq -r '.statusCode // "null"')

# Doit être rejeté car doublon de pointage (même participant retrouvé par CNI)
check_test "Doublon détecté (participant retrouvé par CNI)" "$([ "$EDGE_CNI_STATUS" = "409" ] && echo true || echo false)"

if [ "$EDGE_CNI_STATUS" = "409" ]; then
  echo "   ✅ findOrCreate() a bien trouvé le participant par CNI"
else
  echo "   ⚠️  findOrCreate() a créé un nouveau participant (BUG)"
fi
echo ""

echo -e "${BLUE}9️⃣  TEST 6: Liste de toutes les présences...${NC}"

LIST_ALL=$(curl -s "$BASE_URL/attendances" \
  -H "Authorization: Bearer $TOKEN")

TOTAL=$(echo $LIST_ALL | jq -r '.data.meta.total')

check_test "Liste récupérée (total > 0)" "$([ "$TOTAL" -gt 0 ] && echo true || echo false)"
check_test "Total attendances = 2" "$([ "$TOTAL" -eq 2 ] && echo true || echo false)"

echo "   Total présences: $TOTAL"
echo ""

echo -e "${BLUE}🔟 TEST 7: Présences pour l'événement + statistiques...${NC}"

EVENT_ATTENDANCES=$(curl -s "$BASE_URL/attendances/event/$EVENT_ID" \
  -H "Authorization: Bearer $TOKEN")

EVENT_TOTAL=$(echo $EVENT_ATTENDANCES | jq -r '.data.stats.total')
WITH_SIG=$(echo $EVENT_ATTENDANCES | jq -r '.data.stats.withSignature')
WITHOUT_SIG=$(echo $EVENT_ATTENDANCES | jq -r '.data.stats.withoutSignature')
SIG_RATE=$(echo $EVENT_ATTENDANCES | jq -r '.data.stats.signatureRate')

check_test "Stats présentes" "$([ "$EVENT_TOTAL" != "null" ] && echo true || echo false)"
check_test "Stats total = 2" "$([ "$EVENT_TOTAL" -eq 2 ] && echo true || echo false)"
check_test "Stats withSignature = 2" "$([ "$WITH_SIG" -eq 2 ] && echo true || echo false)"
check_test "Stats withoutSignature = 0" "$([ "$WITHOUT_SIG" -eq 0 ] && echo true || echo false)"
check_test "Taux signature = 100%" "$(echo $SIG_RATE | grep -q '100' && echo true || echo false)"

echo "   Total: $EVENT_TOTAL"
echo "   Avec signature: $WITH_SIG"
echo "   Sans signature: $WITHOUT_SIG"
echo "   Taux: $SIG_RATE%"
echo ""

echo "======================================"
echo "📊 RÉSUMÉ DES TESTS"
echo "======================================"
echo ""
echo -e "${GREEN}Tests réussis: $TESTS_PASSED${NC}"
echo -e "${RED}Tests échoués: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✨ TOUS LES TESTS SONT PASSÉS !${NC}"
  exit 0
else
  echo -e "${RED}❌ CERTAINS TESTS ONT ÉCHOUÉ${NC}"
  exit 1
fi