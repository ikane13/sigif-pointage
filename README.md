# Backend SIGIF Pointage

## État actuel

### Créé
- Entités TypeORM (`src/database/entities/`)
- DTO pour attendance (`src/modules/attendance/dto/`)

### ⏳ À créer (prochaine étape)
- Structure complète NestJS
- Modules (auth, users, events, participants, attendance)
- Services et contrôleurs
- Configuration
- Tests

## Base de données

La base de données est initialisée via Docker :
- Voir `../docker/postgres/init/001_initial_schema.sql`
- Voir `../docker/postgres/init/002_seed_data.sql`

Les entités TypeORM dans ce dossier servent de modèle objet pour l'application.