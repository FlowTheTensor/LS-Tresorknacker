// =============================================================================
//  tracer.js – ein kleiner C++-Interpreter für kurze Übungsprogramme
// =============================================================================
//  Unterstützt genau das, was im Skript vorkommt:
//    Datentypen int, char, double (und bool für Bedingungen)
//    Variablen (lokal, global, im Block), eindimensionale Arrays
//    if / else if / else, while, do-while, for, break, continue
//    Funktionen mit Wertparametern und return
//    cout mit Texten, Zahlen, Zeichen, "\n" und endl
//    Rechnen mit + - * / %, Vergleiche, && || !, ++ --, += -= *= /= %=
//    Typumwandlung (int) x, int(x), (double) x, (char) x
//
//  Das Programm wird vorab komplett ausgeführt. Ergebnis ist eine Liste von
//  Schritten. Jeder Schritt enthält die aktuelle Zeile, eine Erklärung,
//  Hinweise (Ganzzahldivision, Überlauf …), den Speicher (alle Variablen nach
//  Gültigkeitsbereich) und die bisherige Ausgabe.
// =============================================================================

const CPP_TYPEN = ["int", "char", "double", "bool", "void"];
const WERT_TYPEN = ["int", "char", "double", "bool"];
const MAX_SCHRITTE = 600;

class CppFehler extends Error {
  constructor(text, zeile, art) {
    super(text);
    this.zeile = zeile || 0;
    this.art = art || "fehler";
  }
}

// -----------------------------------------------------------------------------
// Zahlen umwandeln und darstellen
// -----------------------------------------------------------------------------
function wrapInt(x) {
  x = ((x % 4294967296) + 4294967296) % 4294967296;
  return x >= 2147483648 ? x - 4294967296 : x;
}

function wrapChar(x) {
  x = ((x % 256) + 256) % 256;
  return x >= 128 ? x - 256 : x;
}

// Ausgabe eines double wie cout (6 gültige Stellen, ohne Nullen am Ende)
function fmtDouble(x) {
  if (!isFinite(x)) {
    return isNaN(x) ? "nan" : x > 0 ? "inf" : "-inf";
  }
  if (x === 0) {
    return "0";
  }
  const exp = Math.floor(Math.log10(Math.abs(x)));
  if (exp < -5 || exp >= 6) {
    let [m, e] = x.toExponential(5).split("e");
    m = m.replace(/0+$/, "").replace(/\.$/, "");
    const n = parseInt(e, 10);
    return `${m}e${n < 0 ? "-" : "+"}${String(Math.abs(n)).padStart(2, "0")}`;
  }
  let s = x.toPrecision(6);
  if (s.indexOf(".") >= 0) {
    s = s.replace(/0+$/, "").replace(/\.$/, "");
  }
  return s;
}

function druckbar(code) {
  return code >= 32 && code <= 126;
}

// Wert für Erklärungen und die Variablentafel
function zeigeWert(typ, w) {
  if (w === undefined) {
    return "?";
  }
  if (typ === "char") {
    return druckbar(w) ? `'${String.fromCharCode(w)}' (${w})` : String(w);
  }
  if (typ === "double") {
    return fmtDouble(w);
  }
  if (typ === "bool") {
    return w ? "wahr" : "falsch";
  }
  return String(w);
}

// kurze Darstellung für die Variablentafel (Schreibtischtest)
function zellText(typ, w) {
  if (w === undefined) {
    return "?";
  }
  if (typ === "char") {
    return /[A-Za-z0-9]/.test(String.fromCharCode(w)) && druckbar(w) ? `'${String.fromCharCode(w)}'` : String(w);
  }
  if (typ === "double") {
    return fmtDouble(w);
  }
  if (typ === "bool") {
    return w ? "1" : "0";
  }
  return String(w);
}

// Ausgabe für das Schloss: Leerraum zusammenfassen
function ausgabeNormal(s) {
  return String(s).replace(/\s+/g, " ").trim();
}

// =============================================================================
// Zerlegen in Wörter (Tokens)
// =============================================================================
function cppEscape(c) {
  const t = { n: "\n", t: "\t", 0: "\0", "\\": "\\", "'": "'", '"': '"' };
  return t[c] !== undefined ? t[c] : c;
}

function zerlege(src) {
  const t = [];
  let i = 0;
  let zeile = 1;
  const n = src.length;
  const ops2 = ["<<", ">>", "<=", ">=", "==", "!=", "&&", "||", "++", "--", "+=", "-=", "*=", "/=", "%="];
  while (i < n) {
    const c = src[i];
    if (c === "\n") {
      zeile++;
      i++;
      continue;
    }
    if (c === " " || c === "\t" || c === "\r") {
      i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      while (i < n && src[i] !== "\n") {
        i++;
      }
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      i += 2;
      while (i < n && !(src[i] === "*" && src[i + 1] === "/")) {
        if (src[i] === "\n") {
          zeile++;
        }
        i++;
      }
      i += 2;
      continue;
    }
    if (c === "#") {
      while (i < n && src[i] !== "\n") {
        i++;
      }
      continue;
    }
    const start = i;
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] || ""))) {
      let s = "";
      let dbl = false;
      while (i < n && /[0-9.]/.test(src[i])) {
        if (src[i] === ".") {
          dbl = true;
        }
        s += src[i++];
      }
      if (i < n && (src[i] === "e" || src[i] === "E")) {
        dbl = true;
        s += src[i++];
        if (src[i] === "+" || src[i] === "-") {
          s += src[i++];
        }
        while (i < n && /[0-9]/.test(src[i])) {
          s += src[i++];
        }
      }
      t.push({ art: "zahl", wert: Number(s), dbl, text: s, zeile, pos: start, ende: i });
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let s = "";
      while (i < n && /[A-Za-z0-9_]/.test(src[i])) {
        s += src[i++];
      }
      t.push({ art: "wort", text: s, zeile, pos: start, ende: i });
      continue;
    }
    if (c === "'") {
      i++;
      let ch = src[i++];
      if (ch === "\\") {
        ch = cppEscape(src[i++]);
      }
      if (src[i] !== "'") {
        throw new CppFehler("Zeichenkonstante ist nicht geschlossen.", zeile);
      }
      i++;
      t.push({ art: "zeichen", wert: ch.charCodeAt(0), text: src.slice(start, i), zeile, pos: start, ende: i });
      continue;
    }
    if (c === '"') {
      i++;
      let s = "";
      while (i < n && src[i] !== '"') {
        if (src[i] === "\\") {
          i++;
          s += cppEscape(src[i++]);
        } else {
          s += src[i++];
        }
      }
      i++;
      t.push({ art: "text", wert: s, text: src.slice(start, i), zeile, pos: start, ende: i });
      continue;
    }
    const zwei = src.substr(i, 2);
    if (ops2.indexOf(zwei) >= 0) {
      t.push({ art: "op", text: zwei, zeile, pos: start, ende: i + 2 });
      i += 2;
      continue;
    }
    if ("+-*/%<>=!(){}[];,".indexOf(c) >= 0) {
      t.push({ art: "op", text: c, zeile, pos: start, ende: i + 1 });
      i++;
      continue;
    }
    throw new CppFehler(`Unbekanntes Zeichen „${c}“.`, zeile);
  }
  t.push({ art: "ende", text: "", zeile, pos: n, ende: n });
  return t;
}

// =============================================================================
// Parser: Quelltext → Baum
// =============================================================================
function parseCpp(src) {
  const tok = zerlege(src);
  let p = 0;

  function ist(text) {
    const t = tok[p];
    return (t.art === "op" || t.art === "wort") && t.text === text;
  }
  function nimm(text) {
    if (!ist(text)) {
      throw new CppFehler(`„${text}“ erwartet, gefunden „${tok[p].text || "Ende"}“.`, tok[p].zeile);
    }
    return tok[p++];
  }
  function istTyp() {
    return tok[p].art === "wort" && (CPP_TYPEN.indexOf(tok[p].text) >= 0 || tok[p].text === "const");
  }
  function name() {
    if (tok[p].art !== "wort") {
      throw new CppFehler(`Name erwartet, gefunden „${tok[p].text}“.`, tok[p].zeile);
    }
    return tok[p++].text;
  }
  function typ() {
    if (ist("const")) {
      p++;
    }
    if (!istTyp()) {
      throw new CppFehler(`Datentyp erwartet, gefunden „${tok[p].text}“.`, tok[p].zeile);
    }
    return tok[p++].text;
  }
  function knoten(k, start, extra) {
    const endTok = tok[p - 1];
    return Object.assign({ k, text: src.slice(start.pos, endTok.ende).replace(/\s+/g, " "), zeile: start.zeile }, extra);
  }

  // --- Ausdrücke ---------------------------------------------------------------
  function ausdruck() {
    return zuweisung();
  }
  function zuweisung() {
    const start = tok[p];
    const l = oder();
    for (const op of ["=", "+=", "-=", "*=", "/=", "%="]) {
      if (ist(op)) {
        p++;
        if (l.k !== "var" && l.k !== "index") {
          throw new CppFehler("Links vom = muss eine Variable stehen.", start.zeile);
        }
        const r = zuweisung();
        return knoten("zuw", start, { op, ziel: l, e: r });
      }
    }
    return l;
  }
  function binLinks(f, ops) {
    const start = tok[p];
    let l = f();
    while (tok[p].art === "op" && ops.indexOf(tok[p].text) >= 0) {
      const op = tok[p++].text;
      const r = f();
      l = knoten("bin", start, { op, l, r });
    }
    return l;
  }
  function oder() {
    return binLinks(und, ["||"]);
  }
  function und() {
    return binLinks(gleich, ["&&"]);
  }
  function gleich() {
    return binLinks(vergleich, ["==", "!="]);
  }
  function vergleich() {
    return binLinks(additiv, ["<", ">", "<=", ">="]);
  }
  function additiv() {
    return binLinks(multi, ["+", "-"]);
  }
  function multi() {
    return binLinks(unaer, ["*", "/", "%"]);
  }
  function unaer() {
    const start = tok[p];
    if (tok[p].art === "op" && ["-", "+", "!"].indexOf(tok[p].text) >= 0) {
      const op = tok[p++].text;
      const e = unaer();
      return knoten("un", start, { op, e });
    }
    if (ist("++") || ist("--")) {
      const op = tok[p++].text;
      const z = unaer();
      return knoten("inc", start, { op, pre: true, ziel: z });
    }
    if (ist("(") && tok[p + 1].art === "wort" && WERT_TYPEN.indexOf(tok[p + 1].text) >= 0 && tok[p + 2].text === ")") {
      p++;
      const t = tok[p++].text;
      p++;
      const e = unaer();
      return knoten("cast", start, { typ: t, e });
    }
    return postfix();
  }
  function postfix() {
    const start = tok[p];
    let e = primaer();
    while (ist("++") || ist("--") || ist("[")) {
      if (ist("[")) {
        p++;
        const idx = ausdruck();
        nimm("]");
        if (e.k !== "var") {
          throw new CppFehler("Nur ein Array kann einen Index [ ] haben.", start.zeile);
        }
        e = knoten("index", start, { name: e.name, idx });
      } else {
        const op = tok[p++].text;
        e = knoten("inc", start, { op, pre: false, ziel: e });
      }
    }
    return e;
  }
  function primaer() {
    const start = tok[p];
    const t = tok[p];
    if (t.art === "zahl") {
      p++;
      return knoten("lit", start, { typ: t.dbl ? "double" : "int", wert: t.wert });
    }
    if (t.art === "zeichen") {
      p++;
      return knoten("lit", start, { typ: "char", wert: t.wert });
    }
    if (t.art === "text") {
      p++;
      return knoten("str", start, { wert: t.wert });
    }
    if (ist("true") || ist("false")) {
      p++;
      return knoten("lit", start, { typ: "bool", wert: t.text === "true" ? 1 : 0 });
    }
    if (ist("(")) {
      p++;
      const e = ausdruck();
      nimm(")");
      return knoten("klammer", start, { e });
    }
    if (t.art === "wort") {
      if (WERT_TYPEN.indexOf(t.text) >= 0 && tok[p + 1].text === "(") {
        p += 2;
        const e = ausdruck();
        nimm(")");
        return knoten("cast", start, { typ: t.text, e });
      }
      p++;
      if (ist("(")) {
        p++;
        const args = [];
        while (!ist(")")) {
          args.push(zuweisung());
          if (ist(",")) {
            p++;
          }
        }
        p++;
        return knoten("aufruf", start, { name: t.text, args });
      }
      return knoten("var", start, { name: t.text });
    }
    throw new CppFehler(`Unerwartet: „${t.text || "Ende"}“.`, t.zeile);
  }

  // --- Anweisungen -------------------------------------------------------------
  function deklaration() {
    const start = tok[p];
    const t = typ();
    const vars = [];
    for (;;) {
      const nm = name();
      let arr = false;
      let laenge = null;
      let init = null;
      let liste = null;
      if (ist("[")) {
        p++;
        arr = true;
        if (!ist("]")) {
          laenge = ausdruck();
        }
        nimm("]");
      }
      if (ist("=")) {
        p++;
        if (ist("{")) {
          p++;
          liste = [];
          while (!ist("}")) {
            liste.push(zuweisung());
            if (ist(",")) {
              p++;
            }
          }
          p++;
        } else {
          init = zuweisung();
        }
      }
      vars.push({ name: nm, arr, laenge, init, liste });
      if (ist(",")) {
        p++;
        continue;
      }
      break;
    }
    return knoten("dekl", start, { typ: t, vars });
  }
  function block() {
    const start = nimm("{");
    const anw = [];
    while (!ist("}")) {
      if (tok[p].art === "ende") {
        throw new CppFehler("Es fehlt eine schließende Klammer }.", start.zeile);
      }
      anw.push(anweisung());
    }
    const endeTok = nimm("}");
    return { k: "block", anw, zeile: start.zeile, endZeile: endeTok.zeile };
  }
  function anweisung() {
    const start = tok[p];
    if (ist("{")) {
      return block();
    }
    if (istTyp()) {
      const d = deklaration();
      nimm(";");
      return d;
    }
    if (ist("if")) {
      p++;
      nimm("(");
      const bed = ausdruck();
      nimm(")");
      const dann = anweisung();
      let sonst = null;
      if (ist("else")) {
        p++;
        sonst = anweisung();
      }
      return { k: "if", bed, dann, sonst, zeile: start.zeile };
    }
    if (ist("while")) {
      p++;
      nimm("(");
      const bed = ausdruck();
      nimm(")");
      const rumpf = anweisung();
      return { k: "while", bed, rumpf, zeile: start.zeile };
    }
    if (ist("do")) {
      p++;
      const rumpf = anweisung();
      const wt = nimm("while");
      nimm("(");
      const bed = ausdruck();
      nimm(")");
      nimm(";");
      return { k: "do", bed, rumpf, zeile: start.zeile, bedZeile: wt.zeile };
    }
    if (ist("for")) {
      p++;
      nimm("(");
      let init = null;
      if (istTyp()) {
        init = deklaration();
      } else if (!ist(";")) {
        init = ausdruckAnw();
      }
      nimm(";");
      let bed = null;
      if (!ist(";")) {
        bed = ausdruck();
      }
      nimm(";");
      let schritt = null;
      if (!ist(")")) {
        schritt = ausdruck();
      }
      nimm(")");
      const rumpf = anweisung();
      return { k: "for", init, bed, schritt, rumpf, zeile: start.zeile };
    }
    if (ist("break") || ist("continue")) {
      const k = tok[p++].text;
      nimm(";");
      return { k, zeile: start.zeile };
    }
    if (ist("return")) {
      p++;
      let e = null;
      if (!ist(";")) {
        e = ausdruck();
      }
      nimm(";");
      return { k: "return", e, zeile: start.zeile };
    }
    if (ist("cout")) {
      p++;
      const teile = [];
      while (ist("<<")) {
        p++;
        if (ist("endl")) {
          p++;
          teile.push({ k: "endl", text: "endl" });
        } else {
          teile.push(additiv());
        }
      }
      const c = knoten("cout", start, { teile });
      nimm(";");
      return c;
    }
    if (ist("cin")) {
      throw new CppFehler("Eingaben mit cin gibt es in den Rätseln nicht.", start.zeile);
    }
    if (ist(";")) {
      p++;
      return { k: "leer", zeile: start.zeile };
    }
    const a = ausdruckAnw();
    nimm(";");
    return a;
  }
  function ausdruckAnw() {
    const start = tok[p];
    const e = ausdruck();
    return { k: "ausdr", e, zeile: start.zeile, text: e.text };
  }

  // --- Programm ---------------------------------------------------------------
  const globale = [];
  const funktionen = {};
  while (tok[p].art !== "ende") {
    if (ist("using")) {
      while (!ist(";")) {
        p++;
      }
      p++;
      continue;
    }
    if (!istTyp()) {
      throw new CppFehler(`Unerwartet: „${tok[p].text}“.`, tok[p].zeile);
    }
    const start = tok[p];
    const merke = p;
    const t = typ();
    const nm = name();
    if (ist("(")) {
      p++;
      const params = [];
      while (!ist(")")) {
        const pt = typ();
        const pn = name();
        params.push({ typ: pt, name: pn });
        if (ist(",")) {
          p++;
        }
      }
      p++;
      if (ist(";")) {
        p++;
        continue;
      }
      const koerper = block();
      funktionen[nm] = { name: nm, typ: t, params, koerper, zeile: start.zeile };
    } else {
      p = merke;
      const d = deklaration();
      nimm(";");
      globale.push(d);
    }
  }
  if (!funktionen.main) {
    throw new CppFehler("Das Programm braucht eine Funktion main().", 1);
  }
  return { globale, funktionen };
}

// =============================================================================
// Ausführen
// =============================================================================
class Abbruch extends Error {}

function fuehreAus(src) {
  const zeilen = src.split("\n");
  const schritte = [];
  const tabelle = [];
  const spalten = [];
  const spaltenIdx = {};
  let ausgabe = "";
  let notizen = [];
  let geaendert = [];
  let flags = {};
  let tabZeile = { zellen: {}, aus: "" };
  const global = new Map();
  const stapel = [];
  let prog;

  // --- Schritt festhalten ---------------------------------------------------------
  function speicherBild() {
    const bild = [];
    const kopie = (v) => ({ name: v.name, typ: v.typ, wert: v.wert, arr: v.arr, werte: v.arr ? v.werte.slice() : null, key: v.key });
    if (global.size) {
      bild.push({ titel: "global", art: "global", vars: Array.from(global.values()).map(kopie) });
    }
    stapel.forEach((f) => {
      if (f.fname === "__global") {
        return;
      }
      const vars = [];
      f.bloecke.forEach((b, tiefe) => {
        for (const v of b.values()) {
          vars.push(Object.assign(kopie(v), { tiefe }));
        }
      });
      bild.push({ titel: f.label, art: f.fname === "main" ? "main" : "funktion", vars });
    });
    return bild;
  }

  function schritt(art, zeile, text, extra) {
    if (schritte.length >= MAX_SCHRITTE) {
      throw new Abbruch();
    }
    const z = tabZeile;
    if (Object.keys(z.zellen).length || z.aus) {
      tabelle.push({ zeile, zellen: z.zellen, aus: z.aus });
    }
    tabZeile = { zellen: {}, aus: "" };
    schritte.push(
      Object.assign(
        {
          art,
          zeile,
          text,
          hinweise: notizen.slice(),
          geaendert: geaendert.slice(),
          flags: Object.assign({}, flags),
          speicher: speicherBild(),
          ausgabe,
          tabN: tabelle.length,
          tiefe: stapel.length,
        },
        extra || {}
      )
    );
    notizen = [];
    geaendert = [];
    flags = {};
  }

  function notiz(t) {
    if (notizen.indexOf(t) < 0) {
      notizen.push(t);
    }
  }

  function notiereTab(key, name, typ, w) {
    if (spaltenIdx[key] === undefined) {
      spaltenIdx[key] = spalten.length;
      spalten.push({ key, name });
    }
    tabZeile.zellen[key] = zellText(typ, w);
    geaendert.push(key);
  }

  // --- Variablen ---------------------------------------------------------------
  function aktFrame() {
    return stapel[stapel.length - 1];
  }

  function finde(name, zeile) {
    const f = aktFrame();
    if (f) {
      for (let i = f.bloecke.length - 1; i >= 0; i--) {
        if (f.bloecke[i].has(name)) {
          return f.bloecke[i].get(name);
        }
      }
    }
    if (global.has(name)) {
      return global.get(name);
    }
    throw new CppFehler(`Die Variable ${name} ist hier nicht bekannt – sie wurde nicht deklariert oder ihr Gültigkeitsbereich ist schon zu Ende.`, zeile);
  }

  function existiert(name) {
    try {
      return finde(name, 0);
    } catch (e) {
      return null;
    }
  }

  function lege(name, typ, wert, zeile, istGlobal, extra) {
    const f = aktFrame();
    const scope = istGlobal ? global : f.bloecke[f.bloecke.length - 1];
    if (scope.has(name)) {
      throw new CppFehler(`Die Variable ${name} gibt es in diesem Block schon.`, zeile);
    }
    const aussen = existiert(name);
    if (aussen && !istGlobal) {
      notiz(`Es gibt schon eine Variable ${name} weiter außen${global.get(name) === aussen ? " (global)" : ""}. Ab hier ist mit ${name} die neue, innere Variable gemeint – die äußere wird verdeckt, bleibt aber unverändert erhalten.`);
    }
    const tiefe = istGlobal ? 0 : f.bloecke.length - 1;
    const key = istGlobal ? `global:${name}` : `${f.fname}:${name}:${tiefe}`;
    const v = Object.assign({ name, typ, wert, arr: false, werte: null, key }, extra || {});
    scope.set(name, v);
    if (v.arr) {
      v.werte.forEach((w, i) => {
        if (w !== undefined) {
          notiereTab(`${key}[${i}]`, `${name}[${i}]`, typ, w);
        }
      });
    } else if (wert !== undefined) {
      notiereTab(key, name, typ, wert);
    }
    return v;
  }

  // --- Umwandeln ---------------------------------------------------------------
  function konvertiere(x, zuTyp, zeile) {
    let w = x.wert;
    if (w === undefined) {
      return undefined;
    }
    if (zuTyp === "double") {
      return w;
    }
    if (zuTyp === "bool") {
      return w !== 0 ? 1 : 0;
    }
    if (x.typ === "double") {
      const t = Math.trunc(w);
      if (t !== w) {
        notiz(`Umwandlung von double nach ${zuTyp}: Die Nachkommastellen werden abgeschnitten (nicht gerundet): ${fmtDouble(w)} → ${t}.`);
      }
      w = t;
    }
    if (zuTyp === "char" && (w < -128 || w > 127)) {
      const neu = wrapChar(w);
      notiz(`${w} passt nicht in einen char (Wertebereich −128 … 127). Überlauf: Es geht auf der anderen Seite weiter → ${neu}.`);
      flags.ueberlauf = true;
      return neu;
    }
    if (zuTyp === "int" && (w < -2147483648 || w > 2147483647)) {
      const neu = wrapInt(w);
      notiz(`${w} passt nicht in einen int (Wertebereich −2147483648 … 2147483647). Überlauf → ${neu}.`);
      flags.ueberlauf = true;
      return neu;
    }
    return w;
  }

  // --- Rechnen -----------------------------------------------------------------
  function charHinweis(x) {
    if (x.typ === "char" && x.wert !== undefined) {
      notiz(`Zum Rechnen wird das Zeichen ${zeigeWert("char", x.wert)} als Zahl ${x.wert} benutzt (ASCII-Code).`);
    }
  }

  function rechne(op, a, b, zeile) {
    if (["<", ">", "<=", ">=", "==", "!="].indexOf(op) >= 0) {
      if (a.wert === undefined || b.wert === undefined) {
        return { typ: "bool", wert: undefined };
      }
      charHinweis(a);
      charHinweis(b);
      const x = a.wert;
      const y = b.wert;
      const r = { "<": x < y, ">": x > y, "<=": x <= y, ">=": x >= y, "==": x === y, "!=": x !== y }[op];
      if ((op === "==" || op === "!=") && (a.typ === "double" || b.typ === "double") && x !== y && Math.abs(x - y) < 1e-9) {
        notiz(`Vorsicht beim Vergleich von double-Werten: Zahlen wie 0.1 oder 0.2 lassen sich im Binärsystem nicht exakt speichern (siehe Gleitpunktzahlen). Intern ist das Ergebnis ${x.toPrecision(17)}, nicht ${y.toPrecision(17)} – also nicht gleich.`);
      }
      return { typ: "bool", wert: r ? 1 : 0 };
    }
    const typ = a.typ === "double" || b.typ === "double" ? "double" : "int";
    if (a.wert === undefined || b.wert === undefined) {
      return { typ, wert: undefined };
    }
    charHinweis(a);
    charHinweis(b);
    const x = a.wert;
    const y = b.wert;
    if (typ === "double") {
      if (op === "%") {
        throw new CppFehler("Der Operator % geht nur mit ganzen Zahlen.", zeile);
      }
      if (op === "/" && y === 0) {
        throw new CppFehler("Division durch 0.", zeile);
      }
      return { typ, wert: { "+": x + y, "-": x - y, "*": x * y, "/": x / y }[op] };
    }
    let exakt;
    let wert;
    if (op === "/" || op === "%") {
      if (y === 0) {
        throw new CppFehler("Division durch 0 – das Programm stürzt ab.", zeile);
      }
      if (op === "/") {
        wert = Math.trunc(x / y);
        if (x % y !== 0) {
          notiz(`${x} / ${y} ist eine Ganzzahldivision (beide Werte ganzzahlig): Das Ergebnis ist ${wert}, der Rest ${x % y} fällt weg.`);
        }
      } else {
        wert = x % y;
        notiz(`% liefert den Rest der Division: ${x} % ${y} = ${wert} (denn ${x} = ${Math.trunc(x / y)} · ${y} + ${wert}).`);
      }
      return { typ, wert };
    }
    if (op === "*") {
      exakt = x * y;
      wert = Math.imul(x, y);
    } else {
      exakt = op === "+" ? x + y : x - y;
      wert = wrapInt(exakt);
    }
    if (exakt !== wert) {
      notiz(`${exakt} passt nicht in einen int (Wertebereich −2147483648 … 2147483647). Überlauf → ${wert}.`);
      flags.ueberlauf = true;
    }
    return { typ, wert };
  }

  function wahr(x, text) {
    if (x.wert === undefined) {
      notiz(`Der Wert von ${text} ist unbestimmt (zufällig) – hier wird „falsch“ angenommen.`);
      return false;
    }
    return x.wert !== 0;
  }

  // --- Ausdrücke auswerten --------------------------------------------------------
  function indexVon(e, v) {
    if (!v.arr) {
      throw new CppFehler(`${v.name} ist kein Array.`, e.zeile);
    }
    const ix = wert(e.idx);
    if (ix.typ === "double") {
      throw new CppFehler("Ein Index muss eine ganze Zahl sein.", e.zeile);
    }
    if (ix.wert === undefined) {
      throw new CppFehler(`Der Index ${e.idx.text} hat keinen Wert.`, e.zeile);
    }
    if (ix.wert < 0 || ix.wert >= v.werte.length) {
      flags.oob = true;
      throw new CppFehler(`Zugriff auf ${v.name}[${ix.wert}] – das Array hat nur die Fächer 0 bis ${v.werte.length - 1}. Das ist ein Zugriff außerhalb des Arrays: In C++ ist dann alles möglich (undefiniertes Verhalten), oft stürzt das Programm ab.`, e.zeile, "oob");
    }
    return ix.wert;
  }

  function wert(e) {
    switch (e.k) {
      case "lit":
        e._v = { typ: e.typ, wert: e.wert };
        return e._v;
      case "klammer":
        e._v = wert(e.e);
        return e._v;
      case "var": {
        const v = finde(e.name, e.zeile);
        if (v.arr) {
          throw new CppFehler(`${e.name} ist ein Array – auf die Werte greift man mit Index zu, z. B. ${e.name}[0].`, e.zeile);
        }
        if (v.wert === undefined) {
          notiz(`${e.name} hat keinen Startwert – im Speicher steht irgendein zufälliger Wert (?).`);
        }
        e._v = { typ: v.typ, wert: v.wert };
        return e._v;
      }
      case "index": {
        const v = finde(e.name, e.zeile);
        const i = indexVon(e, v);
        if (v.werte[i] === undefined) {
          notiz(`${e.name}[${i}] wurde noch nichts zugewiesen – dort steht ein zufälliger Wert (?).`);
        }
        e._v = { typ: v.typ, wert: v.werte[i] };
        return e._v;
      }
      case "bin": {
        if (e.op === "&&" || e.op === "||") {
          const l = wert(e.l);
          const lw = wahr(l, e.l.text);
          if (e.op === "&&" && !lw) {
            e._v = { typ: "bool", wert: 0 };
            return e._v;
          }
          if (e.op === "||" && lw) {
            e._v = { typ: "bool", wert: 1 };
            return e._v;
          }
          const r = wert(e.r);
          e._v = { typ: "bool", wert: wahr(r, e.r.text) ? 1 : 0 };
          return e._v;
        }
        const l = wert(e.l);
        const r = wert(e.r);
        e._v = rechne(e.op, l, r, e.zeile);
        return e._v;
      }
      case "un": {
        const x = wert(e.e);
        if (e.op === "!") {
          e._v = { typ: "bool", wert: x.wert === undefined ? undefined : x.wert ? 0 : 1 };
        } else if (e.op === "-") {
          e._v = rechne("-", { typ: x.typ === "double" ? "double" : "int", wert: 0 }, x, e.zeile);
        } else {
          e._v = { typ: x.typ === "double" ? "double" : "int", wert: x.wert };
        }
        return e._v;
      }
      case "cast": {
        const x = wert(e.e);
        e._v = { typ: e.typ, wert: konvertiere(x, e.typ, e.zeile) };
        if (e.typ === "int" && x.typ === "char" && x.wert !== undefined && druckbar(x.wert)) {
          notiz(`(int) macht aus dem Zeichen eine Zahl: ${zeigeWert("char", x.wert)} → ${x.wert}.`);
        }
        return e._v;
      }
      case "zuw": {
        const ref = ziel(e.ziel);
        let x = wert(e.e);
        if (e.op !== "=") {
          x = rechne(e.op[0], { typ: ref.v.typ, wert: lies(ref) }, x, e.zeile);
        }
        const neu = konvertiere(x, ref.v.typ, e.zeile);
        setze(ref, neu);
        e._v = { typ: ref.v.typ, wert: neu };
        return e._v;
      }
      case "inc": {
        const ref = ziel(e.ziel);
        const alt = lies(ref);
        if (alt === undefined) {
          notiz(`${e.ziel.text} hat keinen Startwert – das Ergebnis ist zufällig.`);
        }
        const x = rechne(e.op === "++" ? "+" : "-", { typ: ref.v.typ === "double" ? "double" : "int", wert: alt }, { typ: "int", wert: 1 }, e.zeile);
        const neu = konvertiere(x, ref.v.typ, e.zeile);
        setze(ref, neu);
        e._v = { typ: ref.v.typ, wert: e.pre ? neu : alt };
        e._neu = neu;
        return e._v;
      }
      case "aufruf":
        e._v = rufe(e);
        return e._v;
      case "str":
        throw new CppFehler("Ein Text in Anführungszeichen kann hier nur mit cout ausgegeben werden.", e.zeile);
      default:
        throw new CppFehler("Unbekannter Ausdruck.", e.zeile);
    }
  }

  function ziel(e) {
    const v = finde(e.name, e.zeile);
    if (e.k === "index") {
      return { v, i: indexVon(e, v) };
    }
    if (v.arr) {
      throw new CppFehler(`Einem ganzen Array kann man nichts zuweisen – nur einzelnen Fächern wie ${e.name}[0].`, e.zeile);
    }
    return { v, i: null };
  }

  function lies(ref) {
    return ref.i === null ? ref.v.wert : ref.v.werte[ref.i];
  }

  function setze(ref, w) {
    if (ref.i === null) {
      ref.v.wert = w;
      notiereTab(ref.v.key, ref.v.name, ref.v.typ, w);
    } else {
      ref.v.werte[ref.i] = w;
      notiereTab(`${ref.v.key}[${ref.i}]`, `${ref.v.name}[${ref.i}]`, ref.v.typ, w);
    }
  }

  // Ausdruck mit eingesetzten Werten
  function ersetzt(e) {
    switch (e.k) {
      case "var":
      case "index":
      case "aufruf":
      case "zuw":
        return e._v ? zeigeWert(e._v.typ, e._v.wert) : e.text;
      case "inc":
        return e._v ? zeigeWert(e._v.typ, e._v.wert) : e.text;
      case "klammer":
        return `(${ersetzt(e.e)})`;
      case "bin":
        return `${ersetzt(e.l)} ${e.op} ${ersetzt(e.r)}`;
      case "un":
        return `${e.op}${ersetzt(e.e)}`;
      case "cast":
        return `(${e.typ}) ${ersetzt(e.e)}`;
      default:
        return e.text;
    }
  }

  function ausdrText(e) {
    const s = ersetzt(e);
    const r = e._v ? zeigeWert(e._v.typ, e._v.wert) : "?";
    if (s === e.text) {
      return r === s ? e.text : `${e.text} = ${r}`;
    }
    if (s === r) {
      return `${e.text} → ${r}`;
    }
    return `${e.text} → ${s} = ${r}`;
  }

  function bedText(e, b) {
    const s = ersetzt(e);
    return `${s === e.text ? e.text : s} ist ${b ? "wahr" : "falsch"}`;
  }

  function wo(istGlobal) {
    if (istGlobal) {
      return "global";
    }
    const f = aktFrame();
    return f.bloecke.length > 1 ? `lokal im Block (in ${f.label})` : `lokal in ${f.label}`;
  }

  // --- Anweisungen ausführen -------------------------------------------------------
  function fuehreDekl(d, istGlobal) {
    const teile = [];
    for (const v of d.vars) {
      if (v.arr) {
        let laenge = v.liste ? v.liste.length : 0;
        if (v.laenge) {
          const lx = wert(v.laenge);
          laenge = lx.wert;
        }
        if (!Number.isInteger(laenge) || laenge <= 0 || laenge > 12) {
          throw new CppFehler("Die Arraygröße muss eine ganze Zahl zwischen 1 und 12 sein.", d.zeile);
        }
        const werte = new Array(laenge).fill(istGlobal ? 0 : undefined);
        if (v.liste) {
          if (v.liste.length > laenge) {
            throw new CppFehler("Zu viele Startwerte für das Array.", d.zeile);
          }
          for (let i = 0; i < laenge; i++) {
            werte[i] = i < v.liste.length ? konvertiere(wert(v.liste[i]), d.typ, d.zeile) : 0;
          }
        }
        lege(v.name, d.typ, undefined, d.zeile, istGlobal, { arr: true, werte });
        let t = `Array ${v.name} (${d.typ}, ${wo(istGlobal)}) mit ${laenge} Fächern, Index 0 bis ${laenge - 1}`;
        if (v.liste) {
          t += `, gefüllt mit ${werte.map((w) => zeigeWert(d.typ, w)).join(", ")}`;
          if (v.liste.length < laenge) {
            t += " (fehlende Startwerte sind 0)";
          }
        } else if (!istGlobal) {
          t += " – der Inhalt ist noch zufällig";
        }
        teile.push(t + ".");
      } else {
        let w = istGlobal ? 0 : undefined;
        let wie = "";
        if (v.init) {
          const x = wert(v.init);
          w = konvertiere(x, d.typ, d.zeile);
          const at = ausdrText(v.init);
          if (at !== v.init.text) {
            wie = ` ${at},`;
          }
        }
        lege(v.name, d.typ, w, d.zeile, istGlobal);
        if (v.init) {
          teile.push(`Neue Variable ${v.name} (${d.typ}, ${wo(istGlobal)}):${wie} Startwert ${zeigeWert(d.typ, w)}.`);
        } else if (istGlobal) {
          teile.push(`Neue globale Variable ${v.name} (${d.typ}) ohne Startwert – globale Variablen beginnen mit 0.`);
        } else {
          teile.push(`Neue Variable ${v.name} (${d.typ}, ${wo(istGlobal)}) ohne Startwert – der Inhalt ist zufällig (?).`);
        }
      }
    }
    schritt("dekl", d.zeile, `${d.text}: ${teile.join(" ")}`);
  }

  function fuehreAnweisungen(liste) {
    for (const a of liste) {
      const s = fuehre(a);
      if (s) {
        return s;
      }
    }
    return null;
  }

  function fuehreBlock(b) {
    const f = aktFrame();
    f.bloecke.push(new Map());
    let s;
    try {
      s = fuehreAnweisungen(b.anw);
    } finally {
      // Blockende unten
    }
    const weg = Array.from(f.bloecke[f.bloecke.length - 1].keys());
    if (weg.length && !(s && s.art === "return")) {
      schritt("block", b.endZeile, `Ende des Blocks: ${weg.join(", ")} ${weg.length > 1 ? "werden" : "wird"} gelöscht – ihr Gültigkeitsbereich endet an der schließenden Klammer }.`, { weg });
    }
    f.bloecke.pop();
    return s;
  }

  function coutText(x, t) {
    if (x.wert === undefined) {
      notiz(`${t.text} hat keinen festgelegten Wert – ausgegeben wird irgendeine zufällige Zahl (hier ???).`);
      return "???";
    }
    if (x.typ === "char") {
      if (!druckbar(x.wert)) {
        notiz(`${t.text} hat den Wert ${x.wert}: kein druckbares Zeichen – auf dem Bildschirm erscheint ein Sonderzeichen oder nichts (hier ?). Mit (int) ${t.text} sieht man die Zahl.`);
        return "?";
      }
      if (t.k !== "lit") {
        notiz(`${t.text} ist vom Typ char → ausgegeben wird das Zeichen mit dem ASCII-Code ${x.wert}: ${String.fromCharCode(x.wert)}`);
      }
      return String.fromCharCode(x.wert);
    }
    if (x.typ === "bool") {
      notiz(`Ein Wahrheitswert wird von cout als Zahl ausgegeben: wahr → 1, falsch → 0.`);
      return x.wert ? "1" : "0";
    }
    if (x.typ === "double") {
      if (Number.isInteger(x.wert) && t.k !== "lit") {
        notiz(`${t.text} ist ein double mit dem Wert ${fmtDouble(x.wert)}. cout lässt „.0“ weg und gibt einfach ${fmtDouble(x.wert)} aus.`);
      }
      return fmtDouble(x.wert);
    }
    if (t.k === "bin" && (t.l._v && t.l._v.typ === "char" || t.r._v && t.r._v.typ === "char")) {
      notiz(`${t.text} ist vom Typ int (beim Rechnen wird aus char eine Zahl) → ausgegeben wird die Zahl ${x.wert}, nicht das Zeichen.`);
    }
    return String(x.wert);
  }

  function sichtbar(s) {
    return `„${s.replace(/\n/g, "⏎")}“`;
  }

  function fuehre(a, elseIf) {
    switch (a.k) {
      case "block":
        return fuehreBlock(a);
      case "leer":
        return null;
      case "dekl":
        fuehreDekl(a, false);
        return null;
      case "ausdr": {
        const e = a.e;
        const x = wert(e);
        let t;
        if (e.k === "zuw") {
          const name = e.ziel.k === "index" ? `${e.ziel.name}[${e.ziel.idx._v ? e.ziel.idx._v.wert : "?"}]` : e.ziel.name;
          if (e.op === "=") {
            const at = ausdrText(e.e);
            t = `${e.text}: ${at === e.e.text ? "" : at + " → "}${name} ist jetzt ${zeigeWert(x.typ, x.wert)}.`;
          } else {
            t = `${e.text}: ${name} = ${name} ${e.op[0]} ${ersetzt(e.e)} → ${name} ist jetzt ${zeigeWert(x.typ, x.wert)}.`;
          }
        } else if (e.k === "inc") {
          const name = e.ziel.k === "index" ? `${e.ziel.name}[${e.ziel.idx._v ? e.ziel.idx._v.wert : "?"}]` : e.ziel.name;
          t = `${e.text}: ${name} wird um 1 ${e.op === "++" ? "erhöht" : "verringert"} → ${name} ist jetzt ${zeigeWert(x.typ, e._neu)}.`;
        } else if (e.k === "aufruf") {
          t = `${e.text} ist erledigt – weiter in ${aktFrame().label}.`;
        } else {
          t = `${ausdrText(e)} (das Ergebnis wird nicht gespeichert).`;
        }
        schritt("anw", a.zeile, t);
        return null;
      }
      case "cout": {
        let neu = "";
        for (const t of a.teile) {
          if (t.k === "endl") {
            neu += "\n";
          } else if (t.k === "str") {
            neu += t.wert;
          } else {
            const x = wert(t);
            neu += coutText(x, t);
          }
        }
        ausgabe += neu;
        tabZeile.aus += neu;
        const werte = a.teile.filter((t) => t.k !== "str" && t.k !== "endl" && t.k !== "lit" && t._v);
        const ein = werte.length ? ` (${werte.map((t) => `${t.text} = ${zeigeWert(t._v.typ, t._v.wert)}`).join(", ")})` : "";
        schritt("ausgabe", a.zeile, `Ausgabe auf dem Bildschirm: ${sichtbar(neu)}${ein}.${neu.indexOf("\n") >= 0 ? " ⏎ ist ein Zeilenumbruch." : ""}`, { neu });
        return null;
      }
      case "if": {
        const x = wert(a.bed);
        if (a.bed.k === "zuw") {
          notiz(`Achtung: = ist eine Zuweisung, kein Vergleich! ${a.bed.ziel.text} bekommt den Wert ${zeigeWert(x.typ, x.wert)}, und jeder Wert außer 0 gilt als wahr. Gemeint war wohl ==.`);
        }
        const b = wahr(x, a.bed.text);
        const kopf = `${elseIf ? "else if" : "if"} (${a.bed.text})`;
        let folge;
        if (b) {
          folge = "der Block darunter wird ausgeführt.";
        } else if (a.sonst) {
          folge = a.sonst.k === "if" ? "weiter mit dem nächsten else if." : "weiter im else-Zweig.";
        } else {
          folge = "der Block wird übersprungen.";
        }
        schritt("bed", a.zeile, `${kopf}: ${bedText(a.bed, b)} → ${folge}`, { wahr: b });
        if (b) {
          return fuehre(a.dann);
        }
        if (a.sonst) {
          return fuehre(a.sonst, a.sonst.k === "if");
        }
        return null;
      }
      case "while": {
        let runde = 0;
        for (;;) {
          const x = wert(a.bed);
          const b = wahr(x, a.bed.text);
          schritt("bed", a.zeile, `while (${a.bed.text}): ${bedText(a.bed, b)} → ${b ? (runde === 0 ? "die Schleife startet." : "noch eine Runde.") : runde === 0 ? "die Schleife wird gar nicht ausgeführt." : `die Schleife endet nach ${runde} ${runde === 1 ? "Runde" : "Runden"}.`}`, { wahr: b });
          if (!b) {
            break;
          }
          runde++;
          const s = fuehre(a.rumpf);
          if (s) {
            if (s.art === "break") {
              break;
            }
            if (s.art === "continue") {
              continue;
            }
            return s;
          }
        }
        return null;
      }
      case "do": {
        let runde = 0;
        for (;;) {
          runde++;
          const s = fuehre(a.rumpf);
          if (s) {
            if (s.art === "break") {
              break;
            }
            if (s.art !== "continue") {
              return s;
            }
          }
          const x = wert(a.bed);
          const b = wahr(x, a.bed.text);
          schritt("bed", a.bedZeile, `while (${a.bed.text}) am Ende der do-while-Schleife: ${bedText(a.bed, b)} → ${b ? "noch eine Runde." : `die Schleife endet nach ${runde} ${runde === 1 ? "Runde" : "Runden"}.`}${runde === 1 && !b ? " Eine do-while-Schleife läuft immer mindestens einmal, weil die Bedingung erst am Ende geprüft wird." : ""}`, { wahr: b });
          if (!b) {
            break;
          }
        }
        return null;
      }
      case "for": {
        const f = aktFrame();
        f.bloecke.push(new Map());
        let ergebnis = null;
        if (a.init) {
          if (a.init.k === "dekl") {
            fuehreDekl(a.init, false);
          } else {
            fuehre(a.init);
          }
        }
        let runde = 0;
        for (;;) {
          let b = true;
          if (a.bed) {
            const x = wert(a.bed);
            b = wahr(x, a.bed.text);
            schritt("bed", a.zeile, `Bedingung der for-Schleife (${a.bed.text}): ${bedText(a.bed, b)} → ${b ? (runde === 0 ? "die Schleife startet." : "noch eine Runde.") : runde === 0 ? "die Schleife wird gar nicht ausgeführt." : `die Schleife endet nach ${runde} ${runde === 1 ? "Runde" : "Runden"}.`}`, { wahr: b });
          }
          if (!b) {
            break;
          }
          runde++;
          const s = fuehre(a.rumpf);
          if (s) {
            if (s.art === "break") {
              break;
            }
            if (s.art !== "continue") {
              ergebnis = s;
              break;
            }
          }
          if (a.schritt) {
            const x = wert(a.schritt);
            const e = a.schritt;
            let t;
            if (e.k === "inc") {
              t = `${e.text} am Ende der Runde: ${e.ziel.text} ist jetzt ${zeigeWert(x.typ, e._neu)}.`;
            } else if (e.k === "zuw") {
              t = `${e.text} am Ende der Runde: ${e.ziel.text} ist jetzt ${zeigeWert(x.typ, x.wert)}.`;
            } else {
              t = `${ausdrText(e)} am Ende der Runde.`;
            }
            schritt("anw", a.zeile, t);
          }
        }
        const weg = Array.from(f.bloecke[f.bloecke.length - 1].keys());
        if (weg.length && !(ergebnis && ergebnis.art === "return")) {
          schritt("block", a.zeile, `Die for-Schleife ist beendet: ${weg.join(", ")} ${weg.length > 1 ? "werden" : "wird"} gelöscht – im Kopf der for-Schleife deklarierte Variablen gelten nur innerhalb der Schleife.`, { weg });
        }
        f.bloecke.pop();
        return ergebnis;
      }
      case "break":
        schritt("sprung", a.zeile, "break: Die Schleife wird sofort verlassen.");
        return { art: "break" };
      case "continue":
        schritt("sprung", a.zeile, "continue: Der Rest dieser Runde wird übersprungen, es geht mit der nächsten Runde weiter.");
        return { art: "continue" };
      case "return": {
        const f = aktFrame();
        const fn = prog.funktionen[f.fname];
        let erg = { typ: fn.typ, wert: undefined };
        let t;
        if (a.e) {
          const x = wert(a.e);
          erg = { typ: fn.typ, wert: konvertiere(x, fn.typ, a.zeile) };
          const at = ausdrText(a.e);
          t = `return ${a.e.text}: ${at === a.e.text ? "" : at + " → "}`;
        } else {
          t = "return: ";
        }
        if (f.fname === "main") {
          t += "main ist fertig – das Programm endet.";
        } else {
          t += `${f.label} gibt ${a.e ? zeigeWert(erg.typ, erg.wert) : "nichts"} zurück. Ihre lokalen Variablen werden gelöscht, weiter beim Aufrufer.`;
        }
        schritt("return", a.zeile, t);
        return { art: "return", wert: erg };
      }
      default:
        throw new CppFehler("Unbekannte Anweisung.", a.zeile);
    }
  }

  function rufe(e) {
    const fn = prog.funktionen[e.name];
    if (!fn) {
      throw new CppFehler(`Eine Funktion ${e.name} gibt es nicht.`, e.zeile);
    }
    if (fn.params.length !== e.args.length) {
      throw new CppFehler(`${e.name} erwartet ${fn.params.length} Werte, bekommt aber ${e.args.length}.`, e.zeile);
    }
    if (stapel.length > 25) {
      throw new CppFehler("Zu viele verschachtelte Funktionsaufrufe.", e.zeile);
    }
    const args = e.args.map((a) => wert(a));
    const aufrufer = aktFrame().label;
    stapel.push({ fname: fn.name, label: `${fn.name}()`, bloecke: [new Map()] });
    const teile = [];
    fn.params.forEach((pa, i) => {
      const w = konvertiere(args[i], pa.typ, fn.zeile);
      lege(pa.name, pa.typ, w, fn.zeile, false);
      teile.push(`${pa.name} = ${zeigeWert(pa.typ, w)}`);
    });
    const aufrufText = e.args.length ? `${e.name}(${args.map((x) => zeigeWert(x.typ, x.wert)).join(", ")})` : e.text;
    schritt(
      "aufruf",
      fn.zeile,
      `Aufruf ${aufrufText}: Der Ablauf springt aus ${aufrufer} in die Funktion ${fn.name}.${teile.length ? ` Sie bekommt eigene Variablen mit Kopien der Werte: ${teile.join(", ")}.` : ""}`
    );
    const s = fuehreAnweisungen(fn.koerper.anw);
    let erg = { typ: fn.typ, wert: undefined };
    if (s && s.art === "return") {
      erg = s.wert;
    } else {
      if (fn.typ !== "void") {
        notiz(`Die Funktion ${fn.name} sollte mit return einen Wert zurückgeben – das fehlt hier.`);
      }
      schritt("return", fn.koerper.endZeile, `Ende der Funktion ${fn.name}: Ihre lokalen Variablen werden gelöscht, weiter in ${aufrufer}.`);
    }
    stapel.pop();
    return erg;
  }

  // --- Start --------------------------------------------------------------------
  let fehler = null;
  let fehlerArt = null;
  try {
    prog = parseCpp(src);
    stapel.push({ fname: "__global", label: "global", bloecke: [new Map()] });
    for (const d of prog.globale) {
      fuehreDekl(d, true);
    }
    stapel.pop();
    const main = prog.funktionen.main;
    stapel.push({ fname: "main", label: "main()", bloecke: [new Map()] });
    schritt("start", main.zeile, "Das Programm startet in der Funktion main().");
    const s = fuehreAnweisungen(main.koerper.anw);
    const anzeige = ausgabeNormal(ausgabe);
    schritt("ende", s ? schritte[schritte.length - 1].zeile : main.koerper.endZeile, `Das Programm ist zu Ende. Die gesamte Ausgabe ist der Code für das Schloss: ${anzeige ? "„" + anzeige + "“" : "(keine Ausgabe)"}.`, { fertig: true });
    stapel.pop();
  } catch (err) {
    if (err instanceof Abbruch) {
      fehler = `Nach ${MAX_SCHRITTE} Schritten abgebrochen – vermutlich eine Endlosschleife.`;
      fehlerArt = "endlos";
      schritte.pop();
      schritt("fehler", schritte.length ? schritte[schritte.length - 1].zeile : 1, fehler, { fehler: true });
    } else if (err instanceof CppFehler) {
      fehler = err.message;
      fehlerArt = err.art;
      notizen = [];
      schritt("fehler", err.zeile, err.message, { fehler: true, fehlerArt: err.art });
    } else {
      throw err;
    }
  }

  return { quelle: src, zeilen, schritte, tabelle, spalten, ausgabe, fehler, fehlerArt };
}

// Letzter bekannter Wert einer Variablen in main (für Prüfungsfragen)
function endwert(lauf, name) {
  for (let i = lauf.schritte.length - 1; i >= 0; i--) {
    const f = lauf.schritte[i].speicher.find((s) => s.art === "main");
    if (f) {
      const v = f.vars.find((x) => x.name === name);
      if (v) {
        return v;
      }
    }
  }
  return null;
}

if (typeof module !== "undefined") {
  module.exports = { fuehreAus, parseCpp, ausgabeNormal, fmtDouble, zeigeWert, zellText, endwert, wrapChar, wrapInt };
}
