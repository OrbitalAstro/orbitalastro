# Comment démarrer OrbitalAstro en local

## Démarrage rapide (Windows)

- Double-cliquez sur `DEMARRER.bat` (ou exécutez `start_local.ps1`).
- Ou dans PowerShell :

```powershell
.\start_local.ps1
```

Le script :
- vérifie que Python et Node.js sont installés
- crée/active le virtualenv si nécessaire
- installe les dépendances si besoin
- démarre le backend (port 8000) et le frontend (port 3000)

## URLs

- Frontend : http://localhost:3000
- Backend API : http://localhost:8000
- Docs API : http://localhost:8000/docs

## Redémarrage propre

Si les ports `8000`/`3000` sont déjà pris, ou si le frontend “freeze” (port 3000 ouvert mais aucune réponse), lance :

```powershell
.\start_local.ps1 --restart
```

## Notes

- Le cache Next.js (`web/.next`) n’est nettoyé que lorsqu’on (re)démarre le frontend, pour éviter de casser un serveur déjà en cours.

