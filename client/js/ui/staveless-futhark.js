// staveless-futhark.js - Rune senza asta (staveless / Hälsinge).
// Il pacchetto npm "riimut" (0.9.1) non le include ancora: la tabella è quella di riimut-rs
// (https://github.com/stscoundrel/riimut-rs, src/staveless_futhark/mapping.rs, licenza MIT), stesso autore.
// Molti segni non hanno un carattere Unicode runico proprio: si usano segni simili (come fa riimut).

const LETTERS_TO_RUNES = new Map([
  ['a', '⸝'], ['á', '⸝'], ['b', 'ˏ'], ['c', '╵'], ['d', '⸍'], ['ð', 'ו'], ['e', 'ᛁ'], ['é', 'ᛁ'],
  ['f', 'ᛙ'], ['g', 'ᛍ'], ['h', 'ᚽ'], ['i', 'ᛁ'], ['í', 'ᛁ'], ['j', 'ᛁ'], ['k', 'ᛍ'], ['l', '⸌'],
  ['m', '⠃'], ['n', '⸜'], ['o', 'ˎ'], ['ó', 'ˎ'], ['p', 'ˏ'], ['q', 'ᛍ'], ['r', '◟'], ['s', '╵'],
  ['t', '⸍'], ['þ', 'ו'], ['u', '╮'], ['ú', '╮'], ['v', '╮'], ['w', '╮'], ['x', '╵'], ['y', '╮'],
  ['ý', '╮'], ['z', '╵'], ['å', 'ˎ'], ['ä', '⸝'], ['æ', '⸝'], ['œ', 'ˎ'], ['ö', 'ˎ'], ['ø', 'ˎ'],
  ['ǫ', 'ˎ'], [' ', ':']
]);

/** Stessa interfaccia di riimut: carattere per carattere, quelli sconosciuti restano come sono */
export function lettersToRunes(content) {
  return Array.from(content, (char) => LETTERS_TO_RUNES.get(char.toLowerCase()) ?? char).join('');
}
