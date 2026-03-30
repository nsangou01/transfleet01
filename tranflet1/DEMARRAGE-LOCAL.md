# 🚀 Démarrage LOCAL sans Docker – TRANSFLET

## Prérequis à installer sur votre PC

| Logiciel | Version | Lien |
|----------|---------|------|
| Node.js  | v20 ou + | https://nodejs.org |
| MySQL    | v8.0     | https://dev.mysql.com/downloads/ |
| npm      | v10 ou + | (inclus avec Node.js) |

---

## ÉTAPE 1 – Préparer MySQL

### Ouvrir MySQL Workbench ou le terminal MySQL :

```sql
-- Créer la base de données
CREATE DATABASE transflet_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer l'utilisateur (optionnel, root marche aussi)
CREATE USER 'transflet_user'@'localhost' IDENTIFIED BY 'transflet_pass';
GRANT ALL PRIVILEGES ON transflet_db.* TO 'transflet_user'@'localhost';
FLUSH PRIVILEGES;
```

### Importer le schéma et les données :
```bash
mysql -u root -p transflet_db < database/01_schema.sql
mysql -u root -p transflet_db < database/02_seeds.sql
```

---

## ÉTAPE 2 – Démarrer le Backend

```bash
# Aller dans le dossier backend
cd transflet/backend

# Installer les dépendances
npm install

# Configurer la connexion MySQL (éditer le fichier .env)
# Changer DB_HOST=localhost et mettre votre mot de passe root
```

### Modifier le fichier `backend/.env` :
```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=transflet_db
DB_USER=root
DB_PASS=VOTRE_MOT_DE_PASSE_MYSQL

JWT_SECRET=transflet_dev_secret_2026
JWT_EXPIRES_IN=8h
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:4200
```

```bash
# Démarrer le serveur
npm run dev
```
✅ Backend disponible sur : **http://localhost:5000**
✅ Test : http://localhost:5000/api/health

---

## ÉTAPE 3 – Démarrer le Frontend

```bash
# Aller dans le dossier frontend
cd transflet/frontend

# Installer les dépendances
npm install

# Démarrer Angular
npm start
```
✅ Application disponible sur : **http://localhost:4200**

---

## 🎯 Résumé – 2 terminaux en parallèle

| Terminal 1 | Terminal 2 |
|------------|------------|
| `cd backend && npm run dev` | `cd frontend && npm start` |
| Port **5000** | Port **4200** |

**Accès direct au tableau de bord — aucun identifiant requis !**

---

## Si MySQL est sur XAMPP ou WAMP

Remplacer dans `.env` :
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=          ← laisser vide si pas de mot de passe XAMPP
```

