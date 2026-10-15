/**
 * Molécule « sélecteur de choix » : champ cliquable qui ouvre un panneau de
 * valeurs, dans le vocabulaire visuel du sélecteur d'heure et du calendrier
 * (famille `.daterange__*` + atome `.cellule-choix`).
 *
 * <p>Un `<select>` natif ne ressemble à rien d'autre dans l'application, et sa
 * liste déroulante est celle du système d'exploitation — non stylable. Cette
 * molécule rend le même service avec l'apparence maison : libellé au-dessus,
 * valeur courante affichée en permanence, soulignement animé à l'ouverture,
 * et un `<button class="cellule-choix">` par entrée (remplissage orange du
 * centre vers les côtés, partagé avec les jours du calendrier).</p>
 *
 * <p>Générique : elle prend un libellé, une liste de `{ valeur, libelle }` et
 * un `surChangement`. Le sélecteur d'heure en est un cas particulier (deux
 * colonnes), mais son adaptation demanderait de tordre la molécule — il reste
 * donc écrit séparément, sur les mêmes classes.</p>
 */
import { creerElement } from '../core/dom.js';
import { creerPopover } from '../atomes/popover.js';

let compteurId = 0;

/**
 * Crée un sélecteur de choix.
 * @param {object} options - options de création.
 * @param {string} [options.libelle] - libellé affiché au-dessus du champ. Omis,
 *   aucun libellé n'est rendu et le champ ne réserve plus la place au-dessus de
 *   lui : c'est ce qu'il faut sur une ligne de liste, où la colonne voisine dit
 *   déjà ce que la valeur représente et où un libellé désalignerait le champ de
 *   ses voisins. Le rôle accessible est alors porté par `aria-label`, sans quoi
 *   le champ serait un bouton sans nom.
 * @param {string} [options.ariaLabel] - nom accessible du champ, utilisé
 *   uniquement quand `libelle` est absent (voir ci-dessus). Sans lui, le champ
 *   serait un bouton sans nom pour un lecteur d'écran.
 * @param {Array<{valeur: string, libelle: string}>} options.choix - les entrées.
 * @param {string} [options.valeurInitiale] - valeur sélectionnée au départ.
 * @param {Function} [options.surChangement] - appelé avec la valeur choisie.
 * @returns {{ element: HTMLElement, lire: Function, ecrire: Function,
 *   ouvrir: Function, fermer: Function }} la racine et ses pilotes.
 */
export function creerSelecteurChoix({
  libelle,
  ariaLabel,
  choix,
  valeurInitiale,
  surChangement,
}) {
  compteurId += 1;
  const idField = `selecteur-choix-field-${compteurId}`;

  const valueEl = creerElement('span', { classes: 'daterange__value' });
  const attributsField = { tabindex: '0', role: 'button' };
  // Sans libellé visible, le champ n'a plus de nom accessible : un lecteur
  // d'écran annoncerait « bouton » et la valeur, sans dire de quoi il s'agit.
  if (!libelle) attributsField['aria-label'] = ariaLabel || '';
  const field = creerElement('div', {
    classes: 'daterange__field',
    attributs: attributsField,
    enfants: [
      valueEl,
      creerElement('span', { classes: 'daterange__trigger', attributs: { 'aria-hidden': 'true' } }),
    ],
  });

  const entrees = choix.map((entree) => creerElement('button', {
    classes: 'selecteur-choix__entree cellule-choix',
    attributs: { type: 'button' },
    texte: entree.libelle,
  }));

  const contenu = creerElement('div', {
    classes: 'selecteur-choix',
    enfants: entrees,
  });

  // `element` (racine `.daterange`) est déclaré avant le popover pour que ses
  // callbacks puissent toggler `daterange--open` (qui anime l'underline et la
  // flèche) sur la racine. Il est assigné plus bas.
  let element;

  const popover = creerPopover({
    declencheur: field,
    contenu,
    surOuverture: () => element.classList.add('daterange--open'),
    surFermeture: () => element.classList.remove('daterange--open'),
  });

  element = creerElement('div', {
    classes: libelle ? 'daterange' : ['daterange', 'daterange--sans-libelle'],
    enfants: [
      libelle
        ? creerElement('label', {
          classes: 'daterange__label',
          attributs: { for: idField },
          texte: libelle,
        })
        : null,
      field,
      creerElement('span', { classes: 'daterange__underline' }),
      popover.element,
    ].filter(Boolean),
  });

  field.id = idField;

  let valeur = valeurInitiale || (choix[0] ? choix[0].valeur : '');

  function libelleDe(valeurCherchee) {
    const entree = choix.find((c) => c.valeur === valeurCherchee);
    return entree ? entree.libelle : '';
  }

  function mettreAJourValeur() {
    valueEl.textContent = libelleDe(valeur);
  }

  function marquerSelection() {
    entrees.forEach((bouton, index) => {
      bouton.classList.toggle('cellule-choix--active', choix[index].valeur === valeur);
    });
  }

  entrees.forEach((bouton, index) => {
    bouton.addEventListener('click', (evenement) => {
      // Le clic ne doit pas remonter jusqu'au déclencheur, qui rebasculerait
      // le panneau : il se refermerait puis se rouvrirait aussitôt.
      evenement.stopPropagation();
      valeur = choix[index].valeur;
      mettreAJourValeur();
      marquerSelection();
      // Le choix est fait, le panneau n'a plus rien à offrir : il se referme.
      // C'est ce qui distingue ce sélecteur du sélecteur d'heure, dont il
      // reprend le cadre — là-bas on choisit une heure PUIS une minute, le
      // panneau doit rester ouvert entre les deux.
      popover.fermer();
      if (surChangement) surChangement(valeur);
    });
  });

  function lire() {
    return valeur;
  }

  function ecrire(nouvelleValeur) {
    valeur = nouvelleValeur;
    mettreAJourValeur();
    marquerSelection();
  }

  function ouvrir() {
    marquerSelection();
    popover.ouvrir();
  }

  function fermer() {
    popover.fermer();
  }

  mettreAJourValeur();
  marquerSelection();

  return { element, lire, ecrire, ouvrir, fermer };
}
