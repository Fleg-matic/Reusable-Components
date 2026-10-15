/**
 * Point unique de création et de manipulation du DOM des composants.
 * Convention anti-XSS : tout texte est posé via `textContent`, jamais `innerHTML`.
 *
 * Cette convention est **portée par le code**, pas seulement annoncée : `peupler`
 * refuse les gestionnaires d'événements en attribut et les URL exécutables. Un
 * appel fautif lève immédiatement, à la création de l'élément — pas silencieusement
 * ignoré, pour que le défaut se voie au premier essai plutôt qu'à la revue.
 */

/**
 * Préfixe des gestionnaires d'événements inline. Il ne suffit pas à conclure :
 * `one` ou `onglet` commencent aussi par « on » sans être des gestionnaires.
 * La décision se prend sur l'élément lui-même — voir {@link exigerAttributSur}.
 */
const PREFIXE_GESTIONNAIRE = /^on/i;

/** Attributs porteurs d'URL, sur lesquels un schéma exécutable est refusé. */
const ATTRIBUTS_URL = new Set(['href', 'src', 'xlink:href', 'formaction', 'action']);

/**
 * Schémas exécutables, refusés sur les attributs d'URL. Les espaces et
 * caractères de contrôle sont retirés avant le test : `java\nscript:` est
 * interprété comme `javascript:` par les navigateurs.
 */
const SCHEMA_EXECUTABLE = /^(javascript|vbscript):/i;

/**
 * Refuse un attribut dangereux, ou le laisse passer.
 *
 * <p>Pour les gestionnaires, la décision se prend sur l'élément et non sur le
 * nom : un attribut est un gestionnaire s'il correspond à une propriété
 * d'événement réelle de cet élément (`onclick` l'est, `one` ne l'est pas). Le
 * jeu refusé est donc exactement celui que la plateforme exécuterait.</p>
 *
 * @param {HTMLElement|SVGElement} element - élément cible, interrogé pour savoir
 *   si le nom correspond à un gestionnaire d'événement.
 * @param {string} nom - nom de l'attribut.
 * @param {string} valeur - valeur déjà convertie en chaîne.
 * @throws {Error} si l'attribut est un gestionnaire inline ou une URL exécutable.
 */
function exigerAttributSur(element, nom, valeur) {
  if (PREFIXE_GESTIONNAIRE.test(nom) && nom.toLowerCase() in element) {
    throw new Error(
      `dom.js : attribut « ${nom} » refusé — un gestionnaire d'événement se pose `
      + 'avec addEventListener, jamais en attribut.',
    );
  }
  if (ATTRIBUTS_URL.has(nom.toLowerCase())) {
    const normalisee = valeur.replace(/[\u0000- ]/g, '');
    if (SCHEMA_EXECUTABLE.test(normalisee)) {
      throw new Error(`dom.js : URL refusée sur « ${nom} » — schéma exécutable.`);
    }
  }
}

/**
 * Applique classes, texte, attributs et enfants à un élément déjà créé.
 * Factorisation commune à `creerElement` (HTML) et `creerElementSvg` (SVG).
 * @param {HTMLElement|SVGElement} element - élément à peupler.
 * @param {object} [options] - options de création (mêmes que `creerElement`).
 */
function peupler(element, options = {}) {
  if (options.classes) {
    const classes = Array.isArray(options.classes) ? options.classes : [options.classes];
    classes.forEach((classe) => {
      if (!classe) return;
      String(classe)
        .split(/\s+/)
        .filter(Boolean)
        .forEach((nom) => element.classList.add(nom));
    });
  }

  if (options.texte !== undefined && options.texte !== null) {
    element.textContent = options.texte;
  }

  if (options.attributs) {
    Object.entries(options.attributs).forEach(([nom, valeur]) => {
      if (valeur === true) {
        exigerAttributSur(element, nom, '');
        element.setAttribute(nom, '');
      } else if (valeur !== false && valeur !== null && valeur !== undefined) {
        const texte = String(valeur);
        exigerAttributSur(element, nom, texte);
        element.setAttribute(nom, texte);
      }
    });
  }

  if (options.enfants) {
    options.enfants.forEach((enfant) => {
      if (enfant) element.appendChild(enfant);
    });
  }
}

/**
 * Crée un élément DOM.
 * @param {string} balise - nom de la balise à créer.
 * @param {object} [options] - options de création.
 * @param {string|string[]} [options.classes] - classes à appliquer (les valeurs vides/nulles sont ignorées).
 * @param {string} [options.texte] - texte posé via `textContent` (jamais interprété comme du HTML).
 * @param {object} [options.attributs] - attributs à poser ; une valeur `true` pose un attribut booléen,
 *   une valeur `false`/`null`/`undefined` n'écrit rien.
 * @param {Node[]} [options.enfants] - nœuds enfants à ajouter (les entrées nulles sont ignorées).
 * @returns {HTMLElement} l'élément créé.
 */
export function creerElement(balise, options = {}) {
  const element = document.createElement(balise);
  peupler(element, options);
  return element;
}

/**
 * Crée un élément SVG (namespace `http://www.w3.org/2000/svg`).
 * `document.createElement` (utilisé par `creerElement`) ne crée que des éléments
 * HTML : un `<svg>`/`<path>` ainsi créé ne se rendrait pas correctement. Mêmes
 * options que `creerElement`.
 * @param {string} balise - nom de la balise SVG à créer (ex. `svg`, `path`).
 * @param {object} [options] - options de création (classes, texte, attributs, enfants).
 * @returns {SVGElement} l'élément SVG créé.
 */
export function creerElementSvg(balise, options = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', balise);
  peupler(element, options);
  return element;
}

/**
 * Retire tous les enfants d'un élément.
 * @param {HTMLElement} element - élément à vider.
 */
export function vider(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Pilote l'attribut `hidden` d'un élément.
 * @param {HTMLElement} element - élément concerné.
 * @param {boolean} visible - `true` pour afficher, `false` pour masquer.
 */
export function definirVisible(element, visible) {
  element.hidden = !visible;
}
