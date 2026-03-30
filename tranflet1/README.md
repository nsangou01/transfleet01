# TRANSFLET — Système de Gestion de Flotte de Véhicules

> **TRANSIMEX S.A** · Zone UDEAC, Port de Douala, Cameroun  
> Projet de fin d'études — IUC Douala, Filière Génie Logiciel, 2026  
> Auteur : **NSANGOU NABILL MOHAMMED FEYSAL**

---

## ✅ État du projet

| Composant | Statut |
|-----------|--------|
| Frontend Angular 19 (build prod) | ✅ 0 erreur, 0 warning |
| Backend Node.js / Express | ✅ Complet |
| Base de données MySQL 8 | ✅ Schéma + seeds |
| Docker / Docker Compose | ✅ Stack complète |
| Nginx (reverse proxy + SPA) | ✅ Configuré |

---

## 🚀 Démarrage rapide

### Option 1 — Docker (recommandé, tout-en-un)
```bash
# Copier le fichier d'environnement
cp backend/.env.example backend/.env
# Éditez backend/.env avec vos vrais secrets JWT

# Lancer toute la stack
docker-compose up -d

# Application disponible sur http://localhost
# API sur http://localhost:5000/api
# Adminer (BDD) sur http://localhost:8080  (profil dev uniquement)
docker-compose --profile dev up -d
```

### Option 2 — Développement local

**Backend :**
```bash
cd backend
cp .env.example .env          # Remplir avec vos valeurs MySQL
npm install
npm run dev                   # http://localhost:5000

# Premier lancement : injecter le schéma et les données
mysql -u root -p transflet_db < ../database/01_schema.sql
mysql -u root -p transflet_db < ../database/02_seeds.sql
# OU via le seeder Node.js
node seeders/seed.js
```

**Frontend :**
```bash
cd frontend
npm install
npm start                     # http://localhost:4200
```

---

## 🔑 Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | admin@transimex.cm | password123 |
| Gestionnaire de flotte | manager@transimex.cm | password123 |
| Conducteur | jbnkomo@transimex.cm | password123 |
| Conducteur | pmbarga@transimex.cm | password123 |

---

## 📁 Structure du projet

```
transflet-project/
├── backend/                     # API REST Node.js
│   ├── app.js                   # Application Express
│   ├── server.js                # Point d'entrée
│   ├── config/database.js       # Connexion Sequelize/MySQL
│   ├── models/index.js          # Tous les modèles + associations
│   ├── controllers/
│   │   ├── auth.controller.js   # Login, me, change-password
│   │   ├── vehicle.controller.js
│   │   ├── driver.controller.js
│   │   ├── trip.controller.js
│   │   └── resource.controller.js  # Fuel, Maintenance, Notifications, Tracking, Reports
│   ├── middleware/
│   │   ├── auth.js              # JWT authenticate + requireRole
│   │   └── error.js             # Handler global d'erreurs
│   ├── routes/index.js          # Toutes les routes API
│   ├── seeders/seed.js          # Script de données initiales
│   ├── uploads/                 # Fichiers téléversés
│   ├── .env                     # Variables d'environnement (à personnaliser)
│   └── package.json
│
├── frontend/                    # Application Angular 19
│   ├── src/
│   │   ├── environments/        # Dev / Production (apiUrl)
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── models/index.ts        # Toutes les interfaces TypeScript
│   │   │   │   ├── services/
│   │   │   │   │   ├── auth.service.ts    # Authentification JWT
│   │   │   │   │   └── api.service.ts     # Client HTTP générique
│   │   │   │   ├── guards/auth.guard.ts   # authGuard, guestGuard, managerGuard
│   │   │   │   └── interceptors/jwt.interceptor.ts
│   │   │   ├── pages/
│   │   │   │   ├── login/                 # Page de connexion
│   │   │   │   ├── dashboard/             # KPIs + alertes maintenance
│   │   │   │   ├── vehicles/              # CRUD véhicules
│   │   │   │   ├── drivers/               # CRUD conducteurs
│   │   │   │   ├── trips/                 # Trajets : créer, démarrer, terminer, annuler
│   │   │   │   ├── fuel/                  # Ravitaillements carburant
│   │   │   │   ├── maintenance/           # Planification entretiens
│   │   │   │   ├── tracking/              # Positions GPS temps réel
│   │   │   │   ├── notifications/         # Alertes + envoi
│   │   │   │   ├── reports/               # Rapport carburant + export CSV
│   │   │   │   └── not-found/             # Page 404
│   │   │   └── shared/components/shell/   # Layout sidebar + topbar
│   │   └── styles.scss                    # Design System global
│   ├── dist/transflet/browser/            # Build production (prêt)
│   └── package.json
│
├── database/
│   ├── 01_schema.sql            # 8 tables MySQL avec FK et indexes
│   └── 02_seeds.sql             # Données initiales (users, véhicules, conducteurs…)
│
├── nginx/nginx.conf             # Reverse proxy + SPA routing
├── Dockerfile.frontend          # Build multi-stage Angular → Nginx
├── Dockerfile.backend           # Image Node.js production
├── docker-compose.yml           # Stack complète (db + backend + frontend + adminer)
└── README.md
```

---

## 🔌 API Endpoints

### Authentification
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth/login` | Connexion |
| GET | `/api/auth/me` | Profil courant |
| PUT | `/api/auth/profile` | Modifier profil |
| PUT | `/api/auth/change-password` | Changer mot de passe |

### Véhicules (manager uniquement)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/vehicles` | Liste avec filtres |
| POST | `/api/vehicles` | Créer |
| GET | `/api/vehicles/stats` | Statistiques |
| PUT | `/api/vehicles/:id` | Modifier |
| DELETE | `/api/vehicles/:id` | Supprimer |

### Conducteurs (manager uniquement)
`GET/POST/PUT/DELETE /api/drivers` + `/api/drivers/stats`

### Trajets
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/trips` | Liste (conducteur = ses propres trajets) |
| POST | `/api/trips` | Créer (manager) |
| POST | `/api/trips/:id/start` | Démarrer |
| POST | `/api/trips/:id/complete` | Terminer |
| POST | `/api/trips/:id/cancel` | Annuler |

### Carburant, Maintenance, Notifications, Tracking
Voir `backend/routes/index.js` pour la liste complète.

### Rapports
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/reports/dashboard` | KPIs tableau de bord |
| GET | `/api/reports/fuel` | Rapport carburant par véhicule |

---

## 🔒 Sécurité

- ✅ Authentification JWT (8h d'expiration)
- ✅ Mots de passe bcrypt (10 rounds)
- ✅ Contrôle d'accès par rôle (admin, manager, driver)
- ✅ Rate limiting (500 req/15min + 20 tentatives login/15min)
- ✅ Helmet.js (headers HTTP sécurisés)
- ✅ CORS configuré par domaine
- ✅ Route guards Angular côté frontend
- ✅ Intercepteur JWT automatique
- ✅ Variables sensibles dans `.env` (jamais dans le code)

---

## 🛠️ Stack technique complète

| Couche | Technologie |
|--------|-------------|
| Frontend | Angular 19.x (Standalone, Signals) |
| Styles | SCSS (Design System custom) |
| Langage | TypeScript 5.7 (strict) |
| HTTP Client | Angular HttpClient + intercepteur JWT |
| Backend | Node.js 20 + Express.js 4 |
| ORM | Sequelize 6 |
| Base de données | MySQL 8.0 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Sécurité | Helmet, express-rate-limit, CORS |
| Serveur web | Nginx 1.27 (reverse proxy + SPA) |
| Conteneurs | Docker + Docker Compose |
| Build outil | Angular CLI + esbuild |

---

*TRANSFLET v1.0 · TRANSIMEX S.A · IUC Douala · Mars 2026*
