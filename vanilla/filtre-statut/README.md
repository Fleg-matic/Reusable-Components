# Filtre à segments (curseur coulissant)

Design seul — aucun JS, aucun branchement métier. Barre de segments de largeur égale, sans
contour, avec un curseur qui coulisse en dessous du segment actif (dégradé orange translucide,
ombre portée sur les bords).

Extrait de `mecarungis/facturation-electronique` (filtre par statut de facture), octobre 2026.

## Fichiers

| Fichier | Rôle |
|---|---|
| `filtre-statut.css` | Toute l'apparence : barre, segments, curseur. |
| `variables.css` | Jetons de couleur utilisés — à fusionner avec ceux du projet consommateur. |

## Contrat CSS à respecter pour le piloter

Ce composant n'a plus son JS d'origine : à reconstruire, mais le contrat est simple, entièrement
porté par deux variables CSS et une classe :

- `--nb-segments` sur `.statut-filtre` : nombre de boutons (détermine la largeur de chaque
  segment et du curseur, `100% / nb-segments`).
- `--index-actif` sur `.statut-filtre` : index (0-based) du segment actif — le curseur se
  translate de `index-actif * 100%` (un multiple de sa propre largeur, pas besoin de connaître
  la largeur réelle en pixels).
- Classe `.statut-filtre__btn--actif` sur le bouton actif (purement sélectrice ici — le
  remplissage visuel vient entièrement du curseur, pas du bouton).

```html
<div class="statut-filtre" style="--nb-segments: 3; --index-actif: 1;">
  <span class="statut-filtre__curseur"></span>
  <button class="statut-filtre__btn">Tous</button>
  <button class="statut-filtre__btn statut-filtre__btn--actif">En cours</button>
  <button class="statut-filtre__btn">Terminés</button>
</div>
```

`.statut-filtre--invisible` (visibilité sans retirer l'espace du flux — utile pour un sous-filtre
qui n'a pas toujours de raison d'être affiché, sans faire sauter la mise en page en dessous).
