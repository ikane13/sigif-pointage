#!/bin/bash

##############################################
# 🧪 TEST COMPLET MODULE QR CODES
# SIGIF - Pointage Numérique
##############################################

# Configuration
BASE_URL="http://localhost:3000/api"
ADMIN_EMAIL="admin@sigif.gouv.sn"
ADMIN_PASSWORD="Admin@2025!"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

##############################################
# Fonctions utilitaires
##############################################

print_header() {
  echo ""
  echo "======================================"
  echo -e "${BLUE}$1${NC}"
  echo "======================================"
  echo ""
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
  ((PASSED_TESTS++))
  ((TOTAL_TESTS++))
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
  ((FAILED_TESTS++))
  ((TOTAL_TESTS++))
}

print_info() {
  echo -e "${YELLOW}ℹ️  $1${NC}"
}

check_dependency() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}❌ Erreur: $1 n'est pas installé${NC}"
    echo "Installation:"
    echo "  brew install $1  # macOS"
    echo "  apt install $1   # Linux"
    exit 1
  fi
}

##############################################
# Vérification des dépendances
##############################################

print_header "🔍 VÉRIFICATION DES DÉPENDANCES"

check_dependency "curl"
check_dependency "jq"

print_success "Toutes les dépendances sont installées"

##############################################
# 1. LOGIN ADMIN
##############################################

print_header "1️⃣  AUTHENTIFICATION ADMIN"

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

# Vérifier la réponse
SUCCESS=$(echo "$LOGIN_RESPONSE" | jq -r '.success')
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')

if [ "$SUCCESS" = "true" ] && [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
  print_success "Login admin réussi"
  print_info "Token: ${TOKEN:0:20}...${TOKEN: -10}"
else
  print_error "Échec du login admin"
  echo "$LOGIN_RESPONSE" | jq
  exit 1
fi

##############################################
# 2. CRÉER UN ÉVÉNEMENT (SANS QR AUTO)
##############################################

print_header "2️⃣  CRÉATION D'UN ÉVÉNEMENT DE TEST"

EVENT_RESPONSE=$(curl -s -X POST "$BASE_URL/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test QR Code - Atelier Blockchain",
    "eventType": "workshop",
    "startDate": "2025-12-30T09:00:00Z",
    "endDate": "2025-12-30T17:00:00Z",
    "location": "Salle Innovation DTAI - Building A",
    "description": "Formation pratique sur la technologie blockchain et ses applications dans l'\''administration publique",
    "organizer": "Direction de la Transformation Digitale"
  }')

# Vérifier la réponse
EVENT_SUCCESS=$(echo "$EVENT_RESPONSE" | jq -r '.success')
EVENT_ID=$(echo "$EVENT_RESPONSE" | jq -r '.data.id')
EVENT_TITLE=$(echo "$EVENT_RESPONSE" | jq -r '.data.title')
EVENT_QR_TOKEN=$(echo "$EVENT_RESPONSE" | jq -r '.data.qrToken')

if [ "$EVENT_SUCCESS" = "true" ] && [ "$EVENT_ID" != "null" ]; then
  print_success "Événement créé"
  print_info "ID: $EVENT_ID"
  print_info "Titre: $EVENT_TITLE"
  
  if [ "$EVENT_QR_TOKEN" = "null" ]; then
    print_success "Pas de QR code auto-généré (comportement attendu)"
  else
    print_error "QR code généré automatiquement (comportement inattendu)"
  fi
else
  print_error "Échec de la création de l'événement"
  echo "$EVENT_RESPONSE" | jq
  exit 1
fi

##############################################
# 3. GÉNÉRER LE QR CODE
##############################################

print_header "3️⃣  GÉNÉRATION DU QR CODE"

QR_GEN_RESPONSE=$(curl -s -X POST "$BASE_URL/events/$EVENT_ID/qr-code" \
  -H "Authorization: Bearer $TOKEN")

# Vérifier la réponse
QR_SUCCESS=$(echo "$QR_GEN_RESPONSE" | jq -r '.success')
QR_TOKEN=$(echo "$QR_GEN_RESPONSE" | jq -r '.data.token')
QR_GENERATED_AT=$(echo "$QR_GEN_RESPONSE" | jq -r '.data.generatedAt')
QR_DISPLAY_URL=$(echo "$QR_GEN_RESPONSE" | jq -r '.data.urls.display')
QR_POINTAGE_URL=$(echo "$QR_GEN_RESPONSE" | jq -r '.data.urls.pointage')

if [ "$QR_SUCCESS" = "true" ] && [ "$QR_TOKEN" != "null" ] && [ ! -z "$QR_TOKEN" ]; then
  print_success "QR code généré avec succès"
  print_info "Token: ${QR_TOKEN:0:20}...${QR_TOKEN: -10}"
  print_info "Généré le: $QR_GENERATED_AT"
  print_info "URL display: $QR_DISPLAY_URL"
  print_info "URL pointage: $QR_POINTAGE_URL"
else
  print_error "Échec de la génération du QR code"
  echo "$QR_GEN_RESPONSE" | jq
  exit 1
fi

echo ""
echo "📋 Réponse complète :"
echo "$QR_GEN_RESPONSE" | jq

##############################################
# 4. RÉCUPÉRER LES INFOS DU QR CODE
##############################################

print_header "4️⃣  RÉCUPÉRATION DES INFOS DU QR CODE"

QR_INFO_RESPONSE=$(curl -s -X GET "$BASE_URL/events/$EVENT_ID/qr-code" \
  -H "Authorization: Bearer $TOKEN")

# Vérifier la réponse
INFO_SUCCESS=$(echo "$QR_INFO_RESPONSE" | jq -r '.success')
INFO_TOKEN=$(echo "$QR_INFO_RESPONSE" | jq -r '.data.token')
INFO_SCAN_COUNT=$(echo "$QR_INFO_RESPONSE" | jq -r '.data.scanCount')

if [ "$INFO_SUCCESS" = "true" ] && [ "$INFO_TOKEN" = "$QR_TOKEN" ]; then
  print_success "Informations récupérées avec succès"
  print_info "Nombre de scans: $INFO_SCAN_COUNT"
else
  print_error "Échec de la récupération des infos"
  echo "$QR_INFO_RESPONSE" | jq
fi

echo ""
echo "📋 Réponse complète :"
echo "$QR_INFO_RESPONSE" | jq

##############################################
# 5. TÉLÉCHARGER LE QR CODE PNG
##############################################

print_header "5️⃣  TÉLÉCHARGEMENT DU QR CODE PNG"

PNG_FILE="qr_test_${EVENT_ID:0:8}.png"
HTTP_CODE=$(curl -s -w "%{http_code}" -o "$PNG_FILE" \
  "$BASE_URL/events/$EVENT_ID/qr-code/download?format=png" \
  -H "Authorization: Bearer $TOKEN")

if [ "$HTTP_CODE" = "200" ] && [ -f "$PNG_FILE" ]; then
  PNG_SIZE=$(ls -lh "$PNG_FILE" | awk '{print $5}')
  print_success "PNG téléchargé"
  print_info "Fichier: $PNG_FILE"
  print_info "Taille: $PNG_SIZE"
else
  print_error "Échec du téléchargement PNG (HTTP $HTTP_CODE)"
fi

##############################################
# 6. TÉLÉCHARGER LE QR CODE PDF
##############################################

print_header "6️⃣  TÉLÉCHARGEMENT DU QR CODE PDF"

PDF_FILE="qr_test_${EVENT_ID:0:8}.pdf"
HTTP_CODE=$(curl -s -w "%{http_code}" -o "$PDF_FILE" \
  "$BASE_URL/events/$EVENT_ID/qr-code/download?format=pdf" \
  -H "Authorization: Bearer $TOKEN")

if [ "$HTTP_CODE" = "200" ] && [ -f "$PDF_FILE" ]; then
  PDF_SIZE=$(ls -lh "$PDF_FILE" | awk '{print $5}')
  print_success "PDF téléchargé"
  print_info "Fichier: $PDF_FILE"
  print_info "Taille: $PDF_SIZE"
else
  print_error "Échec du téléchargement PDF (HTTP $HTTP_CODE)"
fi

##############################################
# 7. VALIDER LE TOKEN (ENDPOINT PUBLIC)
##############################################

print_header "7️⃣  VALIDATION DU TOKEN (ENDPOINT PUBLIC)"

VALIDATE_RESPONSE=$(curl -s -X GET "$BASE_URL/qr-codes/validate/$QR_TOKEN")

# Vérifier la réponse
VALIDATE_SUCCESS=$(echo "$VALIDATE_RESPONSE" | jq -r '.success')
VALIDATE_EVENT_ID=$(echo "$VALIDATE_RESPONSE" | jq -r '.data.event.id')
VALIDATE_EVENT_TITLE=$(echo "$VALIDATE_RESPONSE" | jq -r '.data.event.title')
CAN_CHECKIN=$(echo "$VALIDATE_RESPONSE" | jq -r '.data.canCheckIn')

if [ "$VALIDATE_SUCCESS" = "true" ] && [ "$VALIDATE_EVENT_ID" = "$EVENT_ID" ]; then
  print_success "Token validé avec succès"
  print_info "Événement: $VALIDATE_EVENT_TITLE"
  print_info "Pointage autorisé: $CAN_CHECKIN"
else
  print_error "Échec de la validation du token"
  echo "$VALIDATE_RESPONSE" | jq
fi

echo ""
echo "📋 Réponse complète :"
echo "$VALIDATE_RESPONSE" | jq

##############################################
# 8. SCANNER LE QR CODE PLUSIEURS FOIS
##############################################

print_header "8️⃣  SIMULATION DE SCANS MULTIPLES"

for i in {1..3}; do
  SCAN_RESPONSE=$(curl -s -X GET "$BASE_URL/qr-codes/validate/$QR_TOKEN")
  SCAN_SUCCESS=$(echo "$SCAN_RESPONSE" | jq -r '.success')
  
  if [ "$SCAN_SUCCESS" = "true" ]; then
    print_success "Scan #$i réussi"
  else
    print_error "Scan #$i échoué"
  fi
  sleep 1
done

# Vérifier que le compteur a augmenté
FINAL_INFO=$(curl -s -X GET "$BASE_URL/events/$EVENT_ID/qr-code" \
  -H "Authorization: Bearer $TOKEN")

FINAL_SCAN_COUNT=$(echo "$FINAL_INFO" | jq -r '.data.scanCount')

if [ "$FINAL_SCAN_COUNT" -ge "3" ]; then
  print_success "Compteur de scans incrémenté correctement"
  print_info "Nombre total de scans: $FINAL_SCAN_COUNT"
else
  print_error "Compteur de scans incorrect"
  print_info "Attendu: >= 3, Reçu: $FINAL_SCAN_COUNT"
fi

##############################################
# 9. OUVRIR LES FICHIERS GÉNÉRÉS
##############################################

print_header "9️⃣  FICHIERS GÉNÉRÉS"

echo ""
echo "📁 Fichiers disponibles :"
echo "   - $PNG_FILE"
echo "   - $PDF_FILE"
echo ""
echo "Pour les ouvrir :"
echo "   open $PNG_FILE"
echo "   open $PDF_FILE"
echo ""

# Demander si on veut les ouvrir automatiquement
read -p "Voulez-vous ouvrir les fichiers maintenant ? (o/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Oo]$ ]]; then
  if command -v open &> /dev/null; then
    open "$PNG_FILE"
    open "$PDF_FILE"
    print_success "Fichiers ouverts"
  elif command -v xdg-open &> /dev/null; then
    xdg-open "$PNG_FILE"
    xdg-open "$PDF_FILE"
    print_success "Fichiers ouverts"
  else
    print_error "Impossible d'ouvrir automatiquement (commande 'open' ou 'xdg-open' non trouvée)"
  fi
fi

##############################################
# RÉSUMÉ FINAL
##############################################

print_header "📊 RÉSUMÉ DES TESTS"

echo ""
echo -e "${BLUE}Tests exécutés:${NC} $TOTAL_TESTS"
echo -e "${GREEN}Tests réussis:${NC} $PASSED_TESTS"
echo -e "${RED}Tests échoués:${NC} $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ TOUS LES TESTS ONT RÉUSSI !${NC}"
  echo ""
  echo "🎉 Le module QR Codes est 100% opérationnel !"
  echo ""
  echo "📋 Endpoints testés :"
  echo "   ✅ POST /events/:id/qr-code         → Génération"
  echo "   ✅ GET  /events/:id/qr-code         → Infos"
  echo "   ✅ GET  /events/:id/qr-code/download → Téléchargement"
  echo "   ✅ GET  /qr-codes/validate/:token   → Validation"
  echo ""
  echo "🚀 Prochaine étape : Développement du frontend"
  exit 0
else
  echo -e "${RED}❌ CERTAINS TESTS ONT ÉCHOUÉ${NC}"
  echo ""
  echo "Veuillez vérifier les erreurs ci-dessus."
  exit 1
fi