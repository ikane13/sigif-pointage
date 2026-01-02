# 🐳 Guide Docker - SIGIF Pointage

## Prérequis

- Docker Desktop installé (version 20+)
- Docker Compose (version 2+)

## Démarrage rapide

### 1. Configuration initiale
```bash
# Copiez le fichier d'environnement
cp .env.example .env

# Éditez .env si nécessaire (facultatif pour le dev local)
nano .env
```

### 2. Lancement des services
```bash
# Démarrer PostgreSQL + pgAdmin
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps
```

Vous devriez voir :
```
NAME                IMAGE                  STATUS
sigif-postgres      postgres:15-alpine     Up (healthy)
sigif-pgadmin       dpage/pgadmin4:latest  Up
```

### 3. Accès aux services

- **PostgreSQL** : `localhost:5432`
  - Base : `sigif_pointage`
  - User : `sigif_user`
  - Password : voir `.env`

- **pgAdmin** : http://localhost:5050
  - Email : `admin@sigif.local`
  - Password : `admin123`

### 4. Connexion à PostgreSQL

#### Option A : Depuis pgAdmin

1. Ouvrez http://localhost:5050
2. Créez une nouvelle connexion serveur :
   - Host : `postgres` (nom du service Docker)
   - Port : `5432`
   - Database : `sigif_pointage`
   - Username : `sigif_user`
   - Password : celui de votre `.env`

#### Option B : Depuis la ligne de commande
```bash
# Se connecter au conteneur
docker exec -it sigif-postgres psql -U sigif_user -d sigif_pointage

# Lister les tables
\dt

# Exemple de requête
SELECT * FROM users;

# Quitter
\q
```

#### Option C : Depuis votre IDE (VS Code, DataGrip, etc.)

- Host : `localhost`
- Port : `5432`
- Database : `sigif_pointage`
- User : `sigif_user`
- Password : voir `.env`

## Commandes utiles
```bash
# Voir les logs
docker-compose logs -f postgres

# Arrêter les services
docker-compose down

# Arrêter ET supprimer les données
docker-compose down -v

# Redémarrer un service
docker-compose restart postgres

# Recréer la base (⚠️ supprime les données)
docker-compose down -v && docker-compose up -d
```

## Vérification du schéma
```bash
# Lister toutes les tables
docker exec -it sigif-postgres psql -U sigif_user -d sigif_pointage -c "\dt"

# Vérifier les données de test
docker exec -it sigif-postgres psql -U sigif_user -d sigif_pointage -c "SELECT * FROM users;"
docker exec -it sigif-postgres psql -U sigif_user -d sigif_pointage -c "SELECT * FROM events;"
```

## Résolution de problèmes

### Le conteneur ne démarre pas
```bash
# Voir les logs détaillés
docker-compose logs postgres

# Vérifier l'espace disque
docker system df
```

### La base n'est pas initialisée
```bash
# Supprimer complètement et recommencer
docker-compose down -v
docker-compose up -d

# Les scripts dans docker/postgres/init/ s'exécutent automatiquement
### Reset complet
```bash
docker-compose down -v
docker volume prune
docker-compose up -d
```