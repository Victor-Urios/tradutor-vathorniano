"use strict";
// ===== TABELA DA LÍNGUA =====
// Cada letra do português vira uma sílaba. Edite aqui para mudar o padrão.
const alphabet = {
    a: "fa", b: "pra", c: "na", d: "kra", e: "ba",
    f: "ja", g: "mna", h: "vra", i: "va", j: "za",
    k: "xa", l: "ga", m: "da", n: "na", o: "ha",
    p: "pta", q: "dra", r: "ra", s: "ma", t: "tra",
    u: "ca", v: "vna", w: "wa", x: "xva", y: "bxa",
    z: "hva",
};
// Tabela inversa: sílaba -> letras possíveis (ex.: "na" -> ["c", "n"]).
const syllableToLetters = new Map();
for (const [letter, syllable] of Object.entries(alphabet)) {
    const list = syllableToLetters.get(syllable) ?? [];
    list.push(letter);
    syllableToLetters.set(syllable, list);
}
// Remove acentos: ç -> c, ã -> a, é -> e ...
function stripAccents(ch) {
    return ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
}
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
// Português -> língua customizada
function encodeWord(word) {
    let out = "";
    for (const ch of word) {
        const base = stripAccents(ch);
        const syllable = alphabet[base.toLowerCase()];
        if (!syllable) {
            out += ch;
            continue;
        }
        const isUpper = ch !== ch.toLowerCase();
        out += isUpper ? capitalize(syllable) : syllable;
    }
    return out;
}
// Língua customizada -> português
// Toda sílaba termina em "a" e não tem outro "a", então basta cortar após cada "a".
function decodeWord(word) {
    const tokens = word.match(/[^aA]*[aA]|[^aA]+/g) ?? [];
    let out = "";
    for (const token of tokens) {
        const letters = syllableToLetters.get(token.toLowerCase());
        if (!letters) {
            out += token;
            continue;
        }
        const isUpper = token[0] !== token[0].toLowerCase();
        const shown = isUpper ? letters.map((l) => l.toUpperCase()) : letters;
        out += shown.length === 1 ? shown[0] : `(${shown.join("/")})`;
    }
    return out;
}
function translate(text, fn) {
    return text
        .split(/(\p{L}+)/u)
        .map((part, idx) => (idx % 2 === 1 ? fn(part) : part))
        .join("");
}
// ===== FALADO =====
// Agrupa as sílabas (uma por letra do português) de cada palavra para a pronúncia.
// - Até 4 letras: não separa.
// - 5 letras: 2+1+2 (a letra do meio fica sozinha).
// - Acima disso: grupos de 3 em 3. O resto de 2 letras fica no último grupo.
// - Se sobrar 1 letra, ela fica sozinha no meio da palavra.
function splitSizes(n) {
    if (n <= 4)
        return [n];
    if (n === 5)
        return [2, 1, 2];
    const full = Math.floor(n / 3);
    const rem = n % 3;
    const sizes = Array(full).fill(3);
    if (rem === 2)
        sizes.push(2);
    if (rem === 1)
        sizes.splice(Math.floor(full / 2), 0, 1);
    return sizes;
}
// Regra extra da fala: "bxa" (Y) é pronunciado "baxá".
function speakSyllable(token) {
    if (token.toLowerCase() !== "bxa")
        return token;
    if (token === token.toUpperCase())
        return "BAXÁ";
    return token[0] === token[0].toUpperCase() ? "Baxá" : "baxá";
}
function speakWord(word) {
    const tokens = word.match(/[^aA]*[aA]|[^aA]+/g) ?? [];
    const parts = [];
    let pos = 0;
    for (const size of splitSizes(tokens.length)) {
        parts.push(tokens.slice(pos, pos + size).map(speakSyllable).join(""));
        pos += size;
    }
    return parts.join(" ");
}
// ===== INTERFACE =====
const normalEl = document.getElementById("normal");
const customEl = document.getElementById("custom");
const spokenEl = document.getElementById("spoken");
const tableEl = document.getElementById("dict");
function updateSpoken() {
    spokenEl.value = translate(customEl.value, speakWord);
}
normalEl.addEventListener("input", () => {
    customEl.value = translate(normalEl.value, encodeWord);
    updateSpoken();
});
customEl.addEventListener("input", () => {
    normalEl.value = translate(customEl.value, decodeWord);
    updateSpoken();
});
tableEl.innerHTML = Object.entries(alphabet)
    .map(([l, s]) => `<li><span>${l.toUpperCase()}</span> → <b>${capitalize(s)}</b></li>`)
    .join("");
