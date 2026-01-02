# Scripts de tests manuels

Ces scripts permettent de tester manuellement les modules de l'API via curl.

## Prérequis

- Backend démarré : `npm run start:dev`
- `jq` installé : `brew install jq` (macOS) ou `apt-get install jq` (Linux)
- Base de données initialisée

## Scripts disponibles

### test-participants.sh

Teste le module Participants :
- Création de participants
- Liste et recherche
- Filtres et pagination
- Modification et suppression
- Validations (CNI, email)

**Exécution :**
```bash
./test/scripts/test-participants.sh
```

### test-events.sh (à venir)

Teste le module Events :
- Création d'événements
- Génération QR codes
- Liste et filtres

### test-attendances.sh (à venir)

Teste le module Attendances :
- Pointage avec signature
- Validation QR codes
- Enregistrement présences

## Variables d'environnement

Les scripts utilisent par défaut :
- URL : `http://localhost:3000/api`
- Login : `admin@sigif.gouv.sn`
- Password : `Admin@2025!`

Pour modifier :
```bash
export API_BASE_URL="http://autre-url.com/api"
export ADMIN_EMAIL="autre@email.com"
export ADMIN_PASSWORD="AutreMotDePasse"
./test/scripts/test-participants.sh
```

## Notes

Ces scripts sont pour tests manuels en développement.
Pour les tests automatisés, utiliser les tests e2e NestJS dans `test/*.e2e-spec.ts`.