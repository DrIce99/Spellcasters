// runes.js - Traslitterazione di un testo in rune, nell'alfabeto runico scelto dal giocatore.
// Serve per scrivere il nome del giocatore nel suo cerchio dei Linker. Le conversioni sono del
// pacchetto "riimut"; le rune staveless (che riimut su npm non ha ancora) sono in staveless-futhark.js.
import * as riimutModule from 'riimut';
import { lettersToRunes as stavelessLettersToRunes } from './staveless-futhark.js';

// riimut è CommonJS: con Vite gli export arrivano per nome, con Node solo dentro "default"
// (e con Vite "default" è vuoto, perché il pacchetto si dichiara __esModule senza averlo)
const riimut = riimutModule.elderFuthark ? riimutModule : riimutModule.default;
const { elderFuthark, youngerFuthark, medievalFuthork, futhorc } = riimut;

export const RUNE_ALPHABETS = [
  { key: 'elder', label: 'Elder Futhark', convert: elderFuthark.lettersToRunes },
  { key: 'younger', label: 'Younger Futhark', convert: youngerFuthark.lettersToLongBranchRunes },
  { key: 'shortTwig', label: 'Short-twig Futhark', convert: youngerFuthark.lettersToShortTwigRunes },
  { key: 'staveless', label: 'Staveless (Hälsinge) Futhark', convert: stavelessLettersToRunes },
  { key: 'medieval', label: 'Medieval Runerow', convert: medievalFuthork.lettersToRunes },
  { key: 'angloSaxon', label: 'Anglo-Saxon Futhorc', convert: futhorc.lettersToRunes }
];

export const DEFAULT_RUNE_ALPHABET = 'elder';
export const RUNE_CROSS = '᛭'; // croce runica: segna l'inizio del nome nell'anello

const ALPHABETS_BY_KEY = new Map(RUNE_ALPHABETS.map(a => [a.key, a]));

export function isRuneAlphabet(key) {
  return ALPHABETS_BY_KEY.has(key);
}

// Le rune non hanno cifre: i numeri si scrivono in lettere, così due nomi diversi restano diversi
const DIGIT_WORDS = ['zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove'];

// Gruppi di lettere con una runa propria in alcuni alfabeti (riimut li vuole già scritti come þ e ŋ)
const DIGRAPHS = [['th', 'þ'], ['ng', 'ŋ']];

const LATIN = /\p{Script=Latin}/u;

function stripAccents(char) {
  return char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * @param {string} text
 * @param {string} alphabet chiave di RUNE_ALPHABETS
 * @returns {string[]} un segno per elemento (spazi e simboli diventano il separatore dell'alfabeto)
 */
export function toRunes(text, alphabet = DEFAULT_RUNE_ALPHABET) {
  const { convert } = ALPHABETS_BY_KEY.get(alphabet) || ALPHABETS_BY_KEY.get(DEFAULT_RUNE_ALPHABET);
  // Cifre in lettere; tutto ciò che non è una lettera (_ - . spazi...) diventa un solo spazio
  let plain = String(text ?? '').toLowerCase()
    .replace(/[0-9]/g, d => ` ${DIGIT_WORDS[Number(d)]} `)
    .replace(/[^\p{L}]+/gu, ' ')
    .trim();
  for (const [group, letter] of DIGRAPHS) {
    if (!LATIN.test(convert(letter))) plain = plain.replaceAll(group, letter);
  }

  let out = '';
  for (const char of plain) {
    let rune = convert(char);
    // Lettera che l'alfabeto non conosce: si riprova senza accento, altrimenti si salta
    if (LATIN.test(rune)) rune = convert(stripAccents(char));
    if (!LATIN.test(rune)) out += rune;
  }
  return Array.from(out);
}
