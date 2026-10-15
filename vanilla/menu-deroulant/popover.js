/**
 * Atome « popover » : panneau flottant ancré à un déclencheur.
 * Sert de base au calendrier et au sélecteur d'heure (lot 4).
 * Réutilise `creerElement` de `core/dom.js` — point unique de création du DOM.
 * Les écouteurs globaux (`document`, `window`) sont posés à l'ouverture et
 * retirés à la fermeture : plusieurs popovers peuvent coexister sur la même page.
 */
import { creerElement } from '../core/dom.js';

// Doit rester synchronisé avec la durée de `popover-derouler` (popover.css,
// 0.2s) — même pattern que `DELAI_FERMETURE` dans carte-facture.js.
const DUREE_ANIMATION_MS = 200;

/**
 * Crée un popover ancré à un déclencheur.
 * @param {object} options - options de création.
 * @param {HTMLElement} options.declencheur - élément qui ouvre le popover.
 * @param {Node} options.contenu - nœud inséré dans le panneau.
 * @param {Function} [options.surFermeture] - appelé à chaque fermeture, quelle qu'en soit la cause.
 * @param {Function} [options.surOuverture] - appelé à chaque ouverture.
 * @param {string} [options.ancrage='gauche'] - bord du déclencheur sur lequel
 *   aligner le panneau : `'gauche'` (défaut, comportement historique du
 *   calendrier et du sélecteur d'heure) ou `'droite'` (le panneau apparaît
 *   collé au bord droit du déclencheur, ex. menu Paramètres).
 * @returns {{ element: HTMLElement, ouvrir: Function, fermer: Function, estOuvert: Function }}
 *   l'élément du panneau et ses commandes.
 */
export function creerPopover({ declencheur, contenu, surFermeture, surOuverture, ancrage = 'gauche' }) {
  const element = creerElement('div', {
    classes: 'popover',
    attributs: { hidden: true },
    enfants: [contenu],
  });

  declencheur.setAttribute('aria-haspopup', 'dialog');
  declencheur.setAttribute('aria-expanded', 'false');

  let ouvert = false;
  let minuteurFermeture = null;

  // Positionne le panneau (position: fixed) sous le déclencheur, avec un repli
  // s'il déborderait de la fenêtre. `getBoundingClientRect` renvoie des zéros en
  // jsdom (pas de vrai layout) : la fonction ne doit pas lever d'erreur pour autant.
  //
  // L'ancrage détermine le bord du déclencheur auquel le panneau s'aligne :
  // `'gauche'` (défaut) pose le bord gauche du panneau sur celui du déclencheur ;
  // `'droite'` pose son bord droit sur celui du déclencheur. Le repli reste
  // appliqué dans les deux cas : un panneau ancré à droite près du bord gauche
  // de l'écran doit rester visible.
  function positionner() {
    const rect = declencheur.getBoundingClientRect();
    element.style.top = `${rect.bottom + 5}px`;
    const largeur = element.offsetWidth || 320;
    const position = ancrage === 'droite'
      ? rect.right - largeur
      : rect.left;
    const gauche = Math.min(position, window.innerWidth - largeur - 8);
    element.style.left = `${Math.max(8, gauche)}px`;
  }

  function fermer() {
    if (!ouvert) return;
    ouvert = false;
    declencheur.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', gererClicExterieur);
    document.removeEventListener('keydown', gererEscape);
    window.removeEventListener('resize', positionner);
    window.removeEventListener('scroll', positionner, true);
    // Joue l'animation inverse (le store remonte) avant de masquer réellement
    // le panneau — même pattern que `.facture-item--fermeture` (carte-facture.js) :
    // une classe transitoire, retirée après la durée de l'animation.
    element.classList.remove('popover--anim');
    element.classList.add('popover--anim-fermeture');
    clearTimeout(minuteurFermeture);
    minuteurFermeture = setTimeout(() => {
      element.hidden = true;
      element.classList.remove('popover--anim-fermeture');
    }, DUREE_ANIMATION_MS);
    if (surFermeture) surFermeture();
  }

  function gererClicExterieur(evenement) {
    const cible = evenement.target;
    if (element.contains(cible) || declencheur.contains(cible)) return;
    fermer();
  }

  function gererEscape(evenement) {
    if (evenement.key === 'Escape') fermer();
  }

  function ouvrir() {
    if (ouvert) return;
    ouvert = true;
    // Annule une fermeture en cours (réouverture pendant l'animation inverse) :
    // le panneau n'a jamais été masqué dans ce cas, `hidden` reste déjà à `false`.
    clearTimeout(minuteurFermeture);
    element.classList.remove('popover--anim-fermeture');
    element.hidden = false;
    // L'élément doit être visible pour que `offsetWidth` soit mesurable.
    positionner();
    // Rejoue l'effet de déroulé à chaque ouverture (même pattern que
    // `infobulle.js`) : retrait préalable + reflow forcé, pour redémarrer
    // l'animation même si la classe était encore présente (fermeture pendant
    // une ouverture précédente).
    element.classList.remove('popover--anim');
    void element.offsetWidth;
    element.classList.add('popover--anim');
    declencheur.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', gererClicExterieur);
    document.addEventListener('keydown', gererEscape);
    // `true` pour capturer aussi le scroll de `.modale__boite`, pas seulement de la fenêtre.
    window.addEventListener('resize', positionner);
    window.addEventListener('scroll', positionner, true);
    if (surOuverture) surOuverture();
  }

  function basculer() {
    if (ouvert) {
      fermer();
    } else {
      ouvrir();
    }
  }

  function estOuvert() {
    return ouvert;
  }

  // Activation du déclencheur. Sans cela le popover ne s'ouvrirait que par
  // programme : c'est ici qu'il doit vivre, l'atome portant déjà `aria-expanded`
  // et la fermeture au clic extérieur.
  declencheur.addEventListener('click', basculer);

  // Un déclencheur qui n'est pas un <button> natif (ici un div[role="button"])
  // n'émet pas de clic au clavier : il faut relayer Entrée et Espace nous-mêmes.
  if (declencheur.tagName !== 'BUTTON') {
    declencheur.addEventListener('keydown', (evenement) => {
      if (evenement.key !== 'Enter' && evenement.key !== ' ') return;
      // Espace ferait défiler la page si on le laissait passer.
      evenement.preventDefault();
      basculer();
    });
  }

  return { element, ouvrir, fermer, basculer, estOuvert };
}
