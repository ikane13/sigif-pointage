#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://localhost:3000/api"
EMAIL="admin@sigif.gouv.sn"
PASSWORD="Admin@2025!"

echo "=== 1) LOGIN ==="
TOKEN="$(
  curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | jq -r '.data.accessToken' | tr -d '\r\n'
)"

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Token introuvable. Réponse login:"
  curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" | jq
  exit 1
fi

echo "✅ Token OK (len=$(echo -n "$TOKEN" | wc -c))"

AUTH_HEADER=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")

echo
echo "=== 2) CREER 3 PARTICIPANTS ==="

P1="$(
  curl -s -X POST "$BASE_URL/participants" "${AUTH_HEADER[@]}" \
    -d '{
      "firstName":"Awa",
      "lastName":"Diop",
      "function":"Chef de projet",
      "cniNumber":"ABCD12345678",
      "originLocality":"Dakar",
      "email":"awa.diop@example.com",
      "phone":"+221771234567",
      "organization":"DTAI"
    }' | jq -r '.data.id'
)"
echo "✅ P1=$P1"

P2="$(
  curl -s -X POST "$BASE_URL/participants" "${AUTH_HEADER[@]}" \
    -d '{
      "firstName":"Moussa",
      "lastName":"Ndiaye",
      "function":"Consultant",
      "cniNumber":"ZXCV98765432",
      "originLocality":"Thiès",
      "email":"moussa.ndiaye@example.com",
      "phone":"+221781112233",
      "organization":"SIGIF"
    }' | jq -r '.data.id'
)"
echo "✅ P2=$P2"

P3="$(
  curl -s -X POST "$BASE_URL/participants" "${AUTH_HEADER[@]}" \
    -d '{
      "firstName":"Fatou",
      "lastName":"Sow",
      "function":"Responsable formation",
      "originLocality":"Saint-Louis",
      "email":"fatou.sow@example.com",
      "phone":"+221701234567",
      "organization":"DTAI"
    }' | jq -r '.data.id'
)"
echo "✅ P3=$P3"

echo
echo "=== 3) LISTER TOUS LES PARTICIPANTS ==="
curl -s "$BASE_URL/participants" -H "Authorization: Bearer $TOKEN" | jq

echo
echo "=== 4) FILTRE (organization=DTAI) ==="
curl -s "$BASE_URL/participants?organization=DTAI" -H "Authorization: Bearer $TOKEN" | jq

echo
echo "=== 5) RECHERCHE (search=Diop) ==="
curl -s "$BASE_URL/participants?search=Diop" -H "Authorization: Bearer $TOKEN" | jq

echo
echo "=== 6) PAGINATION (page=1&limit=2) ==="
curl -s "$BASE_URL/participants?page=1&limit=2" -H "Authorization: Bearer $TOKEN" | jq

echo
echo "=== 7) TRI (sortBy=createdAt&sortOrder=DESC) ==="
curl -s "$BASE_URL/participants?sortBy=createdAt&sortOrder=DESC" -H "Authorization: Bearer $TOKEN" | jq

echo
echo "=== 8) DETAILS D'UN PARTICIPANT (P1) ==="
curl -s "$BASE_URL/participants/$P1" -H "Authorization: Bearer $TOKEN" | jq

echo
echo "=== 9) UPDATE P2 (changer organization + phone) ==="
curl -s -X PATCH "$BASE_URL/participants/$P2" "${AUTH_HEADER[@]}" \
  -d '{
    "organization":"MEF",
    "phone":"+221770000000"
  }' | jq

echo
echo "=== 10) RECHECK DETAILS P2 ==="
curl -s "$BASE_URL/participants/$P2" -H "Authorization: Bearer $TOKEN" | jq

echo
echo "=== 11) TEST ERREUR: sortBy injection (doit 400) ==="
curl -s -i "$BASE_URL/participants?sortBy=malicious;DROP%20TABLE%20participants;--" \
  -H "Authorization: Bearer $TOKEN" | head -n 25

echo
echo "=== 12) TEST ERREUR: CNI invalide (doit 400) ==="
curl -s -i -X POST "$BASE_URL/participants" "${AUTH_HEADER[@]}" \
  -d '{
    "firstName":"Test",
    "lastName":"BadCNI",
    "cniNumber":"abc-123"
  }' | head -n 25

echo
echo "=== 13) DELETE P3 (admin only) ==="
curl -s -X DELETE "$BASE_URL/participants/$P3" -H "Authorization: Bearer $TOKEN" | jq

echo
echo "=== 14) VERIF DELETE P3 (doit 404) ==="
curl -s -i "$BASE_URL/participants/$P3" -H "Authorization: Bearer $TOKEN" | head -n 25

echo
echo "✅ FIN TEST PARTICIPANTS"
