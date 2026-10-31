# Centre-App — démo

Démo interactive d'une plateforme de gestion pour centre de soutien scolaire (cours supplémentaires) :
élèves, groupes, professeurs, frais de scolarité, impayés, salaires, charges et bénéfice.

La démo fonctionne **sans backend** : toutes les données sont fictives et générées dans le navigateur.

## Lancer en local

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # version de production dans dist/
```

Connexion : les identifiants sont pré-remplis, il suffit de cliquer sur « Se connecter ».

## Données de démonstration

Tout est relié, et chaque action se répercute sur les autres pages :

| Élément | Contenu |
| --- | --- |
| Succursales | 3 (Nord, Sud, Centre — Casablanca) |
| Professeurs | 8 (7 actifs), salaire fixe ou au pourcentage |
| Groupes | 15, **10 élèves chacun**, chacun rattaché à un professeur |
| Élèves | 86, inscrits dans 1 à 3 groupes |
| Comptabilité | paiements mensuels, impayés, salaires, charges et bénéfice calculés à partir des données |

Exemples : inscrire un élève l'ajoute à son groupe, augmente le salaire du professeur (s'il est au pourcentage)
et crée sa ligne dans les frais ; encaisser un mois impayé le retire des retards et met à jour le dashboard.

- Les dates suivent le calendrier réel : la démo est toujours « au mois en cours ».
- Les modifications sont gardées dans le navigateur du visiteur (localStorage) ; chaque visiteur a sa propre copie.
- **Réinitialiser** : menu du profil (en haut à droite) → « Réinitialiser la démo ».

## Personnaliser

| Quoi | Où |
| --- | --- |
| Nom, coordonnées, logo | `src/data/config.js` (+ `public/logo.svg`) |
| Profs, groupes, élèves, charges | `src/data/seed.js` |
| Niveaux, matières, cycles | `src/data/catalog.js` |
| Calculs (frais, salaires, bénéfice…) | `src/data/selectors.js` |

Après une modification de `seed.js`, cliquer sur « Réinitialiser la démo » pour recharger les données.

## Héberger la démo

Le site est statique (dossier `dist/`). Les fichiers de redirection pour le routage côté client sont déjà présents.

- **Vercel** : importer le dépôt GitHub (framework Vite détecté automatiquement). `vercel.json` gère les redirections.
- **Netlify** : importer le dépôt (build `npm run build`, dossier `dist`) ; `public/_redirects` gère les redirections.

Si l'application est dans un sous-dossier du dépôt, l'indiquer comme *Root Directory* (Vercel) ou *Base directory* (Netlify).

Aucune variable d'environnement n'est nécessaire pour la démo.
