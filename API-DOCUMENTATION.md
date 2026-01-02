# 📡 Documentation API - SIGIF Pointage

> Documentation complète des endpoints REST API du système de pointage numérique SIGIF

**Version :** 1.0.0  
**Date :** Décembre 2025  
**Base URL :** `https://api.pointage.sigif.gouv.sn/api` (Production)  
**Base URL Dev :** `http://localhost:3000/api` (Développement)

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Authentification](#1-authentification)
3. [Utilisateurs](#2-utilisateurs)
4. [Événements](#3-événements)
5. [Participants](#4-participants)
6. [Présences](#5-présences)
7. [Exports](#6-exports)
8. [Statistiques](#7-statistiques)
9. [QR Codes](#8-qr-codes)
10. [Codes d'erreur](#codes-derreur)
11. [Exemples d'utilisation](#exemples-dutilisation)

---

## 🎯 VUE D'ENSEMBLE

### Base URL
```
Production  : https://api.pointage.sigif.gouv.sn/api
Recette     : https://api-recette.pointage.sigif.gouv.sn/api
Dev         : http://localhost:3000/api
```

### Format des requêtes/réponses

- **Format :** JSON
- **Encoding :** UTF-8
- **Content-Type :** `application/json`

### Authentification

Les endpoints nécessitant une authentification utilisent **JWT Bearer Token** :
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Structure de réponse standard

#### Succès
```json
{
  "success": true,
  "data": {...},
  "message": "Message optionnel"
}
```

#### Erreur
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description de l'erreur",
    "details": {}
  }
}
```

### Pagination
```json
{
  "success": true,
  "data": {
    "items": [...],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 234,
      "totalPages": 12,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## 🔐 1. AUTHENTIFICATION

### 1.1 Connexion

**Endpoint :** `POST /auth/login`  
**Auth requis :** Non

Authentifie un administrateur et retourne un token JWT.

**Request :**
```json
{
  "email": "admin@sigif.gouv.sn",
  "password": "Admin@2025!"
}
```

**Validation :**
- `email` : requis, format email valide
- `password` : requis, min 8 caractères

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "id": "uuid-123",
      "email": "admin@sigif.gouv.sn",
      "firstName": "Administrateur",
      "lastName": "Principal",
      "fullName": "Administrateur Principal",
      "role": "admin",
      "isActive": true
    }
  }
}
```

**Response Error (401) :**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email ou mot de passe incorrect"
  }
}
```

**Response Error (403) :**
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_DISABLED",
    "message": "Votre compte est désactivé. Contactez l'administrateur."
  }
}
```

**Exemple cURL :**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sigif.gouv.sn",
    "password": "Admin@2025!"
  }'
```

---

### 1.2 Rafraîchir le token

**Endpoint :** `POST /auth/refresh`  
**Auth requis :** Oui

Génère un nouveau token JWT avant expiration.

**Headers :**
```
Authorization: Bearer {token}
```

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400
  }
}
```

---

### 1.3 Déconnexion

**Endpoint :** `POST /auth/logout`  
**Auth requis :** Oui

Invalide le token JWT (optionnel selon implémentation).

**Headers :**
```
Authorization: Bearer {token}
```

**Response Success (200) :**
```json
{
  "success": true,
  "message": "Déconnexion réussie"
}
```

---

### 1.4 Profil utilisateur connecté

**Endpoint :** `GET /auth/me`  
**Auth requis :** Oui

Récupère les informations de l'utilisateur authentifié.

**Headers :**
```
Authorization: Bearer {token}
```

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "email": "admin@sigif.gouv.sn",
    "firstName": "Administrateur",
    "lastName": "Principal",
    "fullName": "Administrateur Principal",
    "role": "admin",
    "isActive": true,
    "lastLoginAt": "2025-12-13T10:30:00Z",
    "createdAt": "2025-01-15T08:00:00Z"
  }
}
```

---

## 👥 2. UTILISATEURS

### 2.1 Liste des utilisateurs

**Endpoint :** `GET /users`  
**Auth requis :** Oui (admin uniquement)

Récupère la liste paginée des utilisateurs administrateurs.

**Query Parameters :**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| page | integer | 1 | Numéro de page |
| limit | integer | 20 | Nombre d'éléments par page |
| role | string | - | Filtrer par rôle (admin, organizer, viewer) |
| search | string | - | Recherche textuelle (nom, email) |
| isActive | boolean | - | Filtrer par statut actif/inactif |
| sortBy | string | createdAt | Champ de tri |
| sortOrder | string | DESC | Ordre de tri (ASC, DESC) |

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-123",
        "email": "admin@sigif.gouv.sn",
        "firstName": "Administrateur",
        "lastName": "Principal",
        "fullName": "Administrateur Principal",
        "role": "admin",
        "isActive": true,
        "lastLoginAt": "2025-12-13T10:30:00Z",
        "createdAt": "2025-01-15T08:00:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 3,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

**Exemple :**
```bash
GET /api/users?page=1&limit=20&role=admin&search=mamadou&sortBy=lastName&sortOrder=ASC
```

---

### 2.2 Créer un utilisateur

**Endpoint :** `POST /users`  
**Auth requis :** Oui (admin uniquement)

Crée un nouvel utilisateur administrateur.

**Request :**
```json
{
  "email": "nouveau@sigif.gouv.sn",
  "password": "TempPassword@2025!",
  "firstName": "Nouveau",
  "lastName": "Utilisateur",
  "role": "organizer"
}
```

**Validation Rules :**
- `email` : requis, format email, unique
- `password` : requis, min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
- `firstName` : requis, max 100 caractères
- `lastName` : requis, max 100 caractères
- `role` : requis, enum [admin, organizer, viewer]

**Response Success (201) :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-new",
    "email": "nouveau@sigif.gouv.sn",
    "firstName": "Nouveau",
    "lastName": "Utilisateur",
    "fullName": "Nouveau Utilisateur",
    "role": "organizer",
    "isActive": true,
    "createdAt": "2025-12-13T11:00:00Z"
  },
  "message": "Utilisateur créé avec succès"
}
```

**Response Error (409) :**
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "Un utilisateur avec cet email existe déjà"
  }
}
```

**Response Error (400) :**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Erreur de validation",
    "details": {
      "password": "Le mot de passe doit contenir au moins 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial"
    }
  }
}
```

---

### 2.3 Détails d'un utilisateur

**Endpoint :** `GET /users/:id`  
**Auth requis :** Oui

Récupère les détails d'un utilisateur spécifique.

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "email": "admin@sigif.gouv.sn",
    "firstName": "Administrateur",
    "lastName": "Principal",
    "fullName": "Administrateur Principal",
    "role": "admin",
    "isActive": true,
    "lastLoginAt": "2025-12-13T10:30:00Z",
    "createdAt": "2025-01-15T08:00:00Z",
    "updatedAt": "2025-12-13T10:30:00Z",
    "stats": {
      "eventsCreated": 12,
      "lastEventCreated": "2025-12-10T14:00:00Z"
    }
  }
}
```

**Response Error (404) :**
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "Utilisateur introuvable"
  }
}
```

---

### 2.4 Modifier un utilisateur

**Endpoint :** `PATCH /users/:id`  
**Auth requis :** Oui (admin ou l'utilisateur lui-même)

Modifie les informations d'un utilisateur.

**Request (tous les champs sont optionnels) :**
```json
{
  "firstName": "Nouveau Prénom",
  "lastName": "Nouveau Nom",
  "role": "organizer",
  "isActive": false
}
```

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-123",
    "email": "admin@sigif.gouv.sn",
    "firstName": "Nouveau Prénom",
    "lastName": "Nouveau Nom",
    "role": "organizer",
    "isActive": false,
    "updatedAt": "2025-12-13T11:30:00Z"
  },
  "message": "Utilisateur modifié avec succès"
}
```

---

### 2.5 Supprimer un utilisateur

**Endpoint :** `DELETE /users/:id`  
**Auth requis :** Oui (admin uniquement)

Supprime (désactive) un utilisateur.

**Response Success (200) :**
```json
{
  "success": true,
  "message": "Utilisateur supprimé avec succès"
}
```

---

### 2.6 Changer le mot de passe

**Endpoint :** `PATCH /users/:id/password`  
**Auth requis :** Oui

Change le mot de passe d'un utilisateur.

**Request :**
```json
{
  "currentPassword": "OldPassword@2025!",
  "newPassword": "NewPassword@2025!"
}
```

**Validation :**
- `currentPassword` : requis
- `newPassword` : requis, min 8 caractères, règles de complexité

**Response Success (200) :**
```json
{
  "success": true,
  "message": "Mot de passe modifié avec succès"
}
```

**Response Error (401) :**
```json
{
  "success": false,
  "error": {
    "code": "CURRENT_PASSWORD_INCORRECT",
    "message": "Le mot de passe actuel est incorrect"
  }
}
```

---

## 📅 3. ÉVÉNEMENTS

### 3.1 Liste des événements

**Endpoint :** `GET /events`  
**Auth requis :** Oui

Récupère la liste paginée des événements.

**Query Parameters :**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| page | integer | 1 | Numéro de page |
| limit | integer | 20 | Nombre d'éléments par page |
| status | string | - | Filtrer par statut (scheduled, ongoing, completed, cancelled) |
| eventType | string | - | Filtrer par type (workshop, meeting, etc.) |
| startDateFrom | date | - | Date de début minimum |
| startDateTo | date | - | Date de début maximum |
| search | string | - | Recherche textuelle (titre, description, lieu) |
| sortBy | string | startDate | Champ de tri |
| sortOrder | string | DESC | Ordre de tri |

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-event-1",
        "title": "Atelier SIGIF - Interfaces NINEA",
        "eventType": "workshop",
        "description": "Atelier de formation sur les interfaces...",
        "startDate": "2025-12-15T09:00:00Z",
        "endDate": "2025-12-15T17:00:00Z",
        "location": "Salle de conférence DTAI",
        "organizer": "Direction des Systèmes d'Information",
        "status": "scheduled",
        "qrCodeData": "https://pointage.sigif.gouv.sn/e/A7KP2M",
        "attendanceCount": 0,
        "createdBy": {
          "id": "uuid-user-1",
          "fullName": "Administrateur Principal"
        },
        "createdAt": "2025-12-01T10:00:00Z",
        "updatedAt": "2025-12-01T10:00:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

**Exemple :**
```bash
GET /api/events?page=1&limit=20&status=scheduled&eventType=workshop&search=SIGIF
```

---

### 3.2 Créer un événement

**Endpoint :** `POST /events`  
**Auth requis :** Oui (admin ou organizer)

Crée un nouvel événement et génère automatiquement son QR code.

**Request :**
```json
{
  "title": "Atelier SIGIF - Interfaces NINEA",
  "eventType": "workshop",
  "description": "Atelier de formation sur les interfaces avec le système NINEA",
  "startDate": "2025-12-15T09:00:00Z",
  "endDate": "2025-12-15T17:00:00Z",
  "location": "Salle de conférence DTAI - Bâtiment Financière, Dakar",
  "organizer": "Direction des Systèmes d'Information",
  "additionalInfo": {
    "capacity": 50,
    "requirements": "Ordinateur portable requis"
  }
}
```

**Validation Rules :**
- `title` : requis, max 255 caractères
- `eventType` : requis, enum [workshop, meeting, committee, training, seminar, other]
- `description` : optionnel, texte
- `startDate` : requis, format ISO 8601
- `endDate` : optionnel, doit être >= startDate
- `location` : optionnel, max 255 caractères
- `organizer` : optionnel, max 150 caractères
- `additionalInfo` : optionnel, objet JSON

**Response Success (201) :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-event-new",
    "title": "Atelier SIGIF - Interfaces NINEA",
    "eventType": "workshop",
    "description": "Atelier de formation sur les interfaces...",
    "startDate": "2025-12-15T09:00:00Z",
    "endDate": "2025-12-15T17:00:00Z",
    "location": "Salle de conférence DTAI",
    "organizer": "Direction des Systèmes d'Information",
    "status": "scheduled",
    "qrCodeData": "https://pointage.sigif.gouv.sn/e/X9KL4P?t=1734245400&s=abc123def456",
    "qrCodeSecret": "generated-hmac-secret",
    "qrCodeExpiresAt": "2025-12-16T17:00:00Z",
    "additionalInfo": {
      "capacity": 50,
      "requirements": "Ordinateur portable requis"
    },
    "createdAt": "2025-12-13T12:00:00Z"
  },
  "message": "Événement créé avec succès"
}
```

**Response Error (400) :**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Erreur de validation",
    "details": {
      "endDate": "La date de fin doit être postérieure à la date de début"
    }
  }
}
```

---

### 3.3 Détails d'un événement

**Endpoint :** `GET /events/:id`  
**Auth requis :** Optionnel (public pour participants)

Récupère les détails complets d'un événement.

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-event-1",
    "title": "Atelier SIGIF - Interfaces NINEA",
    "eventType": "workshop",
    "description": "Atelier de formation sur les interfaces...",
    "startDate": "2025-12-15T09:00:00Z",
    "endDate": "2025-12-15T17:00:00Z",
    "location": "Salle de conférence DTAI",
    "organizer": "Direction des Systèmes d'Information",
    "status": "scheduled",
    "qrCodeData": "https://pointage.sigif.gouv.sn/e/A7KP2M",
    "additionalInfo": {
      "capacity": 50,
      "requirements": "Ordinateur portable requis"
    },
    "attendanceStats": {
      "total": 23,
      "withSignature": 21,
      "withoutSignature": 2,
      "signatureRate": 91.30
    },
    "createdBy": {
      "id": "uuid-user-1",
      "fullName": "Administrateur Principal"
    },
    "createdAt": "2025-12-01T10:00:00Z",
    "updatedAt": "2025-12-13T08:00:00Z"
  }
}
```

---

### 3.4 Récupérer un événement par code court (QR)

**Endpoint :** `GET /events/by-code/:shortCode`  
**Auth requis :** Non

Récupère un événement via son code court (utilisé dans les QR codes).

**Exemple :** `/api/events/by-code/A7KP2M?t=1734245400&s=abc123`

**Query Parameters :**
- `t` : timestamp (pour validation)
- `s` : signature HMAC (pour validation)

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-event-1",
    "title": "Atelier SIGIF - Interfaces NINEA",
    "eventType": "workshop",
    "startDate": "2025-12-15T09:00:00Z",
    "endDate": "2025-12-15T17:00:00Z",
    "location": "Salle de conférence DTAI",
    "organizer": "Direction des Systèmes d'Information",
    "status": "scheduled"
  }
}
```

**Response Error (400) :**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_QR_CODE",
    "message": "Le QR code est invalide ou expiré"
  }
}
```

**Response Error (404) :**
```json
{
  "success": false,
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "Événement introuvable"
  }
}
```

---

### 3.5 Modifier un événement

**Endpoint :** `PATCH /events/:id`  
**Auth requis :** Oui (admin ou créateur)

Modifie les informations d'un événement.

**Request (tous champs optionnels) :**
```json
{
  "title": "Atelier SIGIF - Interfaces NINEA (Mise à jour)",
  "status": "ongoing",
  "location": "Nouvelle salle - Bâtiment B",
  "additionalInfo": {
    "capacity": 60
  }
}
```

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-event-1",
    "title": "Atelier SIGIF - Interfaces NINEA (Mise à jour)",
    "status": "ongoing",
    "location": "Nouvelle salle - Bâtiment B",
    "updatedAt": "2025-12-13T14:00:00Z"
  },
  "message": "Événement modifié avec succès"
}
```

---

### 3.6 Supprimer un événement

**Endpoint :** `DELETE /events/:id`  
**Auth requis :** Oui (admin uniquement)

Supprime un événement et toutes ses présences associées (CASCADE).

**Response Success (200) :**
```json
{
  "success": true,
  "message": "Événement supprimé avec succès"
}
```

**Warning :** Cette action supprime également toutes les présences liées.

---

### 3.7 Régénérer le QR code

**Endpoint :** `POST /events/:id/regenerate-qr`  
**Auth requis :** Oui (admin ou créateur)

Régénère le QR code d'un événement (nouveau secret, nouvelle expiration).

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "qrCodeData": "https://pointage.sigif.gouv.sn/e/N8PM5K?t=1734250000&s=newhmac",
    "qrCodeExpiresAt": "2025-12-16T20:00:00Z"
  },
  "message": "QR code régénéré avec succès"
}
```

---

## 👤 4. PARTICIPANTS

### 4.1 Liste des participants

**Endpoint :** `GET /participants`  
**Auth requis :** Oui

Récupère la liste paginée des participants.

**Query Parameters :**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| page | integer | 1 | Numéro de page |
| limit | integer | 20 | Nombre d'éléments par page |
| search | string | - | Recherche textuelle (nom, email, CNI, organisation) |
| organization | string | - | Filtrer par organisation |
| sortBy | string | lastName | Champ de tri |
| sortOrder | string | ASC | Ordre de tri |

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-participant-1",
        "firstName": "Abdoulaye",
        "lastName": "Fall",
        "fullName": "Abdoulaye Fall",
        "function": "Chef de Service Informatique",
        "cniNumber": "CNI1234567890",
        "originLocality": "Dakar",
        "email": "afall@finances.gouv.sn",
        "phone": "+221 77 123 45 67",
        "organization": "Direction Générale des Impôts",
        "attendanceCount": 5,
        "lastAttendance": "2025-12-10T09:30:00Z",
        "createdAt": "2025-11-01T08:00:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Exemple :**
```bash
GET /api/participants?page=1&limit=20&search=fall&organization=DTAI&sortBy=lastName
```

---

### 4.2 Détails d'un participant

**Endpoint :** `GET /participants/:id`  
**Auth requis :** Oui

Récupère les détails complets d'un participant avec son historique de présences.

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-participant-1",
    "firstName": "Abdoulaye",
    "lastName": "Fall",
    "fullName": "Abdoulaye Fall",
    "function": "Chef de Service Informatique",
    "cniNumber": "CNI1234567890",
    "originLocality": "Dakar",
    "email": "afall@finances.gouv.sn",
    "phone": "+221 77 123 45 67",
    "organization": "Direction Générale des Impôts",
    "attendances": [
      {
        "id": "uuid-attendance-1",
        "event": {
          "id": "uuid-event-1",
          "title": "Atelier SIGIF - Interfaces NINEA",
          "startDate": "2025-12-15T09:00:00Z"
        },
        "checkInTime": "2025-12-15T09:15:00Z",
        "hasSignature": true
      }
    ],
    "stats": {
      "totalAttendances": 5,
      "eventsTypes": {
        "workshop": 3,
        "meeting": 2
      },
      "lastAttendance": "2025-12-10T09:30:00Z"
    },
    "createdAt": "2025-11-01T08:00:00Z",
    "updatedAt": "2025-12-10T09:30:00Z"
  }
}
```

---

### 4.3 Créer un participant

**Endpoint :** `POST /participants`  
**Auth requis :** Oui (admin ou organizer)

Crée manuellement un participant (sans pointage).

**Request :**
```json
{
  "firstName": "Nouveau",
  "lastName": "Participant",
  "function": "Analyste",
  "cniNumber": "CNI9988776655",
  "originLocality": "Thiès",
  "email": "nouveau@example.com",
  "phone": "+221 77 999 88 77",
  "organization": "Ministère de l'Économie"
}
```

**Validation Rules :**
- `firstName` : requis, max 100 caractères
- `lastName` : requis, max 100 caractères
- `function` : optionnel, max 150 caractères
- `cniNumber` : optionnel, format alphanumé 8-20 caractères, unique
- `originLocality` : optionnel, max 150 caractères
- `email` : optionnel, format email valide
- `phone` : optionnel, format `^\+?[0-9\s\-()]{8,20}$`
- `organization` : optionnel, max 255 caractères

**Response Success (201) :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-participant-new",
    "firstName": "Nouveau",
    "lastName": "Participant",
    "fullName": "Nouveau Participant",
    "cniNumber": "CNI9988776655",
    "email": "nouveau@example.com",
    "organization": "Ministère de l'Économie",
    "createdAt": "2025-12-13T15:00:00Z"
  },
  "message": "Participant créé avec succès"
}
```

**Response Error (409) :**
```json
{
  "success": false,
  "error": {
    "code": "CNI_ALREADY_EXISTS",
    "message": "Un participant avec ce numéro CNI existe déjà"
}
}
---

### 4.4 Modifier un participant

**Endpoint :** `PATCH /participants/:id`  
**Auth requis :** Oui

Modifie les informations d'un participant.

**Request (tous champs optionnels) :**
```json
{
  "email": "newemail@example.com",
  "phone": "+221 77 111 22 33",
  "organization": "Nouvelle organisation",
  "function": "Nouvelle fonction"
}
```

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-participant-1",
    "email": "newemail@example.com",
    "phone": "+221 77 111 22 33",
    "organization": "Nouvelle organisation",
    "function": "Nouvelle fonction",
    "updatedAt": "2025-12-13T15:30:00Z"
  },
  "message": "Participant modifié avec succès"
}
```

---

### 4.5 Supprimer un participant

**Endpoint :** `DELETE /participants/:id`  
**Auth requis :** Oui (admin uniquement)

Supprime un participant et toutes ses présences associées.

**Response Success (200) :**
```json
{
  "success": true,
  "message": "Participant supprimé avec succès"
}
```

**Warning :** Cette action supprime également toutes les présences liées.

---

## ✅ 5. PRÉSENCES (ATTENDANCES)

### 5.1 Liste des présences

**Endpoint :** `GET /attendances`  
**Auth requis :** Oui

Récupère la liste paginée des présences avec filtres avancés.

**Query Parameters :**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| page | integer | 1 | Numéro de page |
| limit | integer | 50 | Nombre d'éléments par page |
| eventId | uuid | - | Filtrer par événement |
| participantId | uuid | - | Filtrer par participant |
| checkInFrom | datetime | - | Date/heure pointage minimum |
| checkInTo | datetime | - | Date/heure pointage maximum |
| hasSignature | boolean | - | Filtrer présences avec/sans signature |
| checkInMode | string | - | Filtrer par mode (qr_code, manual, import) |
| sortBy | string | checkInTime | Champ de tri |
| sortOrder | string | DESC | Ordre de tri |

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-attendance-1",
        "event": {
          "id": "uuid-event-1",
          "title": "Atelier SIGIF - Interfaces NINEA",
          "eventType": "workshop",
          "startDate": "2025-12-15T09:00:00Z"
        },
        "participant": {
          "id": "uuid-participant-1",
          "fullName": "Abdoulaye Fall",
          "function": "Chef de Service Informatique",
          "organization": "Direction Générale des Impôts",
          "email": "afall@finances.gouv.sn",
          "phone": "+221 77 123 45 67"
        },
        "checkInTime": "2025-12-15T09:15:00Z",
        "checkInMode": "qr_code",
        "hasSignature": true,
        "signatureFormat": "png",
        "ipAddress": "41.82.156.10",
        "createdAt": "2025-12-15T09:15:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 50,
      "total": 234,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

**Exemple :**
```bash
GET /api/attendances?eventId=uuid-event-1&hasSignature=true&page=1&limit=50
```

---

### 5.2 Enregistrer une présence

**Endpoint :** `POST /attendances`  
**Auth requis :** Non (endpoint public pour les participants)

Enregistre une présence avec signature numérique (utilisé par le formulaire participant).

**Request :**
```json
{
  "eventId": "uuid-event-1",
  "participant": {
    "firstName": "Abdoulaye",
    "lastName": "Fall",
    "function": "Chef de Service Informatique",
    "cniNumber": "CNI1234567890",
    "originLocality": "Dakar",
    "email": "afall@finances.gouv.sn",
    "phone": "+221 77 123 45 67",
    "organization": "Direction Générale des Impôts"
  },
  "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "notes": ""
}
```

**Validation Rules :**
- `eventId` : requis, UUID valide, événement doit exister et être actif
- `participant` : requis, objet conforme aux règles de validation participant
- `signature` : requis, base64 PNG/JPEG, format `data:image/(png|jpeg);base64,`, taille max 100KB
- `notes` : optionnel, max 500 caractères

**Comportement :**
- Si le participant existe (via CNI ou email), met à jour ses informations
- Si le participant n'existe pas, le crée automatiquement
- Empêche les doublons (un participant = une présence par événement)

**Response Success (201) :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-attendance-new",
    "eventId": "uuid-event-1",
    "participantId": "uuid-participant-1",
    "checkInTime": "2025-12-15T09:15:23Z",
    "checkInMode": "qr_code",
    "hasSignature": true
  },
  "message": "Présence enregistrée avec succès"
}
```

**Response Error (409) - Déjà pointé :**
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_CHECKED_IN",
    "message": "Vous avez déjà pointé pour cet événement",
    "details": {
      "checkInTime": "2025-12-15T09:10:00Z"
    }
  }
}
```

**Response Error (400) - Événement invalide :**
```json
{
  "success": false,
  "error": {
    "code": "EVENT_NOT_FOUND",
    "message": "L'événement spécifié n'existe pas"
  }
}
```

**Response Error (400) - Événement annulé :**
```json
{
  "success": false,
  "error": {
    "code": "EVENT_CANCELLED",
    "message": "Cet événement a été annulé"
  }
}
```

**Response Error (413) - Signature trop grande :**
```json
{
  "success": false,
  "error": {
    "code": "SIGNATURE_TOO_LARGE",
    "message": "La signature dépasse la taille maximale autorisée (100KB)"
  }
}
```

**Response Error (400) - Format signature invalide :**
```json
{
  "success": false,
  "error": {
    "code": "SIGNATURE_INVALID_FORMAT",
    "message": "Format de signature invalide. PNG ou JPEG base64 attendu."
  }
}
```

---

### 5.3 Détails d'une présence

**Endpoint :** `GET /attendances/:id`  
**Auth requis :** Oui

Récupère les détails complets d'une présence, incluant la signature.

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "id": "uuid-attendance-1",
    "event": {
      "id": "uuid-event-1",
      "title": "Atelier SIGIF - Interfaces NINEA",
      "eventType": "workshop",
      "startDate": "2025-12-15T09:00:00Z",
      "location": "Salle de conférence DTAI"
    },
    "participant": {
      "id": "uuid-participant-1",
      "fullName": "Abdoulaye Fall",
      "function": "Chef de Service Informatique",
      "cniNumber": "CNI1234567890",
      "organization": "Direction Générale des Impôts",
      "email": "afall@finances.gouv.sn",
      "phone": "+221 77 123 45 67"
    },
    "checkInTime": "2025-12-15T09:15:23Z",
    "checkInMode": "qr_code",
    "signatureData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "signatureFormat": "png",
    "ipAddress": "41.82.156.10",
    "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)...",
    "notes": "",
    "createdAt": "2025-12-15T09:15:23Z",
    "updatedAt": "2025-12-15T09:15:23Z"
  }
}
```

---

### 5.4 Récupérer la signature

**Endpoint :** `GET /attendances/:id/signature`  
**Auth requis :** Oui

Récupère uniquement la signature d'une présence.

**Option 1 - Format JSON :**
```json
{
  "success": true,
  "data": {
    "signatureData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "signatureFormat": "png"
  }
}
```

**Option 2 - Image directe (si Accept: image/png) :**
Response Headers:
Content-Type: image/png
Content-Disposition: inline; filename="signature-uuid-attendance-1.png"
Body: Binary image data
---

### 5.5 Supprimer une présence

**Endpoint :** `DELETE /attendances/:id`  
**Auth requis :** Oui (admin uniquement)

Supprime une présence.

**Response Success (200) :**
```json
{
  "success": true,
  "message": "Présence supprimée avec succès"
}
```

---

### 5.6 Présences d'un événement

**Endpoint :** `GET /events/:eventId/attendances`  
**Auth requis :** Oui

Récupère toutes les présences pour un événement spécifique.

**Query Parameters :**
- `page` : integer (défaut: 1)
- `limit` : integer (défaut: 100)
- `hasSignature` : boolean
- `sortBy` : string (défaut: checkInTime)
- `sortOrder` : string (défaut: ASC)

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "uuid-event-1",
      "title": "Atelier SIGIF - Interfaces NINEA",
      "startDate": "2025-12-15T09:00:00Z"
    },
    "items": [
      {
        "id": "uuid-attendance-1",
        "participant": {
          "id": "uuid-participant-1",
          "fullName": "Abdoulaye Fall",
          "function": "Chef de Service Informatique",
          "organization": "Direction Générale des Impôts",
          "email": "afall@finances.gouv.sn",
          "phone": "+221 77 123 45 67",
          "cniNumber": "CNI1234567890"
        },
        "checkInTime": "2025-12-15T09:15:00Z",
        "hasSignature": true
      }
    ],
    "meta": {
      "page": 1,
      "limit": 100,
      "total": 23,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "stats": {
      "total": 23,
      "withSignature": 21,
      "withoutSignature": 2,
      "signatureRate": 91.30
    }
  }
}
```

---

## 📊 6. EXPORTS

### 6.1 Export Excel

**Endpoint :** `GET /exports/attendances/excel`  
**Auth requis :** Oui

Exporte les présences au format Excel (.xlsx).

**Query Parameters :**

| Paramètre | Type | Description |
|-----------|------|-------------|
| eventId | uuid | Filtrer par événement (optionnel) |
| startDate | date | Date minimum (format: YYYY-MM-DD) |
| endDate | date | Date maximum (format: YYYY-MM-DD) |
| includeSignatures | boolean | Inclure les signatures (défaut: false) |

**Response Success (200) :**

Response Headers:
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="presences-SIGIF-2025-12-15.xlsx"
Body: Binary Excel file

**Structure du fichier :**
- **Feuille 1** : Liste des présences
  - Colonnes : N°, Nom, Prénom, Fonction, CNI, Localité, Organisation, Email, Téléphone, Événement, Type, Date Événement, Date Pointage, Mode Pointage, Signature (Oui/Non)

**Exemple :**
```bash
GET /api/exports/attendances/excel?eventId=uuid-event-1&includeSignatures=false
```

---

### 6.2 Export CSV

**Endpoint :** `GET /exports/attendances/csv`  
**Auth requis :** Oui

Exporte les présences au format CSV.

**Query Parameters :**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| eventId | uuid | - | Filtrer par événement |
| startDate | date | - | Date minimum |
| endDate | date | - | Date maximum |
| delimiter | string | ; | Séparateur (;, ,, \t) |
| encoding | string | UTF-8 | Encodage (UTF-8, ISO-8859-1) |

**Response Success (200) :**

Response Headers:
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="presences-SIGIF-2025-12-15.csv"
Body:
Nom;Prénom;Fonction;CNI;Localité;Organisation;Email;Téléphone;Événement;Type;Date Événement;Date Pointage
Fall;Abdoulaye;Chef de Service;CNI1234567890;Dakar;DGI;afall@finances.gouv.sn;+221 77 123 45 67;Atelier SIGIF;workshop;2025-12-15;2025-12-15 09:15

**Exemple :**
```bash
GET /api/exports/attendances/csv?eventId=uuid-event-1&delimiter=,&encoding=UTF-8
```

---

### 6.3 Export PDF (Feuille de présence)

**Endpoint :** `GET /exports/attendances/pdf`  
**Auth requis :** Oui

Exporte une feuille de présence formelle au format PDF.

**Query Parameters :**

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| eventId | uuid | Oui | ID de l'événement |
| includeSignatures | boolean | Non | Inclure les images de signatures (défaut: true) |
| layout | string | Non | Orientation (portrait, landscape) (défaut: portrait) |

**Response Success (200) :**
Response Headers:
Content-Type: application/pdf
Content-Disposition: attachment; filename="feuille-presence-Atelier-SIGIF-2025-12-15.pdf"
Body: Binary PDF file

**Structure du PDF :**

**Exemple :**
```bash
GET /api/exports/attendances/pdf?eventId=uuid-event-1&includeSignatures=true&layout=portrait
```

---

### 6.4 Export Statistiques Excel

**Endpoint :** `GET /exports/statistics/excel`  
**Auth requis :** Oui

Exporte les statistiques globales au format Excel multi-feuilles.

**Query Parameters :**

| Paramètre | Type | Description |
|-----------|------|-------------|
| startDate | date | Date minimum (YYYY-MM-DD) |
| endDate | date | Date maximum (YYYY-MM-DD) |
| groupBy | string | Groupement (event, organization, month) |

**Response Success (200) :**

Response Headers:
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="statistiques-SIGIF-2025.xlsx"
Body: Binary Excel file

**Structure du fichier :**
- **Feuille 1** : Statistiques par événement
- **Feuille 2** : Statistiques par organisation
- **Feuille 3** : Statistiques par période

**Exemple :**
```bash
GET /api/exports/statistics/excel?startDate=2025-01-01&endDate=2025-12-31&groupBy=event
```

---

## 📈 7. STATISTIQUES

### 7.1 Dashboard global

**Endpoint :** `GET /statistics/dashboard`  
**Auth requis :** Oui

Récupère les statistiques globales pour le tableau de bord administrateur.

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "events": {
      "upcoming": 5,
      "ongoing": 2,
      "completed": 45,
      "cancelled": 3,
      "total": 55
    },
    "participants": {
      "total": 234,
      "newThisMonth": 18,
      "activeThisMonth": 89
    },
    "attendances": {
      "today": 12,
      "thisWeek": 67,
      "thisMonth": 234,
      "total": 1567
    },
    "signatures": {
      "total": 1489,
      "rate": 94.98
    },
    "topOrganizations": [
      {
        "name": "DTAI - Ministère des Finances",
        "participantCount": 45,
        "attendanceCount": 234
      },
      {
        "name": "Direction Générale des Impôts",
        "participantCount": 38,
        "attendanceCount": 189
      },
      {
        "name": "Direction du Budget",
        "participantCount": 28,
        "attendanceCount": 145
      }
    ],
    "recentActivity": [
      {
        "type": "attendance",
        "participantName": "Abdoulaye Fall",
        "eventTitle": "Atelier SIGIF - Interfaces NINEA",
        "timestamp": "2025-12-15T09:15:00Z"
      },
      {
        "type": "event_created",
        "eventTitle": "Comité de Pilotage Q4",
        "createdBy": "Mamadou Diop",
        "timestamp": "2025-12-14T14:30:00Z"
      }
    ]
  }
}
```

---

### 7.2 Statistiques d'un événement

**Endpoint :** `GET /statistics/events/:eventId`  
**Auth requis :** Oui

Récupère les statistiques détaillées d'un événement spécifique.

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "uuid-event-1",
      "title": "Atelier SIGIF - Interfaces NINEA",
      "startDate": "2025-12-15T09:00:00Z",
      "endDate": "2025-12-15T17:00:00Z"
    },
    "attendance": {
      "total": 23,
      "withSignature": 21,
      "withoutSignature": 2,
      "signatureRate": 91.30,
      "firstCheckIn": "2025-12-15T08:55:00Z",
      "lastCheckIn": "2025-12-15T10:30:00Z",
      "averageCheckInTime": "2025-12-15T09:12:00Z"
    },
    "checkInTimeline": [
      {
        "hour": "08:00",
        "count": 2
      },
      {
        "hour": "09:00",
        "count": 15
      },
      {
        "hour": "10:00",
        "count": 6
      }
    ],
    "byOrganization": [
      {
        "organization": "DTAI - Ministère des Finances",
        "count": 8,
        "percentage": 34.78
      },
      {
        "organization": "Direction Générale des Impôts",
        "count": 6,
        "percentage": 26.09
      },
      {
        "organization": "Direction du Budget",
        "count": 4,
        "percentage": 17.39
      }
    ],
    "byFunction": [
      {
        "function": "Développeur",
        "count": 5
      },
      {
        "function": "Chef de Service",
        "count": 4
      },
      {
        "function": "Analyste",
        "count": 3
      }
    ]
  }
}
```

---

### 7.3 Statistiques par organisation

**Endpoint :** `GET /statistics/organizations`  
**Auth requis :** Oui

Récupère les statistiques de participation par organisation.

**Query Parameters :**
- `startDate` : date (YYYY-MM-DD)
- `endDate` : date (YYYY-MM-DD)
- `limit` : integer (défaut: 20)

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "organization": "DTAI - Ministère des Finances",
        "participantCount": 45,
        "attendanceCount": 234,
        "eventsAttended": 28,
        "averageAttendancePerEvent": 8.36,
        "lastAttendance": "2025-12-15T09:15:00Z",
        "topParticipants": [
          {
            "fullName": "Aïssatou Ndiaye",
            "attendanceCount": 24
          }
        ]
      },
      {
        "organization": "Direction Générale des Impôts",
        "participantCount": 38,
        "attendanceCount": 189,
        "eventsAttended": 22,
        "averageAttendancePerEvent": 8.59,
        "lastAttendance": "2025-12-15T09:10:00Z"
      }
    ],
    "meta": {
      "total": 15,
      "period": {
        "start": "2025-01-01",
        "end": "2025-12-31"
      }
    }
  }
}
```

**Exemple :**
```bash
GET /api/statistics/organizations?startDate=2025-01-01&endDate=2025-12-31&limit=10
```

---

### 7.4 Tendances temporelles

**Endpoint :** `GET /statistics/trends`  
**Auth requis :** Oui

Récupère l'évolution d'une métrique sur une période donnée.

**Query Parameters :**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| startDate | date | - | Date minimum (YYYY-MM-DD) |
| endDate | date | - | Date maximum (YYYY-MM-DD) |
| groupBy | string | month | Groupement (day, week, month) |
| metric | string | attendances | Métrique (attendances, events, participants) |

**Response Success (200) :**
```json
{
  "success": true,
  "data": {
    "metric": "attendances",
    "groupBy": "month",
    "period": {
      "start": "2025-01-01",
      "end": "2025-12-31"
    },
    "data": [
      {
        "period": "2025-01",
        "label": "Janvier 2025",
        "value": 145
      },
      {
        "period": "2025-02",
        "label": "Février 2025",
        "value": 178
      },
      {
        "period": "2025-03",
        "label": "Mars 2025",
        "value": 203
      },
      {
        "period": "2025-04",
        "label": "Avril 2025",
        "value": 189
      }
    ],
    "summary": {
      "total": 1567,
      "average": 130.58,
      "min": 89,
      "max": 234
    }
  }
}
```

**Exemple :**
```bash
GET /api/statistics/trends?startDate=2025-01-01&endDate=2025-12-31&groupBy=month&metric=attendances
```

---

## 🔲 8. QR CODES

### 8.1 Générer un QR code

**Endpoint :** `GET /qr-codes/generate/:eventId`  
**Auth requis :** Oui

Génère ou régénère le QR code pour un événement.

**Query Parameters :**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| format | string | png | Format de sortie (png, svg) |
| size | integer | 512 | Taille en pixels (256, 512, 1024) |

**Response Success (200) - Format JSON :**
```json
{
  "success": true,
  "data": {
    "eventId": "uuid-event-1",
    "url": "https://pointage.sigif.gouv.sn/e/A7KP2M?t=1734245400&s=abc123def456",
    "qrCodeBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "format": "png",
    "size": 512,
    "expiresAt": "2025-12-16T17:00:00Z"
  }
}
```

**Response Success (200) - Image directe (si Accept: image/png) :**
Response Headers:
Content-Type: image/png
Content-Disposition: inline; filename="qrcode-event-A7KP2M.png"
Body: Binary QR code image

**Exemple :**
```bash
GET /api/qr-codes/generate/uuid-event-1?format=png&size=512
```

---

### 8.2 Valider un QR code

**Endpoint :** `POST /qr-codes/validate`  
**Auth requis :** Non (endpoint public)

Valide l'authenticité et la validité d'un QR code.

**Request :**
```json
{
  "shortCode": "A7KP2M",
  "timestamp": 1734245400,
  "signature": "abc123def456"
}
```

**Response Success (200) - Valide :**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "eventId": "uuid-event-1",
    "eventTitle": "Atelier SIGIF - Interfaces NINEA",
    "expiresAt": "2025-12-16T17:00:00Z",
    "remainingHours": 18.5
  }
}
```

**Response Success (200) - Invalide :**
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "reason": "SIGNATURE_MISMATCH"
  }
}
```

**Raisons d'invalidité possibles :**
- `SIGNATURE_MISMATCH` : Signature HMAC incorrecte
- `EXPIRED` : QR code expiré
- `EVENT_NOT_FOUND` : Événement introuvable
- `INVALID_FORMAT` : Format de QR code incorrect

---

## ❌ CODES D'ERREUR

### Codes HTTP Standards

| Code | Nom | Utilisation |
|------|-----|-------------|
| 200 | OK | Requête réussie (GET, PATCH, DELETE) |
| 201 | Created | Ressource créée avec succès (POST) |
| 400 | Bad Request | Validation échouée, paramètres invalides |
| 401 | Unauthorized | Non authentifié (token manquant/invalide) |
| 403 | Forbidden | Non autorisé (droits insuffisants) |
| 404 | Not Found | Ressource introuvable |
| 409 | Conflict | Conflit (doublon, contrainte unique violée) |
| 413 | Payload Too Large | Fichier/signature trop volumineux |
| 422 | Unprocessable Entity | Validation métier échouée |
| 429 | Too Many Requests | Rate limiting dépassé |
| 500 | Internal Server Error | Erreur serveur interne |

Codes d'Erreur Métier
Authentification
INVALID_CREDENTIALS        Email ou mot de passe incorrect
TOKEN_EXPIRED              Token JWT expiré
TOKEN_INVALID              Token JWT invalide
ACCOUNT_DISABLED           Compte utilisateur désactivé
UNAUTHORIZED_ACTION        Action non autorisée
Événements
EVENT_NOT_FOUND            Événement introuvable
EVENT_ALREADY_STARTED      Événement déjà commencé (modification impossible)
EVENT_CANCELLED            Événement annulé
INVALID_QR_CODE            QR code invalide
QR_CODE_EXPIRED            QR code expiré
INVALID_DATE_RANGE         Plage de dates invalide
Présences
ALREADY_CHECKED_IN         Participant déjà pointé pour cet événement
EVENT_NOT_ACTIVE           Événement non actif (annulé ou terminé)
SIGNATURE_TOO_LARGE        Signature dépasse 100KB
SIGNATURE_INVALID_FORMAT   Format de signature invalide
ATTENDANCE_NOT_FOUND       Présence introuvable
Participants
PARTICIPANT_NOT_FOUND      Participant introuvable
CNI_ALREADY_EXISTS         Numéro CNI déjà utilisé
EMAIL_ALREADY_EXISTS       Email déjà utilisé
INVALID_CNI_FORMAT         Format CNI invalide
INVALID_PHONE_FORMAT       Format téléphone invalide
INVALID_EMAIL_FORMAT       Format email invalide
Utilisateurs
USER_NOT_FOUND             Utilisateur introuvable
EMAIL_ALREADY_EXISTS       Email déjà utilisé
WEAK_PASSWORD              Mot de passe trop faible
CURRENT_PASSWORD_INCORRECT Mot de passe actuel incorrect
CANNOT_DELETE_OWN_ACCOUNT  Impossible de supprimer son propre compte
Général
VALIDATION_ERROR           Erreur de validation des données
UNAUTHORIZED_ACTION        Action non autorisée pour ce rôle
RESOURCE_NOT_FOUND         Ressource introuvable
RATE_LIMIT_EXCEEDED        Trop de requêtes
INTERNAL_SERVER_ERROR      Erreur serveur interne
DATABASE_ERROR             Erreur base de données

💡 EXEMPLES D'UTILISATION
Exemple 1 : Flux complet de pointage participant
bash# 1. Participant scanne le QR code et accède à l'URL
# URL: https://pointage.sigif.gouv.sn/e/A7KP2M?t=1734245400&s=abc123

# 2. Frontend récupère les infos de l'événement
GET /api/events/by-code/A7KP2M?t=1734245400&s=abc123

# 3. Participant remplit le formulaire et signe

# 4. Enregistrement de la présence
POST /api/attendances
Content-Type: application/json

{
  "eventId": "uuid-event-1",
  "participant": {
    "firstName": "Abdoulaye",
    "lastName": "Fall",
    "function": "Chef de Service Informatique",
    "cniNumber": "CNI1234567890",
    "email": "afall@finances.gouv.sn",
    "phone": "+221 77 123 45 67",
    "organization": "Direction Générale des Impôts"
  },
  "signature": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}

# 5. Confirmation affichée au participant

Exemple 2 : Flux administrateur - Création événement
bash# 1. Connexion
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@sigif.gouv.sn",
  "password": "Admin@2025!"
}

# Response: { "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }

# 2. Créer un événement
POST /api/events
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Atelier SIGIF - Interfaces NINEA",
  "eventType": "workshop",
  "startDate": "2025-12-20T09:00:00Z",
  "endDate": "2025-12-20T17:00:00Z",
  "location": "Salle de conférence DTAI"
}

# Response: { "id": "uuid-new-event", "qrCodeData": "https://..." }

# 3. Télécharger le QR code
GET /api/qr-codes/generate/uuid-new-event?format=png&size=1024
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Exemple 3 : Export feuille de présence PDF
bash# Connexion
POST /api/auth/login
{
  "email": "admin@sigif.gouv.sn",
  "password": "Admin@2025!"
}

# Export PDF avec signatures
GET /api/exports/attendances/pdf?eventId=uuid-event-1&includeSignatures=true&layout=portrait
Authorization: Bearer {token}

# Téléchargement: feuille-presence-Atelier-SIGIF-2025-12-20.pdf

Exemple 4 : Statistiques tableau de bord
bash# Récupérer les stats globales
GET /api/statistics/dashboard
Authorization: Bearer {token}

# Stats d'un événement spécifique
GET /api/statistics/events/uuid-event-1
Authorization: Bearer {token}

# Tendances mensuelles
GET /api/statistics/trends?startDate=2025-01-01&endDate=2025-12-31&groupBy=month&metric=attendances
Authorization: Bearer {token}
```

---

## 📝 NOTES IMPORTANTES

### Rate Limiting

Par défaut, les endpoints sont limités à :
- **Authentifiés** : 100 requêtes / minute
- **Public (pointage)** : 10 requêtes / minute par IP

Dépassement → `429 Too Many Requests`

### Taille des requêtes

- **Body JSON** : max 1MB
- **Signature** : max 100KB (base64)
- **Uploads** : non supporté (uniquement base64 inline)

### Formats de dates

Toutes les dates doivent être au format **ISO 8601** :
```
2025-12-15T09:00:00Z
Sécurité

Toutes les API en production utilisent HTTPS obligatoire
Les tokens JWT expirent après 24 heures
Les QR codes expirent après 24-48 heures (configurable)
Les mots de passe doivent respecter : min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial


📞 SUPPORT
Documentation technique complète : https://docs.pointage.sigif.gouv.sn
Support technique : support@dtai.gouv.sn
Version API : 1.0.0
Dernière mise à jour : Décembre 2025