# Altéris — Outil pour Dofus

Site statique auto-généré : simulateur de build (panoplies + stats), impact des patchs entre versions, routes de farm XP par élément et pistes kamas.

**Mise à jour automatique quotidienne** : un workflow GitHub Actions vérifie chaque jour la version du jeu (via l'API dofusdude), régénère `index.html` avec les nouvelles données, et pousse. Vercel (connecté en Git) redéploie sur push.

## Structure

```
app-template.html          # coquille de l'app (placeholders données/police)
build/
  capture.mjs              # récupère items, panoplies, bestiaire, zones -> data/*.json
  build.mjs                # injecte data + police + favicon -> index.html
data/                      # données générées (commitées : servent au diff entre versions)
assets/                    # police Titan One (base64), icône SVG, apple-touch-icon
index.html                 # sortie servie par Vercel (générée)
.github/workflows/daily-update.yml
```

## Mise en route (une fois)

1. **Créer le repo GitHub** et pousser ce dossier :
   ```bash
   git init && git add -A && git commit -m "Altéris"
   git branch -M main
   git remote add origin git@github.com:TON_USER/alteris.git
   git push -u origin main
   ```
2. **Connecter Vercel en Git** : vercel.com/new → *Import Git Repository* → `alteris` → Deploy.
   (Ou relie le repo au projet Vercel existant : Project → Settings → Git.)
   - Framework : *Other*. Build Command : `node build/build.mjs`. Output : `.`
3. C'est tout. Le cron tourne chaque jour à 06:00 UTC (modifiable dans le workflow) ; tu peux aussi le lancer à la main : onglet **Actions** → *Mise à jour quotidienne Dofus* → *Run workflow*.

## Comment marche le diff « impact des patchs »

- `capture.mjs` lit la version main précédente (dans `data/version.json` + `data/snapshot.json`).
- Si la version a **changé** → diff patch réel (précédente → live).
- Sinon → **aperçu de la beta** (live → à venir), pour que l'accueil ne soit jamais vide.

## Local

```bash
npm run build   # capture + génère index.html
# puis ouvrir index.html via un petit serveur (les data sont inline, un simple ouvrir suffit)
```

## Sources de données

- [dofusdude](https://docs.dofusdu.de/) — items, panoplies, version (auto-update par patch).
- [DofusDB](https://api.dofusdb.fr/) — bestiaire (résistances/XP) et sous-zones. Licence non-commerciale.
- Pistes kamas : sourcées communautairement (N-Gamz, MMOKB, geneka.net), zones réelles DofusDB.

Dofus™ est une marque d'Ankama. Ce projet est un fan-tool non affilié.
