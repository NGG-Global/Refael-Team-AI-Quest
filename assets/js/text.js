/** Shared text handling. Both versions reorganise free text; neither rewrites it. */

/**
 * Splits a free-text answer into separate statements on line breaks, sentence
 * terminators and bullet characters. Reorganisation only — no word is changed,
 * dropped or rephrased.
 */
export function splitStatements(text) {
  return String(text || '')
    .replace(/([.!?;׃])\s+/g, '$1\n')
    .split(/\n+/)
    .map((line) => line.replace(/^[\s\-–—*•·.]+/, '').trim())
    .filter((line) => line.length > 1);
}
