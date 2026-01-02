#!/usr/bin/env bash
set -euo pipefail

API="http://localhost:3000/api"
EMAIL="admin@sigif.gouv.sn"
PASSWORD="Admin@2025!"

echo "=== 1) LOGIN ==="
TOKEN="$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | jq -r '.data.accessToken' | tr -d '\r\n')"

echo "TOKEN length: $(echo -n "$TOKEN" | wc -c)"

echo
echo "=== 2) CREER PLUSIEURS EVENEMENTS ==="

echo "--- Create #1 (workshop)"
EV1_ID="$(curl -s -X POST "$API/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Atelier SIGIF - Formation Module Budgétaire",
    "eventType": "workshop",
    "description": "Formation approfondie sur le module budgétaire",
    "startDate": "2025-12-22T09:00:00Z",
    "endDate": "2025-12-22T17:00:00Z",
    "location": "Salle de conférence DTAI",
    "organizer": "Direction de la Formation"
  }' | jq -r '.data.id')"
echo "EV1_ID=$EV1_ID"

echo "--- Create #2 (committee)"
EV2_ID="$(curl -s -X POST "$API/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Comité de Pilotage Q4",
    "eventType": "committee",
    "startDate": "2025-12-25T10:00:00Z",
    "location": "Bureau du Directeur"
  }' | jq -r '.data.id')"
echo "EV2_ID=$EV2_ID"

echo "--- Create #3 (meeting)"
EV3_ID="$(curl -s -X POST "$API/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Réunion Architecture Plateforme d’échange",
    "eventType": "meeting",
    "startDate": "2025-12-20T15:00:00Z",
    "location": "SIGIF / Salle Projet",
    "organizer": "Équipe Architecture"
  }' | jq -r '.data.id')"
echo "EV3_ID=$EV3_ID"

echo
echo "=== 3) LISTE DES EVENEMENTS (sans filtres) ==="
curl -s "$API/events" \
  -H "Authorization: Bearer $TOKEN" | jq

echo
echo "=== 4) FILTRE PAR TYPE (workshop) ==="
curl -s "$API/events?eventType=workshop" \
  -H "Authorization: Bearer $TOKEN" | jq

echo
echo "=== 5) PAGINATION (page=1, limit=2) ==="
curl -s "$API/events?page=1&limit=2" \
  -H "Authorization: Bearer $TOKEN" | jq

echo
echo "=== 6) DETAILS D'UN EVENEMENT (EV1) ==="
curl -s "$API/events/$EV1_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

echo
echo "=== 7) UPDATE (EV2) ==="
curl -s -X PATCH "$API/events/$EV2_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Session de validation des décisions et jalons",
    "location": "Salle de réunion - Direction",
    "status": "scheduled"
  }' | jq

echo
echo "=== 8) REGENERER QR CODE (EV1) ==="
curl -s -X POST "$API/events/$EV1_ID/regenerate-qr" \
  -H "Authorization: Bearer $TOKEN" | jq

echo
echo "=== 9) FILTRE PAR PERIODE startDateFrom/startDateTo ==="
curl -s "$API/events?startDateFrom=2025-12-19T00:00:00Z&startDateTo=2025-12-26T23:59:59Z" \
  -H "Authorization: Bearer $TOKEN" | jq

echo
echo "=== 10) DELETE (EV3) ==="
curl -s -X DELETE "$API/events/$EV3_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

echo
echo "=== 11) LISTE FINALE (verifier EV3 supprimé) ==="
curl -s "$API/events?sortBy=createdAt&sortOrder=DESC" \
  -H "Authorization: Bearer $TOKEN" | jq

echo
echo "✅ Tests terminés."
