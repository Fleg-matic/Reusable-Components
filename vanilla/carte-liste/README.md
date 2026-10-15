# Carte de liste réglable

Design seul — aucun JS, aucun branchement métier. Apparence d'une carte dans une liste
(coins arrondis, ombre intérieure colorée selon un état actif/inactif), pensée pour une ligne
qui se règle sur place (un interrupteur, un champ modifiable) plutôt qu'une simple ligne
d'affichage.

Extrait de `mecarungis/facturation-electronique` (cartes grossiste/compte), octobre 2026.

## Fichiers

| Fichier | Rôle |
|---|---|
| `carte-liste.css` | Base : bordure, coins arrondis. |
| `ligne-reglable.css` | Mise en page (colonne en mobile, ligne à partir de 640px) + l'ombre intérieure colorée selon l'état (`--actif`). |
| `variables.css` | Jetons de couleur utilisés — à fusionner avec ceux du projet consommateur. |

## Usage

```html
<div class="carte-liste ligne-reglable">
  <!-- contenu de la ligne -->
</div>
<div class="carte-liste ligne-reglable ligne-reglable--actif">
  <!-- variante active : ombre colorée en --couleur-marque au lieu de --couleur-inactif -->
</div>
```

L'espacement entre cartes (marge) est **volontairement absent** d'ici : c'est la responsabilité
du conteneur de liste (`gap` en flex/grid), jamais de la carte elle-même — en poser un des deux
côtés double l'espacement.

Le fond est également absent par choix : ces cartes laissent voir le fond de page derrière.
