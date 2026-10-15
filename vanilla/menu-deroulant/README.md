# Menu déroulant (champ + flèche animée)

Remplace un `<select>` natif par un champ cliquable : libellé flottant, valeur affichée en
permanence, soulignement animé à l'ouverture, flèche en CSS pur qui pivote (chevron, deux traits
de 2px) et change de couleur à l'ouverture. Un panneau flottant s'ouvre en dessous, avec une
liste de cellules cliquables (remplissage orange du centre vers les côtés).

Extrait de `mecarungis/facturation-electronique` (interface de rejeu), octobre 2026.

## Fichiers

| Fichier | Rôle |
|---|---|
| `selecteur-choix.js` | Le composant. `creerSelecteurChoix({ libelle, choix, valeurInitiale, surChangement })` → `{ element, lire, ecrire, ouvrir, fermer }`. |
| `popover.js` + `popover.css` | Panneau flottant générique (positionnement, animation de déroulé), dont dépend le menu. |
| `dom.js` | Un seul helper utilisé : `creerElement(balise, { classes, texte, attributs, enfants })`, création DOM anti-XSS (texte toujours posé en `textContent`). |
| `selecteur-choix.css` | Mise en page du panneau de choix (défilement si trop d'entrées). |
| `champ-declencheur.css` | Le champ + la flèche animée — c'est la pièce visuelle centrale. |
| `cellule-choix.css` | Apparence d'une entrée cliquable (remplissage au survol/sélection). |
| `variables.css` | Jetons de couleur/taille utilisés — à fusionner avec ceux du projet consommateur. |

## Pourquoi `.daterange__*`

Les classes CSS portent le préfixe `daterange` : le composant est né comme la base commune d'un
sélecteur de plage de dates, avant d'être généralisé en simple menu déroulant. Rien dans ces
classes n'est spécifique aux dates — le nom est resté pour ne pas avoir à retoucher
`selecteur-choix.js` en le recopiant. Renommer est possible si le nom gêne dans le nouveau
projet, à condition de renommer les deux côtés (JS + CSS) ensemble.

## Usage minimal

```js
import { creerSelecteurChoix } from './selecteur-choix.js';

const menu = creerSelecteurChoix({
  libelle: 'Statut',
  choix: [
    { valeur: 'actif', libelle: 'Actif' },
    { valeur: 'inactif', libelle: 'Inactif' },
  ],
  valeurInitiale: 'actif',
  surChangement: (valeur) => console.log('choisi :', valeur),
});

document.body.appendChild(menu.element);
```

Charger `variables.css`, `popover.css`, `champ-declencheur.css`, `cellule-choix.css` et
`selecteur-choix.css` (ordre indifférent, aucune règle ne dépend de l'ordre de chargement).

## Dépendances

Aucune — vanilla JS, aucun bundler requis, ES modules natifs. `popover.js` dépend de `dom.js`,
et c'est tout.
