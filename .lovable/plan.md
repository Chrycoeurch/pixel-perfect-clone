# Plan d'implémentation — FANISA Web Pro

Système de gestion administrative, financière et patrimoniale du Fokontany (Toamasina). Le cahier des charges couvre 4 piliers + dashboard + exports. C'est trop pour un seul build : on procède par phases livrables, chacune testable de bout en bout.

## Stack retenue (adaptée à Lovable)

- **Frontend** : React + TanStack Start (déjà en place), Tailwind v4, shadcn/ui — responsive tablette/PC.
- **Backend** : Lovable Cloud (PostgreSQL + Auth + Storage + Edge functions). Remplace Django/Node du cahier des charges — équivalent fonctionnel, zéro setup.
- **Carto SIG** : MapLibre GL JS (open-source, pas de clé). PostGIS via extension Postgres pour les requêtes géo.
- **PDF & QR** : génération côté serveur (pdf-lib + qrcode) dans des server functions.
- **Auth & rôles** : table `user_roles` séparée (admin, agent, président), policies RLS.

## Phases livrables

### Phase 0 — Fondations (1 livraison)
- Activer Lovable Cloud.
- Design system FANISA (palette institutionnelle Madagascar : vert/blanc/rouge sobre, typographie lisible tablette).
- Layout principal : sidebar navigation 4 piliers + dashboard, topbar (utilisateur, recherche globale, notifications).
- Auth (email + magic link), table `user_roles`, route `/login`, layout `_authenticated`.
- Page d'accueil dashboard vide avec cartes-placeholders des KPIs.

### Phase 1 — Pilier 2 : Administration & E-Gouvernance (cœur métier)
Pourquoi en premier : c'est la base de données citoyenne dont dépendent tous les autres piliers.
- Tables : `households` (foyers), `citizens` (membres, identité, santé, diplômes), `documents_issued` (journal).
- CRUD foyers + dossier individuel 360° (onglets : identité, santé, éducation, historique documents).
- Générateur d'actes : certificats résidence/vie/bonne conduite, naissance, vente. Templates PDF + données pré-remplies.
- QR Code unique sur chaque PDF → route publique `/verify/:code` qui affiche l'authenticité.
- Historique immuable : pas de DELETE, statut `cancelled` + motif obligatoire.

### Phase 2 — Pilier 1 : SIG & Cartographie
- Champ `location geography(Point)` sur `households`.
- Carte MapLibre avec marqueurs foyers cliquables → fiche.
- Code couleur selon alertes (précarité, santé, retard cotisation).
- Couches superposables : zones inondables, réseaux (uploadées en GeoJSON via storage).
- Filtres croisés (formulaire → requête PostGIS).

### Phase 3 — Pilier 3 : Finances & Gouvernance participative
- Tables : `contribution_campaigns`, `contributions`, `expenses`, `meetings`, `attendance`.
- Création de campagnes (zone / catégorie sociale).
- Suivi recettes/dépenses + graphiques.
- Upload PV réunions (PDF/images) dans Storage.
- Pointage QR : génération QR par réunion, scan via webcam (html5-qrcode) → enregistre présence.

### Phase 4 — Pilier 4 : Patrimoine
- Tables : `assets` (biens, photo, état, facture), `asset_loans` (prêts/locations).
- CRUD inventaire avec upload photo + facture.
- Workflow prêt : sortie, retour, montant encaissé → écriture liée dans `contributions`.

### Phase 5 — Dashboard & Recommandations
- KPIs temps réel : pyramide des âges, scolarisation, taux de recouvrement.
- Module recommandations (règles simples côté serveur) :
  - Alerte sanitaire : seuil de cas déclarés / quartier.
  - Alerte cyclone : checklist (arbres, canaux) sur foyers à risque.
  - Job matching : croise `citizens.skills` avec besoins déclarés.

### Phase 6 — Continuité & Exports (critique)
- Export manuel par module : Excel/CSV via server function.
- Export hebdomadaire auto : edge function planifiée → archive ZIP (dump DB + photos Storage) envoyée vers bucket Cloud + webhook serveur local optionnel.
- Vérification de l'historique immuable (audit log).

## Détails techniques

- **Sécurité** : RLS sur toutes les tables, rôles via `has_role()` security-definer. Données sensibles (NIC, santé) chiffrées au repos via pgcrypto ; AES-256 application-level pour champs ultra-sensibles si requis.
- **Signature numérique des actes** : clé Ed25519 stockée en secret, signature embarquée dans le PDF + vérifiable via la route `/verify/:code`.
- **PostGIS** : extension activée via migration ; index GIST sur `location`.
- **Responsive** : breakpoints orientés tablette 1024px (usage terrain).
- **Langue UI** : français (le cahier des charges est en français, contexte Toamasina).

## Ce que je propose pour la prochaine étape

Livrer la **Phase 0** : fondations + design system + auth + layout des 4 piliers (pages vides mais navigables). Ça permet de valider l'identité visuelle et la structure avant d'attaquer Phase 1 (Administration), qui est la plus volumineuse.

Validez ce plan (ou ajustez l'ordre des phases) et je démarre la Phase 0.
