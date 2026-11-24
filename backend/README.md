# Backend Django — École Les Baobabs

API Django avec base SQLite, authentification par session et accès réservé aux comptes administrateurs (`is_staff`). Les données et les mots de passe restent sur le serveur; aucun mot de passe administrateur n'est inclus dans le code.

## Préparation (Windows PowerShell)

Depuis le dossier `backend` :

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Le serveur démarre sur `http://127.0.0.1:8000`. Le compte se crée avec `createsuperuser`; Django n'accepte pas les mots de passe faibles.

## Connexion depuis l'interface

L'authentification utilise les cookies de session Django et la protection CSRF. Depuis le navigateur, inclure `credentials: "include"` pour les requêtes.

1. `GET /api/auth/csrf/` — récupère `csrfToken` et initialise les cookies.
2. `POST /api/auth/login/` avec `{"username":"...", "password":"..."}` et l'en-tête `X-CSRFToken`.
3. `GET /api/auth/me/` vérifie la session en cours.
4. Appeler les routes `/api/` avec les cookies de session et le jeton CSRF pour les requêtes qui modifient des données.
5. `POST /api/auth/logout/` ferme la session (CSRF requis).

Les routes `/api/classes/`, `/api/students/`, `/api/teachers/` et `/api/subjects/` offrent les opérations CRUD Django REST Framework. Elles refusent les utilisateurs anonymes et les comptes non administrateurs. Les six niveaux initiaux (SIL à CM2) sont ajoutés lors des migrations.

Le frontend utilise ces routes pour demander une connexion à l'ouverture. En développement, Vite transmet automatiquement `/api/` au serveur Django sur `http://127.0.0.1:8000`.

Pour démarrer l'application :

1. Dans un terminal, démarrez Django avec `python manage.py runserver` depuis `backend`.
2. Dans un autre terminal, exécutez `npm run dev` depuis `frontend`.
3. Ouvrez l'adresse Vite indiquée dans le terminal, puis connectez-vous avec le nom d'utilisateur et le mot de passe du superutilisateur créé plus haut.

## Administration

L'interface Django Admin est disponible à `http://127.0.0.1:8000/admin/`.

## Configuration hors développement

En développement, une clé aléatoire éphémère est générée si `DJANGO_SECRET_KEY` n'est pas définie (les sessions existantes seront invalidées au redémarrage du serveur). Avant le déploiement, définir `DJANGO_DEBUG=false`, une clé `DJANGO_SECRET_KEY` longue et aléatoire, `DJANGO_ALLOWED_HOSTS`, `DJANGO_FRONTEND_ORIGINS` et `DJANGO_CSRF_TRUSTED_ORIGINS`. Les origines sont séparées par des virgules. En mode non-debug, les cookies deviennent sécurisés et les redirections HTTPS sont forcées. En production, servir l'API sous la même origine HTTPS que le frontend ou configurer un proxy inverse avec les réglages CORS/CSRF appropriés.

## Portée actuelle

L'écran de connexion du frontend est relié aux sessions Django et l'accès aux routes API est réservé aux administrateurs authentifiés. Les dossiers, matières, évaluations et notes de l'interface sont encore conservés dans l'état React en mémoire; ils ne sont pas encore synchronisés avec la base Django.
