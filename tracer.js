// =============================================================================
//  tracer.js – ein kleiner C++-Interpreter für kurze Übungsprogramme
// =============================================================================
//  Unterstützt das, was im Skript vorkommt:
//    int, char, double, bool, unsigned int, const
//    Arrays (auch char-Arrays als C-Strings mit '\0'), vector<…>, string
//    struct (auch verschachtelt, Arrays von structs)
//    Zeiger (* und &), Referenzparameter (int &z), Array-Parameter (int feld[])
//    if / else, while, do-while, for, for (int x : feld), break, continue
//    Funktionen mit return, globale und lokale Variablen
//    cout, Dateiströme fstream / ifstream / ofstream (<<, >>, get, getline)
//    strlen, strcpy, Methoden von vector, string und Dateiströmen
//
//  Das Programm wird vorab komplett ausgeführt. Ergebnis ist eine Liste von
//  Schritten mit Zeile, Erklärung, Hinweisen, Speicherbild und Ausgabe.
// =============================================================================

const MAX_SCHRITTE = 700;
const BASIS = ["int", "char", "double", "bool"];
const STROM_ARTEN = ["fstream", "ifstream", "ofstream"];
const MODUS = { in: 1, out: 2, app: 4, trunc: 8 };

class CppFehler extends Error {
  constructor(text, zeile, art) {
    super(text);
    this.zeile = zeile || 0;
    this.art = art || "fehler";
  }
}

// -----------------------------------------------------------------------------
// Typen
// -----------------------------------------------------------------------------
function tBasis(n) {
  return { k: "basis", name: n };
}
const T_INT = tBasis("int");
const T_CHAR = tBasis("char");
const T_DOUBLE = tBasis("double");
const T_BOOL = tBasis("bool");
const T_UNS = tBasis("unsigned");
const T_STRING = { k: "string" };
const T_CSTR = { k: "cstr" };
const T_VOID = { k: "void" };
const T_NULL = { k: "null" };

function typName(t) {
  switch (t.k) {
    case "basis":
      return t.name === "unsigned" ? "unsigned int" : t.name;
    case "array":
      return `${typName(t.elem)}[${t.n === null ? "" : t.n}]`;
    case "vector":
      return `vector<${typName(t.elem)}>`;
    case "string":
      return "string";
    case "cstr":
      return "Text";
    case "struct":
      return t.name;
    case "zeiger":
      return typName(t.ziel) + "*";
    case "ref":
      return typName(t.ziel) + "&";
    case "stream":
      return t.art;
    case "iter":
      return "Iterator";
    case "null":
      return "NULL";
    default:
      return "void";
  }
}

function groesse(t) {
  switch (t.k) {
    case "basis":
      return { char: 1, bool: 1, int: 4, unsigned: 4, double: 8 }[t.name];
    case "array":
      return (t.n || 0) * groesse(t.elem);
    case "struct":
      return t.felder.reduce((s, f) => s + groesse(f.t), 0) || 4;
    case "zeiger":
      return 4;
    case "vector":
      return 12;
    case "string":
      return 24;
    default:
      return 4;
  }
}

function istZahl(t) {
  return t.k === "basis";
}

// -----------------------------------------------------------------------------
// Zahlen umwandeln und darstellen
// -----------------------------------------------------------------------------
function wrapInt(x) {
  x = ((x % 4294967296) + 4294967296) % 4294967296;
  return x >= 2147483648 ? x - 4294967296 : x;
}
function wrapUns(x) {
  return ((x % 4294967296) + 4294967296) % 4294967296;
}
function wrapChar(x) {
  x = ((x % 256) + 256) % 256;
  return x >= 128 ? x - 256 : x;
}

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

function hexAdr(a) {
  return "0x" + a.toString(16).padStart(8, "0");
}

function zeichenText(w) {
  if (w === 0) {
    return "\\0";
  }
  return druckbar(w) ? String.fromCharCode(w) : String(w);
}

// Wert einer Grundtyp-Zahl für Erklärungen
function zeigeWert(name, w) {
  if (w === undefined) {
    return "?";
  }
  if (name === "char") {
    if (w === 0) {
      return "'\\0' (0)";
    }
    if (w === 10) {
      return "'\\n' (10)";
    }
    return druckbar(w) ? `'${String.fromCharCode(w)}' (${w})` : String(w);
  }
  if (name === "double") {
    return fmtDouble(w);
  }
  if (name === "bool") {
    return w ? "wahr" : "falsch";
  }
  return String(w);
}

// kurze Darstellung für die Tafel
function zellText(name, w) {
  if (w === undefined) {
    return "?";
  }
  if (name === "char") {
    if (w === 0) {
      return "'\\0'";
    }
    if (w === 10) {
      return "'\\n'";
    }
    return /[A-Za-z0-9]/.test(String.fromCharCode(w)) && druckbar(w) ? `'${String.fromCharCode(w)}'` : String(w);
  }
  if (name === "double") {
    return fmtDouble(w);
  }
  if (name === "bool") {
    return w ? "1" : "0";
  }
  return String(w);
}

// C-String aus einem char-Array (bis '\0')
function cString(z) {
  let s = "";
  for (const e of z.w) {
    if (e.w === 0) {
      return { text: s, ende: true };
    }
    s += e.w === undefined ? "?" : String.fromCharCode(e.w);
  }
  return { text: s, ende: false };
}

function ptrText(pw) {
  if (!pw || pw.wild) {
    return "? (zeigt irgendwohin)";
  }
  if (pw.nul) {
    return "NULL";
  }
  return `→ ${pw.name}`;
}

// Kurztext für beliebige (auch serialisierte) Zellen
function kurzText(z, tiefe) {
  tiefe = tiefe || 0;
  const t = z.t;
  switch (t.k) {
    case "basis":
      return zellText(t.name, z.w);
    case "string":
      return `"${z.w.replace(/\n/g, "⏎")}"`;
    case "array":
      if (t.elem.k === "basis" && t.elem.name === "char") {
        const c = cString(z);
        return c.ende ? `"${c.text}"` : `"${c.text}…" (ohne \\0)`;
      }
      return `{${z.w.map((e) => kurzText(e, tiefe + 1)).join(", ")}}`;
    case "vector":
      return `{${z.w.map((e) => kurzText(e, tiefe + 1)).join(", ")}}`;
    case "struct":
      return `{${t.felder.map((f) => kurzText(z.w[f.name], tiefe + 1)).join(", ")}}`;
    case "zeiger":
      return ptrText(z.w);
    case "stream":
      return z.w.datei ? `${z.w.datei}${z.w.offen ? "" : " (zu)"}` : "(keine Datei)";
    default:
      return "?";
  }
}

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
  const ops2 = ["<<", ">>", "<=", ">=", "==", "!=", "&&", "||", "++", "--", "+=", "-=", "*=", "/=", "%=", "->", "::"];
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
    if ("+-*/%<>=!(){}[];,.&|:".indexOf(c) >= 0) {
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
  const structs = {};

  function ist(text, o) {
    const t = tok[p + (o || 0)];
    return (t.art === "op" || t.art === "wort") && t.text === text;
  }
  function nimm(text) {
    if (!ist(text)) {
      throw new CppFehler(`„${text}“ erwartet, gefunden „${tok[p].text || "Ende"}“.`, tok[p].zeile);
    }
    return tok[p++];
  }
  function name() {
    if (tok[p].art !== "wort") {
      throw new CppFehler(`Name erwartet, gefunden „${tok[p].text}“.`, tok[p].zeile);
    }
    return tok[p++].text;
  }
  function istTyp(o) {
    o = o || 0;
    const t = tok[p + o];
    if (t.art !== "wort") {
      return false;
    }
    const w = t.text;
    if (BASIS.indexOf(w) >= 0 || ["void", "const", "unsigned", "vector", "string", "struct"].indexOf(w) >= 0 || STROM_ARTEN.indexOf(w) >= 0) {
      return true;
    }
    if (w === "std" && ist("::", o + 1)) {
      return istTyp(o + 2);
    }
    if (structs[w]) {
      const n = tok[p + o + 1];
      return n.art === "wort" || (n.art === "op" && (n.text === "*" || n.text === "&"));
    }
    return false;
  }
  function typ() {
    if (ist("const")) {
      p++;
    }
    if (ist("std") && ist("::", 1)) {
      p += 2;
    }
    if (ist("struct")) {
      p++;
      const n = name();
      if (!structs[n]) {
        throw new CppFehler(`Die Struktur ${n} ist nicht definiert.`, tok[p - 1].zeile);
      }
      return structs[n];
    }
    if (ist("unsigned")) {
      p++;
      if (ist("int")) {
        p++;
      }
      return T_UNS;
    }
    if (ist("vector")) {
      p++;
      nimm("<");
      const el = typ();
      nimm(">");
      return { k: "vector", elem: el };
    }
    const w = tok[p].text;
    if (w === "string") {
      p++;
      return T_STRING;
    }
    if (STROM_ARTEN.indexOf(w) >= 0) {
      p++;
      return { k: "stream", art: w };
    }
    if (BASIS.indexOf(w) >= 0) {
      p++;
      return tBasis(w);
    }
    if (w === "void") {
      p++;
      return T_VOID;
    }
    if (structs[w]) {
      p++;
      return structs[w];
    }
    throw new CppFehler(`Datentyp erwartet, gefunden „${w}“.`, tok[p].zeile);
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
    return binLinks(bitOder, ["&&"]);
  }
  function bitOder() {
    return binLinks(gleich, ["|"]);
  }
  function gleich() {
    return binLinks(vergleich, ["==", "!="]);
  }
  function vergleich() {
    return binLinks(schiebe, ["<", ">", "<=", ">="]);
  }
  function schiebe() {
    const start = tok[p];
    const l = additiv();
    if (ist("<<") || ist(">>")) {
      const richtung = tok[p].text;
      const teile = [];
      while (ist(richtung)) {
        p++;
        teile.push(additiv());
      }
      return knoten("strom", start, { ziel: l, richtung, teile });
    }
    return l;
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
    if (ist("*")) {
      p++;
      const e = unaer();
      return knoten("deref", start, { e });
    }
    if (ist("&")) {
      p++;
      const e = unaer();
      return knoten("adr", start, { e });
    }
    if (ist("++") || ist("--")) {
      const op = tok[p++].text;
      const z = unaer();
      return knoten("inc", start, { op, pre: true, ziel: z });
    }
    if (ist("(") && tok[p + 1].art === "wort" && (BASIS.indexOf(tok[p + 1].text) >= 0 || tok[p + 1].text === "unsigned") && ist(")", tok[p + 1].text === "unsigned" && ist("int", 2) ? 3 : 2)) {
      p++;
      const t = typ();
      p++;
      const e = unaer();
      return knoten("cast", start, { typ: t, e });
    }
    return postfix();
  }
  function postfix() {
    const start = tok[p];
    let e = primaer();
    for (;;) {
      if (ist("[")) {
        p++;
        const idx = ausdruck();
        nimm("]");
        e = knoten("index", start, { basis: e, idx });
      } else if (ist(".") || ist("->")) {
        const pfeil = tok[p++].text === "->";
        const feld = name();
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
          e = knoten("methode", start, { obj: e, name: feld, args, pfeil });
        } else {
          e = knoten("feld", start, { obj: e, feld, pfeil });
        }
      } else if (ist("++") || ist("--")) {
        const op = tok[p++].text;
        e = knoten("inc", start, { op, pre: false, ziel: e });
      } else {
        break;
      }
    }
    return e;
  }
  function primaer() {
    const start = tok[p];
    const t = tok[p];
    if (t.art === "zahl") {
      p++;
      return knoten("lit", start, { typ: t.dbl ? T_DOUBLE : T_INT, wert: t.wert });
    }
    if (t.art === "zeichen") {
      p++;
      return knoten("lit", start, { typ: T_CHAR, wert: t.wert });
    }
    if (t.art === "text") {
      p++;
      return knoten("str", start, { wert: t.wert });
    }
    if (ist("true") || ist("false")) {
      p++;
      return knoten("lit", start, { typ: T_BOOL, wert: t.text === "true" ? 1 : 0 });
    }
    if (ist("NULL") || ist("nullptr")) {
      p++;
      return knoten("nullp", start, {});
    }
    if (ist("(")) {
      p++;
      const e = ausdruck();
      nimm(")");
      return knoten("klammer", start, { e });
    }
    if (t.art === "wort") {
      if (t.text === "std" && ist("::", 1)) {
        p += 2;
        return primaer();
      }
      if ((t.text === "ios" || STROM_ARTEN.indexOf(t.text) >= 0) && ist("::", 1)) {
        p += 2;
        const m = name();
        if (MODUS[m] === undefined) {
          throw new CppFehler(`Unbekannter Dateimodus ${m}.`, t.zeile);
        }
        return knoten("lit", start, { typ: T_INT, wert: MODUS[m], modus: true });
      }
      if (BASIS.indexOf(t.text) >= 0 && ist("(", 1)) {
        p += 2;
        const e = ausdruck();
        nimm(")");
        return knoten("cast", start, { typ: tBasis(t.text), e });
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

  // --- Deklarationen -------------------------------------------------------------
  function deklarator(basisTyp, erlaubeRef) {
    let t = basisTyp;
    while (ist("*")) {
      p++;
      t = { k: "zeiger", ziel: t };
    }
    let ref = false;
    if (ist("&")) {
      if (!erlaubeRef) {
        throw new CppFehler("Referenzen (&) gibt es hier nur bei Funktionsparametern.", tok[p].zeile);
      }
      p++;
      ref = true;
    }
    const nm = name();
    let laenge = null;
    let istArr = false;
    if (ist("[")) {
      p++;
      istArr = true;
      if (!ist("]")) {
        laenge = ausdruck();
      }
      nimm("]");
    }
    return { name: nm, t, ref, istArr, laenge };
  }
  function initListe() {
    nimm("{");
    const liste = [];
    while (!ist("}")) {
      liste.push(ist("{") ? initListe() : zuweisung());
      if (ist(",")) {
        p++;
      }
    }
    p++;
    return { k: "liste", liste };
  }
  function deklaration() {
    const start = tok[p];
    const basisTyp = typ();
    const vars = [];
    for (;;) {
      const d = deklarator(basisTyp, false);
      let init = null;
      if (ist("=")) {
        p++;
        init = ist("{") ? initListe() : zuweisung();
      } else if (ist("{")) {
        init = initListe();
      } else if (ist("(")) {
        p++;
        const args = [];
        while (!ist(")")) {
          args.push(zuweisung());
          if (ist(",")) {
            p++;
          }
        }
        p++;
        init = { k: "ctor", args };
      }
      d.init = init;
      vars.push(d);
      if (ist(",")) {
        p++;
        continue;
      }
      break;
    }
    return knoten("dekl", start, { vars });
  }
  function structDef() {
    nimm("struct");
    const n = name();
    const st = { k: "struct", name: n, felder: [] };
    structs[n] = st;
    nimm("{");
    while (!ist("}")) {
      const bt = typ();
      for (;;) {
        const d = deklarator(bt, false);
        let ft = d.t;
        if (d.istArr) {
          if (!d.laenge || d.laenge.k !== "lit") {
            throw new CppFehler("Arrays in einer Struktur brauchen eine feste Größe.", tok[p].zeile);
          }
          ft = { k: "array", elem: d.t, n: d.laenge.wert };
        }
        st.felder.push({ name: d.name, t: ft });
        if (ist(",")) {
          p++;
          continue;
        }
        break;
      }
      nimm(";");
    }
    nimm("}");
    nimm(";");
  }

  // --- Anweisungen -------------------------------------------------------------
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
      // for (int x : feld)
      if (istTyp()) {
        const merke = p;
        const bt = typ();
        const d = deklarator(bt, true);
        if (ist(":")) {
          p++;
          const quelle = ausdruck();
          nimm(")");
          const rumpf = anweisung();
          return { k: "foreach", var: d, quelle, rumpf, zeile: start.zeile, text: src.slice(start.pos, tok[p - 1].ende) };
        }
        p = merke;
      }
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
    if (ist("struct") && ist("{", 2)) {
      structDef();
      continue;
    }
    if (!istTyp()) {
      throw new CppFehler(`Unerwartet: „${tok[p].text}“.`, tok[p].zeile);
    }
    const start = tok[p];
    const merke = p;
    let t = typ();
    while (ist("*")) {
      p++;
      t = { k: "zeiger", ziel: t };
    }
    const nm = name();
    if (ist("(")) {
      p++;
      const params = [];
      while (!ist(")")) {
        const bt = typ();
        const d = deklarator(bt, true);
        params.push(d);
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
  return { globale, funktionen, structs };
}

// =============================================================================
// Ausführen
// =============================================================================
class Abbruch extends Error {}

function fuehreAus(src, opt) {
  opt = opt || {};
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
  const dateien = {};
  const geoeffnet = [];
  let zellId = 0;
  let adrGlobal = 0x00407000;
  let adrStapel = 0x0028ff00;
  let prog;
  for (const n of Object.keys(opt.dateien || {})) {
    dateien[n] = { inhalt: opt.dateien[n], neu: false };
  }

  // --- Zellen ----------------------------------------------------------------
  function neueZelle(t, init, root, label) {
    const z = { id: ++zellId, t, root, label };
    switch (t.k) {
      case "basis":
        z.w = init === "null" ? 0 : undefined;
        break;
      case "array":
        z.w = [];
        for (let i = 0; i < t.n; i++) {
          const e = neueZelle(t.elem, init, root, `${label}[${i}]`);
          e.index = i;
          e.arr = z;
          z.w.push(e);
        }
        break;
      case "vector":
        z.w = [];
        break;
      case "string":
        z.w = "";
        break;
      case "struct":
        z.w = {};
        for (const f of t.felder) {
          z.w[f.name] = neueZelle(f.t, init, root, `${label}.${f.name}`);
        }
        break;
      case "zeiger":
        z.w = init === "null" ? { nul: true } : { wild: true };
        break;
      case "stream":
        z.w = { datei: null, modi: 0, pos: 0, offen: false, fehler: false };
        break;
      default:
        z.w = undefined;
    }
    return z;
  }

  function adressen(z, adr) {
    z.adr = adr;
    if (z.t.k === "array") {
      const g = groesse(z.t.elem);
      z.w.forEach((e, i) => adressen(e, adr + i * g));
    } else if (z.t.k === "struct") {
      let a = adr;
      for (const f of z.t.felder) {
        adressen(z.w[f.name], a);
        a += groesse(f.t);
      }
    }
  }

  function vektorElement(v, wertRv, i) {
    const e = neueZelle(v.t.elem, "null", v.root, `${v.label}[${i}]`);
    e.index = i;
    e.arr = v;
    e.adr = 0x00a01000 + v.id * 64 + i * groesse(v.t.elem);
    if (wertRv) {
      zuweise(e, wertRv, 0, true);
    }
    return e;
  }

  function vektorNeuNummerieren(v) {
    v.w.forEach((e, i) => {
      e.index = i;
      e.label = `${v.label}[${i}]`;
      e.adr = 0x00a01000 + v.id * 64 + i * groesse(v.t.elem);
    });
  }

  // --- Schritt festhalten ---------------------------------------------------------
  function ser(z) {
    const s = { id: z.id, t: z.t, adr: z.adr };
    switch (z.t.k) {
      case "array":
      case "vector":
        s.w = z.w.map(ser);
        break;
      case "struct":
        s.w = {};
        for (const f of z.t.felder) {
          s.w[f.name] = ser(z.w[f.name]);
        }
        break;
      case "zeiger":
        s.w = z.w.ziel ? { ziel: z.w.ziel.id, name: z.w.name, adr: z.w.ziel.adr } : Object.assign({}, z.w);
        break;
      case "stream":
        s.w = Object.assign({}, z.w);
        break;
      default:
        s.w = z.w;
    }
    return s;
  }

  function speicherBild() {
    const bild = [];
    const v2s = (v, tiefe) => ({ name: v.name, key: v.key, tiefe, alias: v.alias || null, adr: v.z.adr, z: ser(v.z) });
    if (global.size) {
      bild.push({ titel: "global", art: "global", vars: Array.from(global.values()).map((v) => v2s(v, 0)) });
    }
    stapel.forEach((f) => {
      if (f.fname === "__global") {
        return;
      }
      const vars = [];
      f.bloecke.forEach((b, tiefe) => {
        for (const v of b.values()) {
          vars.push(v2s(v, tiefe));
        }
      });
      bild.push({ titel: f.label, art: f.fname === "main" ? "main" : "funktion", vars });
    });
    return bild;
  }

  function dateiBild() {
    return Object.keys(dateien).map((n) => {
      const strme = geoeffnet.filter((s) => s.w.offen && s.w.datei === n);
      return {
        name: n,
        inhalt: dateien[n].inhalt,
        neu: dateien[n].neu,
        lese: strme.filter((s) => s.w.modi & MODUS.in).map((s) => s.w.pos),
        schreib: strme.some((s) => s.w.modi & (MODUS.out | MODUS.app)),
      };
    });
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
          dateien: dateiBild(),
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

  function notiereTab(key, name, text) {
    if (spaltenIdx[key] === undefined) {
      spaltenIdx[key] = spalten.length;
      spalten.push({ key, name });
    }
    tabZeile.zellen[key] = text;
    geaendert.push(key);
  }

  // Änderung einer Zelle in der Tafel festhalten
  function notiereZelle(z) {
    const r = z.root;
    if (!r) {
      return;
    }
    // Element eines Zahlen-Arrays: eigene Spalte
    if (z.arr && z.arr === r.z && r.z.t.k === "array" && z.t.k === "basis" && !(z.t.name === "char")) {
      notiereTab(`${r.key}[${z.index}]`, z.label, zellText(z.t.name, z.w));
      return;
    }
    notiereTab(r.key, r.name, kurzText(r.z));
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

  function lege(name, t, zeile, istGlobal, init, aliasZelle) {
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
    const v = { name, key };
    if (aliasZelle) {
      v.z = aliasZelle;
      v.alias = aliasZelle.label;
    } else {
      v.z = neueZelle(t, istGlobal ? "null" : init, v, name);
      const g = groesse(t);
      if (istGlobal) {
        adressen(v.z, adrGlobal);
        adrGlobal += Math.max(4, g);
      } else {
        adrStapel -= Math.max(4, Math.ceil(g / 4) * 4);
        adressen(v.z, adrStapel);
      }
    }
    scope.set(name, v);
    return v;
  }

  // --- Umwandeln ---------------------------------------------------------------
  function konvertiere(x, zuName, zeile) {
    if (x.t.k !== "basis") {
      throw new CppFehler(`Ein Wert vom Typ ${typName(x.t)} passt nicht in einen ${zuName === "unsigned" ? "unsigned int" : zuName}.`, zeile);
    }
    let w = x.w;
    if (w === undefined) {
      return undefined;
    }
    if (zuName === "double") {
      return w;
    }
    if (zuName === "bool") {
      return w !== 0 ? 1 : 0;
    }
    if (x.t.name === "double") {
      const t = Math.trunc(w);
      if (t !== w) {
        notiz(`Umwandlung von double nach ${zuName}: Die Nachkommastellen werden abgeschnitten (nicht gerundet): ${fmtDouble(w)} → ${t}.`);
      }
      w = t;
    }
    if (zuName === "char" && (w < -128 || w > 127)) {
      const neu = wrapChar(w);
      notiz(`${w} passt nicht in einen char (Wertebereich −128 … 127). Überlauf: Es geht auf der anderen Seite weiter → ${neu}.`);
      flags.ueberlauf = true;
      return neu;
    }
    if (zuName === "int" && (w < -2147483648 || w > 2147483647)) {
      const neu = wrapInt(w);
      notiz(`${w} passt nicht in einen int (Wertebereich −2147483648 … 2147483647). Überlauf → ${neu}.`);
      flags.ueberlauf = true;
      return neu;
    }
    if (zuName === "unsigned" && (w < 0 || w > 4294967295)) {
      const neu = wrapUns(w);
      notiz(`${w} passt nicht in einen unsigned int (0 … 4294967295). Überlauf → ${neu}.`);
      flags.ueberlauf = true;
      return neu;
    }
    return w;
  }

  function kopiere(ziel, quelle) {
    switch (ziel.t.k) {
      case "basis":
      case "string":
        ziel.w = quelle.w;
        break;
      case "zeiger":
        ziel.w = Object.assign({}, quelle.w);
        break;
      case "array":
        ziel.w.forEach((e, i) => kopiere(e, quelle.w[i]));
        break;
      case "struct":
        for (const f of ziel.t.felder) {
          kopiere(ziel.w[f.name], quelle.w[f.name]);
        }
        break;
      case "vector":
        ziel.w = quelle.w.map((e, i) => {
          const n = vektorElement(ziel, null, i);
          kopiere(n, e);
          return n;
        });
        break;
      default:
        break;
    }
  }

  function zeigerAuf(z) {
    return { ziel: z, name: z.label, arr: z.arr || null, idx: z.arr ? z.index : null };
  }

  // Wert in eine Zelle schreiben
  function zuweise(z, x, zeile, still) {
    const t = z.t;
    switch (t.k) {
      case "basis":
        z.w = konvertiere(x, t.name, zeile);
        break;
      case "string":
        if (x.t.k === "string" || x.t.k === "cstr") {
          z.w = x.w;
        } else if (x.t.k === "basis" && x.t.name === "char") {
          z.w = String.fromCharCode(x.w);
        } else if (x.t.k === "array" && x.zelle.t.elem.name === "char") {
          z.w = cString(x.zelle).text;
        } else {
          throw new CppFehler(`Ein ${typName(x.t)} kann man keinem string zuweisen.`, zeile);
        }
        break;
      case "zeiger":
        if (x.t.k === "zeiger") {
          z.w = Object.assign({}, x.w);
        } else if (x.t.k === "null" || (x.t.k === "basis" && x.w === 0)) {
          z.w = { nul: true };
        } else if (x.t.k === "array") {
          z.w = zeigerAuf(x.zelle.w[0]);
          if (!still) {
            notiz(`Der Name eines Arrays steht für die Adresse seines ersten Elements: ${z.label} zeigt jetzt auf ${x.zelle.label}[0].`);
          }
        } else {
          throw new CppFehler(`Einem Zeiger kann man nur eine Adresse zuweisen (z. B. &variable), keinen ${typName(x.t)}.`, zeile);
        }
        break;
      case "struct":
        if (x.t !== t) {
          throw new CppFehler(`Ein ${typName(x.t)} passt nicht in eine Strukturvariable vom Typ ${t.name}.`, zeile);
        }
        kopiere(z, x.zelle);
        break;
      case "vector":
        if (x.t.k !== "vector") {
          throw new CppFehler("Einem vector kann man nur einen anderen vector zuweisen.", zeile);
        }
        kopiere(z, x.zelle);
        break;
      case "array":
        throw new CppFehler(
          t.elem.k === "basis" && t.elem.name === "char"
            ? `Einem char-Array kann man mit = keinen Text zuweisen – dafür gibt es strcpy(${z.label}, "…") aus <cstring>.`
            : "Einem ganzen Array kann man nichts zuweisen – nur einzelnen Elementen.",
          zeile
        );
      default:
        throw new CppFehler(`Einer Variablen vom Typ ${typName(t)} kann man so nichts zuweisen.`, zeile);
    }
    if (!still) {
      notiereZelle(z);
    }
  }

  function rv(z) {
    switch (z.t.k) {
      case "basis":
      case "string":
        return { t: z.t, w: z.w };
      case "zeiger":
        return { t: z.t, w: z.w };
      default:
        return { t: z.t, zelle: z };
    }
  }

  // --- Rechnen -----------------------------------------------------------------
  function charHinweis(x) {
    if (x.t.k === "basis" && x.t.name === "char" && x.w !== undefined && druckbar(x.w)) {
      notiz(`Zum Rechnen wird das Zeichen ${zeigeWert("char", x.w)} als Zahl ${x.w} benutzt (ASCII-Code).`);
    }
  }

  function rechne(op, a, b, zeile) {
    // Zeiger und Iteratoren
    if (a.t.k === "zeiger" && b.t.k === "basis" && (op === "+" || op === "-")) {
      const pw = a.w;
      if (!pw.arr) {
        throw new CppFehler("Mit einem Zeiger rechnen darf man nur innerhalb eines Arrays.", zeile);
      }
      const idx = pw.idx + (op === "+" ? b.w : -b.w);
      notiz(`Zeigerarithmetik: ${op === "+" ? "+" : "−"} ${b.w} verschiebt den Zeiger um ${b.w} Elemente (${b.w} · ${groesse(pw.arr.t.elem)} Byte).`);
      if (idx < 0 || idx >= pw.arr.w.length) {
        return { t: a.t, w: { aussen: true, name: `${pw.arr.label}[${idx}]` } };
      }
      return { t: a.t, w: zeigerAuf(pw.arr.w[idx]) };
    }
    if (a.t.k === "iter" && b.t.k === "basis") {
      return { t: a.t, w: a.w + (op === "+" ? b.w : -b.w), vec: a.vec };
    }
    if (["==", "!="].indexOf(op) >= 0 && (a.t.k === "zeiger" || a.t.k === "null")) {
      const ziel = (x) => (x.t.k === "null" ? null : x.w.ziel || null);
      const gleich = ziel(a) === ziel(b) && !(a.w && a.w.wild);
      return { t: T_BOOL, w: (op === "==") === gleich ? 1 : 0 };
    }
    if (a.t.k === "string" || (b.t.k === "string" && op === "+")) {
      const s = (x) => (x.t.k === "string" || x.t.k === "cstr" ? x.w : x.t.k === "basis" && x.t.name === "char" ? String.fromCharCode(x.w) : null);
      const sa = s(a);
      const sb = s(b);
      if (sa === null || sb === null) {
        throw new CppFehler("Mit einem string kann man nur Texte und Zeichen verknüpfen.", zeile);
      }
      if (op === "+") {
        return { t: T_STRING, w: sa + sb };
      }
      if (op === "==" || op === "!=") {
        return { t: T_BOOL, w: (op === "==") === (sa === sb) ? 1 : 0 };
      }
      throw new CppFehler(`Den Operator ${op} gibt es für strings hier nicht.`, zeile);
    }
    if (a.t.k !== "basis" || b.t.k !== "basis") {
      throw new CppFehler(`Mit ${typName(a.t)} und ${typName(b.t)} kann man nicht ${op} rechnen.`, zeile);
    }
    if (["<", ">", "<=", ">=", "==", "!="].indexOf(op) >= 0) {
      if (a.w === undefined || b.w === undefined) {
        return { t: T_BOOL, w: undefined };
      }
      charHinweis(a);
      charHinweis(b);
      let x = a.w;
      let y = b.w;
      if ((a.t.name === "unsigned") !== (b.t.name === "unsigned") && a.t.name !== "double" && b.t.name !== "double") {
        if ((a.t.name === "unsigned" && y < 0) || (b.t.name === "unsigned" && x < 0)) {
          notiz("Vergleich von unsigned mit einer negativen Zahl: Die negative Zahl wird in unsigned umgewandelt und ist dann riesig.");
          x = wrapUns(x);
          y = wrapUns(y);
        }
      }
      const r = { "<": x < y, ">": x > y, "<=": x <= y, ">=": x >= y, "==": x === y, "!=": x !== y }[op];
      if ((op === "==" || op === "!=") && (a.t.name === "double" || b.t.name === "double") && x !== y && Math.abs(x - y) < 1e-9) {
        notiz(`Vorsicht beim Vergleich von double-Werten: Zahlen wie 0.1 oder 0.2 lassen sich im Binärsystem nicht exakt speichern (siehe Gleitpunktzahlen). Intern ist das Ergebnis ${x.toPrecision(17)}, nicht ${y.toPrecision(17)} – also nicht gleich.`);
      }
      return { t: T_BOOL, w: r ? 1 : 0 };
    }
    if (op === "|") {
      return { t: T_INT, w: a.w | b.w };
    }
    const dbl = a.t.name === "double" || b.t.name === "double";
    const uns = !dbl && (a.t.name === "unsigned" || b.t.name === "unsigned");
    const t = dbl ? T_DOUBLE : uns ? T_UNS : T_INT;
    if (a.w === undefined || b.w === undefined) {
      return { t, w: undefined };
    }
    charHinweis(a);
    charHinweis(b);
    const x = a.w;
    const y = b.w;
    if (dbl) {
      if (op === "%") {
        throw new CppFehler("Der Operator % geht nur mit ganzen Zahlen.", zeile);
      }
      if (op === "/" && y === 0) {
        throw new CppFehler("Division durch 0.", zeile);
      }
      return { t, w: { "+": x + y, "-": x - y, "*": x * y, "/": x / y }[op] };
    }
    let exakt;
    let w;
    if (op === "/" || op === "%") {
      if (y === 0) {
        throw new CppFehler("Division durch 0 – das Programm stürzt ab.", zeile);
      }
      if (op === "/") {
        w = Math.trunc(x / y);
        if (x % y !== 0) {
          notiz(`${x} / ${y} ist eine Ganzzahldivision (beide Werte ganzzahlig): Das Ergebnis ist ${w}, der Rest ${x % y} fällt weg.`);
        }
      } else {
        w = x % y;
        notiz(`% liefert den Rest der Division: ${x} % ${y} = ${w} (denn ${x} = ${Math.trunc(x / y)} · ${y} + ${w}).`);
      }
      return { t, w };
    }
    if (op === "*") {
      exakt = x * y;
      w = uns ? wrapUns(exakt) : Math.imul(x, y);
    } else {
      exakt = op === "+" ? x + y : x - y;
      w = uns ? wrapUns(exakt) : wrapInt(exakt);
    }
    if (exakt !== w) {
      notiz(uns ? `${exakt} passt nicht in einen unsigned int (0 … 4294967295). Überlauf → ${w}.` : `${exakt} passt nicht in einen int (Wertebereich −2147483648 … 2147483647). Überlauf → ${w}.`);
      flags.ueberlauf = true;
    }
    return { t, w };
  }

  function wahr(x, text) {
    if (x.t.k === "stream") {
      return x.zelle.w.offen && !x.zelle.w.fehler;
    }
    if (x.t.k === "zeiger") {
      return !!x.w.ziel;
    }
    if (x.t.k === "null") {
      return false;
    }
    if (x.t.k !== "basis") {
      throw new CppFehler(`${text} ist keine Bedingung.`, 0);
    }
    if (x.w === undefined) {
      notiz(`Der Wert von ${text} ist unbestimmt (zufällig) – hier wird „falsch“ angenommen.`);
      return false;
    }
    return x.w !== 0;
  }

  // --- Orte (Zellen zum Lesen und Schreiben) -----------------------------------------
  function ziel(pw, zeile, text) {
    if (!pw || pw.wild) {
      flags.oob = true;
      throw new CppFehler(`${text} hat keine gültige Adresse (nicht initialisierter Zeiger) – das Programm greift irgendwo in den Speicher. Meist stürzt es ab.`, zeile, "zeiger");
    }
    if (pw.nul) {
      flags.oob = true;
      throw new CppFehler(`${text} ist ein Nullzeiger (NULL) – er zeigt auf nichts. Der Zugriff lässt das Programm abstürzen.`, zeile, "zeiger");
    }
    if (pw.aussen) {
      flags.oob = true;
      throw new CppFehler(`Der Zeiger zeigt auf ${pw.name} – außerhalb des Arrays (undefiniertes Verhalten).`, zeile, "oob");
    }
    return pw.ziel;
  }

  function indexWert(e) {
    const ix = wert(e.idx);
    if (ix.t.k !== "basis" || ix.t.name === "double") {
      throw new CppFehler("Ein Index muss eine ganze Zahl sein.", e.zeile);
    }
    if (ix.w === undefined) {
      throw new CppFehler(`Der Index ${e.idx.text} hat keinen Wert.`, e.zeile);
    }
    return ix.w;
  }

  function oob(name, i, n, zeile, vec) {
    flags.oob = true;
    throw new CppFehler(
      `Zugriff auf ${name}[${i}] – ${vec ? "der vector" : "das Array"} hat ${n === 0 ? "gar keine Elemente" : `nur die Elemente 0 bis ${n - 1}`}. Das ist ein Zugriff außerhalb${vec ? " des vectors" : " des Arrays"}: In C++ ist dann alles möglich (undefiniertes Verhalten), oft stürzt das Programm ab.`,
      zeile,
      "oob"
    );
  }

  function ort(e) {
    switch (e.k) {
      case "var": {
        const v = finde(e.name, e.zeile);
        return v.z;
      }
      case "klammer":
        return ort(e.e);
      case "index": {
        const bz = e.basis.k === "var" || e.basis.k === "feld" || e.basis.k === "index" || e.basis.k === "klammer" || e.basis.k === "deref" ? ort(e.basis) : null;
        const i = indexWert(e);
        if (bz && (bz.t.k === "array" || bz.t.k === "vector")) {
          if (i < 0 || i >= bz.w.length) {
            oob(bz.label, i, bz.w.length, e.zeile, bz.t.k === "vector");
          }
          return bz.w[i];
        }
        if (bz && bz.t.k === "string") {
          if (i < 0 || i >= bz.w.length) {
            oob(bz.label, i, bz.w.length, e.zeile, false);
          }
          return { t: T_CHAR, w: bz.w.charCodeAt(i), strZelle: bz, index: i, label: `${bz.label}[${i}]`, root: bz.root };
        }
        const pv = bz ? rv(bz) : wert(e.basis);
        if (pv.t.k === "zeiger") {
          const pw = pv.w;
          const start = ziel(pw, e.zeile, e.basis.text);
          if (!pw.arr) {
            if (i === 0) {
              return start;
            }
            throw new CppFehler(`${e.basis.text} zeigt nicht in ein Array – ${e.text} ist undefiniert.`, e.zeile, "oob");
          }
          const j = pw.idx + i;
          if (j < 0 || j >= pw.arr.w.length) {
            oob(pw.arr.label, j, pw.arr.w.length, e.zeile, false);
          }
          return pw.arr.w[j];
        }
        throw new CppFehler(`${e.basis.text} ist kein Array.`, e.zeile);
      }
      case "feld": {
        let sz;
        if (e.pfeil) {
          const pv = wert(e.obj);
          if (pv.t.k !== "zeiger") {
            throw new CppFehler(`-> geht nur mit einem Zeiger, ${e.obj.text} ist keiner.`, e.zeile);
          }
          sz = ziel(pv.w, e.zeile, e.obj.text);
        } else {
          sz = ort(e.obj);
        }
        if (sz.t.k !== "struct") {
          throw new CppFehler(`${e.obj.text} ist keine Strukturvariable – der Punkt-Operator geht hier nicht.`, e.zeile);
        }
        if (!sz.w[e.feld]) {
          throw new CppFehler(`Die Struktur ${sz.t.name} hat keine Komponente ${e.feld}.`, e.zeile);
        }
        return sz.w[e.feld];
      }
      case "deref": {
        const pv = wert(e.e);
        if (pv.t.k !== "zeiger") {
          throw new CppFehler(`* (Inhalt von) geht nur mit einem Zeiger, ${e.e.text} ist keiner.`, e.zeile);
        }
        return ziel(pv.w, e.zeile, e.e.text);
      }
      default:
        throw new CppFehler(`${e.text} ist keine Variable – hier kann man nichts hineinschreiben.`, e.zeile);
    }
  }

  function schreibeOrt(z, x, zeile) {
    if (z.strZelle) {
      const s = z.strZelle;
      const c = konvertiere(x, "char", zeile);
      s.w = s.w.slice(0, z.index) + String.fromCharCode(c) + s.w.slice(z.index + 1);
      notiereZelle(s);
      return;
    }
    zuweise(z, x, zeile);
  }

  // --- Ausdrücke auswerten --------------------------------------------------------
  function wert(e) {
    switch (e.k) {
      case "lit":
        e._v = { t: e.typ, w: e.wert };
        return e._v;
      case "str":
        e._v = { t: T_CSTR, w: e.wert };
        return e._v;
      case "nullp":
        e._v = { t: T_NULL, w: null };
        return e._v;
      case "klammer":
        e._v = wert(e.e);
        return e._v;
      case "var":
      case "index":
      case "feld":
      case "deref": {
        const z = ort(e);
        if (z.strZelle) {
          e._v = { t: T_CHAR, w: z.w };
          return e._v;
        }
        if (z.t.k === "basis" && z.w === undefined) {
          notiz(`${z.label} hat keinen Startwert – im Speicher steht irgendein zufälliger Wert (?).`);
        }
        if (e.k === "deref") {
          notiz(`*${e.e.text} liest den Inhalt der Adresse, auf die ${e.e.text} zeigt (${z.label}).`);
        }
        e._v = rv(z);
        return e._v;
      }
      case "adr": {
        const z = ort(e.e);
        if (z.strZelle) {
          throw new CppFehler("Die Adresse eines Zeichens in einem string wird hier nicht unterstützt.", e.zeile);
        }
        e._v = { t: { k: "zeiger", ziel: z.t }, w: zeigerAuf(z) };
        return e._v;
      }
      case "bin": {
        if (e.op === "&&" || e.op === "||") {
          const l = wert(e.l);
          const lw = wahr(l, e.l.text);
          if (e.op === "&&" && !lw) {
            e._v = { t: T_BOOL, w: 0 };
            return e._v;
          }
          if (e.op === "||" && lw) {
            e._v = { t: T_BOOL, w: 1 };
            return e._v;
          }
          const r = wert(e.r);
          e._v = { t: T_BOOL, w: wahr(r, e.r.text) ? 1 : 0 };
          return e._v;
        }
        let l = wert(e.l);
        let r = wert(e.r);
        if (l.t.k === "array") {
          l = { t: { k: "zeiger", ziel: l.t.elem }, w: zeigerAuf(l.zelle.w[0]) };
        }
        e._v = rechne(e.op, l, r, e.zeile);
        return e._v;
      }
      case "un": {
        const x = wert(e.e);
        if (e.op === "!") {
          e._v = { t: T_BOOL, w: x.t.k === "basis" ? (x.w === undefined ? undefined : x.w ? 0 : 1) : wahr(x, e.e.text) ? 0 : 1 };
        } else if (e.op === "-") {
          e._v = rechne("-", { t: x.t.name === "double" ? T_DOUBLE : T_INT, w: 0 }, x, e.zeile);
        } else {
          e._v = { t: x.t.name === "double" ? T_DOUBLE : T_INT, w: x.w };
        }
        return e._v;
      }
      case "cast": {
        const x = wert(e.e);
        e._v = { t: e.typ, w: konvertiere(x, e.typ.name, e.zeile) };
        if (e.typ.name === "int" && x.t.name === "char" && x.w !== undefined && druckbar(x.w)) {
          notiz(`(int) macht aus dem Zeichen eine Zahl: ${zeigeWert("char", x.w)} → ${x.w}.`);
        }
        return e._v;
      }
      case "zuw": {
        const z = ort(e.ziel);
        let x = wert(e.e);
        if (e.op !== "=") {
          x = rechne(e.op[0], rv(z.strZelle ? z : z), x, e.zeile);
        }
        schreibeOrt(z, x, e.zeile);
        e._ziel = z.strZelle ? { label: z.label, t: T_CHAR } : z;
        e._v = z.strZelle ? { t: T_CHAR, w: z.strZelle.w.charCodeAt(z.index) } : rv(z);
        return e._v;
      }
      case "inc": {
        const z = ort(e.ziel);
        const alt = rv(z);
        let neu;
        if (alt.t.k === "zeiger") {
          neu = rechne(e.op === "++" ? "+" : "-", alt, { t: T_INT, w: 1 }, e.zeile);
        } else {
          if (alt.w === undefined) {
            notiz(`${e.ziel.text} hat keinen Startwert – das Ergebnis ist zufällig.`);
          }
          neu = rechne(e.op === "++" ? "+" : "-", { t: alt.t.name === "double" ? T_DOUBLE : alt.t.name === "unsigned" ? T_UNS : T_INT, w: alt.w }, { t: T_INT, w: 1 }, e.zeile);
        }
        schreibeOrt(z, neu, e.zeile);
        const jetzt = z.strZelle ? { t: T_CHAR, w: z.strZelle.w.charCodeAt(z.index) } : rv(z);
        e._v = e.pre ? jetzt : alt;
        e._neu = jetzt;
        e._ziel = z.strZelle ? { label: z.label } : z;
        return e._v;
      }
      case "aufruf":
        e._v = rufe(e);
        return e._v;
      case "methode":
        e._v = methode(e);
        return e._v;
      case "strom":
        e._v = strom(e);
        return e._v;
      default:
        throw new CppFehler("Unbekannter Ausdruck.", e.zeile);
    }
  }

  // Text für einen Wert
  function wertText(x) {
    if (!x) {
      return "?";
    }
    switch (x.t.k) {
      case "basis":
        return zeigeWert(x.t.name, x.w);
      case "string":
      case "cstr":
        return `"${x.w}"`;
      case "zeiger":
        return x.w && x.w.ziel ? `${ptrText(x.w)} (Adresse ${hexAdr(x.w.ziel.adr)})` : ptrText(x.w);
      case "null":
        return "NULL";
      case "iter":
        return x.w === 0 ? "begin()" : `begin()+${x.w}`;
      case "stream":
        return wahr(x, "") ? "Strom in Ordnung (wahr)" : "Strom nicht in Ordnung (falsch)";
      case "void":
        return "nichts";
      default:
        return x.zelle ? kurzText(x.zelle) : "?";
    }
  }

  function ersetzt(e) {
    switch (e.k) {
      case "var":
      case "index":
      case "feld":
      case "deref":
      case "aufruf":
      case "zuw":
      case "inc":
      case "methode":
        if (!e._v) {
          return e.text;
        }
        if (e._v.zelle || e._v.t.k === "zeiger" || e._v.t.k === "stream") {
          return e.text;
        }
        return wertText(e._v);
      case "klammer":
        return `(${ersetzt(e.e)})`;
      case "bin":
        return `${ersetzt(e.l)} ${e.op} ${ersetzt(e.r)}`;
      case "un":
        return `${e.op}${ersetzt(e.e)}`;
      case "cast":
        return `(${typName(e.typ)}) ${ersetzt(e.e)}`;
      default:
        return e.text;
    }
  }

  function ausdrText(e) {
    if (e.k === "lit" || e.k === "str") {
      return e.text;
    }
    const s = ersetzt(e);
    const r = e._v ? wertText(e._v) : "?";
    if (s === e.text) {
      return r === s ? e.text : `${e.text} = ${r}`;
    }
    if (s === r) {
      return `${e.text} → ${r}`;
    }
    return `${e.text} → ${s} = ${r}`;
  }

  function bedText(e, b) {
    if (e._beschr) {
      return `${e._beschr} → ${b ? "wahr" : "falsch"}`;
    }
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

  // --- eingebaute Funktionen ---------------------------------------------------------
  function charArray(x, text, zeile) {
    if (x.t.k === "array" && x.t.elem.k === "basis" && x.t.elem.name === "char") {
      return x.zelle;
    }
    throw new CppFehler(`${text} ist kein char-Array.`, zeile);
  }

  function eingebaut(e) {
    const n = e.name;
    if (n === "strlen") {
      const x = wert(e.args[0]);
      let laenge;
      if (x.t.k === "cstr") {
        laenge = x.w.length;
      } else {
        const c = cString(charArray(x, e.args[0].text, e.zeile));
        if (!c.ende) {
          flags.oob = true;
          throw new CppFehler(`In ${e.args[0].text} steht kein '\\0' – strlen sucht über das Ende des Arrays hinaus (undefiniertes Verhalten).`, e.zeile, "oob");
        }
        laenge = c.text.length;
      }
      e._beschr = `strlen zählt die Zeichen bis zum '\\0': ${laenge}`;
      notiz(`strlen(${e.args[0].text}) zählt die Zeichen bis zum Endezeichen '\\0' – das '\\0' selbst zählt nicht mit.`);
      return { t: T_INT, w: laenge };
    }
    if (n === "strcpy") {
      const z = charArray(wert(e.args[0]), e.args[0].text, e.zeile);
      const q = wert(e.args[1]);
      const text = q.t.k === "cstr" ? q.w : cString(charArray(q, e.args[1].text, e.zeile)).text;
      const voll = text + "\0";
      for (let i = 0; i < voll.length; i++) {
        if (i >= z.w.length) {
          notiereZelle(z.w[0]);
          flags.oob = true;
          throw new CppFehler(`strcpy kopiert „${text}“ (${voll.length} Zeichen mit '\\0') in ${z.label}, das nur ${z.w.length} Plätze hat – es wird über das Ende des Arrays hinaus geschrieben (Speicherzugriffsfehler).`, e.zeile, "oob");
        }
        z.w[i].w = voll.charCodeAt(i);
      }
      notiereZelle(z.w[0]);
      e._beschr = `strcpy kopiert „${text}“ samt '\\0' Zeichen für Zeichen nach ${z.label}`;
      return { t: T_VOID };
    }
    if (n === "getline") {
      const s = ort(e.args[0]);
      const ziel2 = ort(e.args[1]);
      if (s.t.k !== "stream") {
        throw new CppFehler("getline braucht als ersten Wert einen Dateistrom.", e.zeile);
      }
      const d = lesbar(s, e.zeile);
      if (!d || s.w.pos >= d.inhalt.length) {
        s.w.fehler = true;
        e._beschr = `getline: Dateiende von ${s.w.datei} erreicht, nichts mehr zu lesen`;
        return { t: s.t, zelle: s };
      }
      let ende = d.inhalt.indexOf("\n", s.w.pos);
      if (ende < 0) {
        ende = d.inhalt.length;
      }
      const zeile2 = d.inhalt.slice(s.w.pos, ende);
      s.w.pos = Math.min(d.inhalt.length, ende + 1);
      zuweise(ziel2, { t: T_STRING, w: zeile2 }, e.zeile);
      e._beschr = `getline liest eine Zeile aus ${s.w.datei}: ${ziel2.label} = "${zeile2}"`;
      return { t: s.t, zelle: s };
    }
    return null;
  }

  // --- Dateien ---------------------------------------------------------------------
  function oeffne(s, datei, modi, zeile) {
    if (s.w.offen) {
      throw new CppFehler(`${s.label} ist schon geöffnet.`, zeile);
    }
    s.w.datei = datei;
    s.w.modi = modi;
    s.w.pos = 0;
    s.w.fehler = false;
    const da = !!dateien[datei];
    if (modi & MODUS.in && !(modi & (MODUS.out | MODUS.app | MODUS.trunc)) && !da) {
      s.w.offen = false;
      s.w.fehler = true;
      notiz(`Die Datei ${datei} gibt es nicht – das Öffnen zum Lesen schlägt fehl (is_open() liefert false).`);
      return;
    }
    if (modi & MODUS.in && modi & MODUS.out && !(modi & (MODUS.app | MODUS.trunc)) && !da) {
      s.w.offen = false;
      s.w.fehler = true;
      notiz(`Die Datei ${datei} gibt es nicht – mit ios::in | ios::out muss sie schon existieren.`);
      return;
    }
    if (!da) {
      dateien[datei] = { inhalt: "", neu: true };
      notiz(`Die Datei ${datei} wird neu angelegt.`);
    }
    if (modi & MODUS.trunc || (modi & MODUS.out && !(modi & MODUS.in) && !(modi & MODUS.app))) {
      if (dateien[datei].inhalt) {
        notiz(`Beim Öffnen wird der alte Inhalt von ${datei} gelöscht (${modi & MODUS.trunc ? "ios::trunc" : "ios::out ohne ios::app"}).`);
      }
      dateien[datei].inhalt = "";
    }
    s.w.offen = true;
    if (geoeffnet.indexOf(s) < 0) {
      geoeffnet.push(s);
    }
  }

  function modusText(m) {
    const t = [];
    for (const k of Object.keys(MODUS)) {
      if (m & MODUS[k]) {
        t.push("ios::" + k);
      }
    }
    return t.join(" | ");
  }

  function lesbar(s, zeile) {
    if (!s.w.offen) {
      s.w.fehler = true;
      notiz(`${s.label} ist nicht geöffnet – es kann nichts gelesen werden.`);
      return null;
    }
    if (!(s.w.modi & MODUS.in)) {
      throw new CppFehler(`${s.label} wurde nicht zum Lesen geöffnet (ios::in fehlt).`, zeile);
    }
    return dateien[s.w.datei];
  }

  function schreibe(s, text, zeile) {
    if (!s.w.offen) {
      s.w.fehler = true;
      notiz(`${s.label} ist nicht geöffnet – die Ausgabe geht verloren.`);
      return;
    }
    if (!(s.w.modi & (MODUS.out | MODUS.app))) {
      throw new CppFehler(`${s.label} wurde nicht zum Schreiben geöffnet (ios::out oder ios::app fehlt).`, zeile);
    }
    dateien[s.w.datei].inhalt += text;
    flags.datei = s.w.datei;
  }

  function ausgabeText(x, t) {
    switch (x.t.k) {
      case "cstr":
      case "string":
        return x.w;
      case "array":
        if (x.t.elem.k === "basis" && x.t.elem.name === "char") {
          const c = cString(x.zelle);
          if (!c.ende) {
            flags.oob = true;
            throw new CppFehler(`In ${t.text} fehlt das Endezeichen '\\0' – cout gibt weiter Zeichen aus, die hinter dem Array im Speicher stehen (undefiniertes Verhalten).`, t.zeile, "oob");
          }
          if (t.k !== "str") {
            notiz(`${t.text} ist ein char-Array: cout gibt alle Zeichen bis zum Endezeichen '\\0' aus.`);
          }
          return c.text;
        }
        notiz(`${t.text} ist ein Array: cout gibt nur seine Adresse aus, nicht den Inhalt.`);
        return hexAdr(x.zelle.adr);
      case "zeiger":
        if (!x.w.ziel) {
          return x.w.nul ? "0" : "0x????????";
        }
        notiz(`${t.text} ist ein Zeiger: cout gibt die gespeicherte Adresse aus (hier ${hexAdr(x.w.ziel.adr)}), nicht den Inhalt. Für den Inhalt schreibt man *${t.text}.`);
        return hexAdr(x.w.ziel.adr);
      case "basis":
        if (x.w === undefined) {
          notiz(`${t.text} hat keinen festgelegten Wert – ausgegeben wird irgendeine zufällige Zahl (hier ???).`);
          return "???";
        }
        if (x.t.name === "char") {
          if (!druckbar(x.w)) {
            if (x.w === 0) {
              return "";
            }
            notiz(`${t.text} hat den Wert ${x.w}: kein druckbares Zeichen – auf dem Bildschirm erscheint ein Sonderzeichen oder nichts (hier ?). Mit (int) ${t.text} sieht man die Zahl.`);
            return "?";
          }
          if (t.k !== "lit") {
            notiz(`${t.text} ist vom Typ char → ausgegeben wird das Zeichen mit dem ASCII-Code ${x.w}: ${String.fromCharCode(x.w)}`);
          }
          return String.fromCharCode(x.w);
        }
        if (x.t.name === "bool") {
          notiz("Ein Wahrheitswert wird von cout als Zahl ausgegeben: wahr → 1, falsch → 0.");
          return x.w ? "1" : "0";
        }
        if (x.t.name === "double") {
          if (Number.isInteger(x.w) && t.k !== "lit") {
            notiz(`${t.text} ist ein double mit dem Wert ${fmtDouble(x.w)}. cout lässt „.0“ weg und gibt einfach ${fmtDouble(x.w)} aus.`);
          }
          return fmtDouble(x.w);
        }
        if (t.k === "bin" && ((t.l._v && t.l._v.t.name === "char") || (t.r._v && t.r._v.t.name === "char"))) {
          notiz(`${t.text} ist vom Typ int (beim Rechnen wird aus char eine Zahl) → ausgegeben wird die Zahl ${x.w}, nicht das Zeichen.`);
        }
        return String(x.w);
      default:
        throw new CppFehler(`Einen ${typName(x.t)} kann man so nicht ausgeben.`, t.zeile);
    }
  }

  function leseWert(s, zz, d, zeile) {
    let i = s.w.pos;
    const txt = d.inhalt;
    while (i < txt.length && /\s/.test(txt[i])) {
      i++;
    }
    if (i >= txt.length) {
      s.w.fehler = true;
      s.w.pos = i;
      return null;
    }
    let roh;
    const t = zz.t;
    if (t.k === "basis" && t.name === "char") {
      roh = txt[i];
      i++;
      s.w.pos = i;
      zuweise(zz, { t: T_CHAR, w: roh.charCodeAt(0) }, zeile);
      return roh;
    }
    let j = i;
    while (j < txt.length && !/\s/.test(txt[j])) {
      j++;
    }
    roh = txt.slice(i, j);
    if (t.k === "string") {
      s.w.pos = j;
      zuweise(zz, { t: T_STRING, w: roh }, zeile);
      return roh;
    }
    if (t.k === "basis") {
      const m = t.name === "double" ? roh.match(/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?/) : roh.match(/^[-+]?\d+/);
      if (!m) {
        s.w.fehler = true;
        notiz(`„${roh}“ ist keine Zahl – das Lesen schlägt fehl, der Strom geht in den Fehlerzustand.`);
        return null;
      }
      s.w.pos = i + m[0].length;
      zuweise(zz, { t: t.name === "double" ? T_DOUBLE : T_INT, w: Number(m[0]) }, zeile);
      return m[0];
    }
    throw new CppFehler(`In einen ${typName(t)} kann man mit >> nicht lesen.`, zeile);
  }

  function strom(e) {
    const zielName = e.ziel.k === "var" ? e.ziel.name : null;
    if (zielName === "cin") {
      throw new CppFehler("Eingaben mit cin gibt es in den Rätseln nicht.", e.zeile);
    }
    let s = null;
    if (zielName !== "cout") {
      s = ort(e.ziel);
      if (s.t.k !== "stream") {
        throw new CppFehler(`${e.ziel.text} ist kein Datenstrom – << und >> gehen nur mit cout oder einem Dateistrom.`, e.zeile);
      }
    }
    if (e.richtung === "<<") {
      let neu = "";
      for (const t of e.teile) {
        if (t.k === "var" && t.name === "endl") {
          neu += "\n";
          continue;
        }
        neu += ausgabeText(wert(t), t);
      }
      e._neu = neu;
      if (s) {
        schreibe(s, neu, e.zeile);
        e._datei = s.w.datei;
      } else {
        ausgabe += neu;
        tabZeile.aus += neu;
      }
      return s ? { t: s.t, zelle: s } : { t: T_VOID };
    }
    if (!s) {
      throw new CppFehler("Mit cout kann man nur ausgeben (<<), nicht lesen.", e.zeile);
    }
    const gelesen = [];
    for (const t of e.teile) {
      const zz = ort(t);
      const d = lesbar(s, e.zeile);
      if (!d || s.w.fehler) {
        s.w.fehler = true;
        break;
      }
      const roh = leseWert(s, zz, d, e.zeile);
      if (roh === null) {
        break;
      }
      gelesen.push(`${zz.label} = ${kurzText(zz)}`);
    }
    e._gelesen = gelesen;
    e._beschr = gelesen.length ? `aus ${s.w.datei} gelesen: ${gelesen.join(", ")}` : `nichts mehr in ${s.w.datei || "der Datei"} (Dateiende oder Fehler)`;
    return { t: s.t, zelle: s };
  }

  // --- Methoden ------------------------------------------------------------------
  function methode(e) {
    const obj = e.pfeil ? ziel(wert(e.obj).w, e.zeile, e.obj.text) : ort(e.obj);
    const k = obj.t.k;
    const n = e.name;
    const args = () => e.args.map((a) => wert(a));
    if (k === "vector") {
      const v = obj;
      const el = v.t.elem;
      const vorher = kurzText(v);
      let erg = { t: T_VOID };
      if (n === "push_back") {
        const x = wert(e.args[0]);
        v.w.push(vektorElement(v, x, v.w.length));
        e._beschr = `hängt ${wertText(x)} hinten an → ${v.label} = ${kurzText(v)} (Größe ${v.w.length})`;
      } else if (n === "pop_back") {
        if (!v.w.length) {
          flags.oob = true;
          throw new CppFehler(`pop_back() bei einem leeren vector ${v.label} – undefiniertes Verhalten.`, e.zeile, "oob");
        }
        const weg = v.w.pop();
        e._beschr = `entfernt das letzte Element (${kurzText(weg)}) → ${v.label} = ${kurzText(v)}`;
      } else if (n === "size") {
        erg = { t: T_UNS, w: v.w.length };
        e._beschr = `${v.label}.size() = ${v.w.length}`;
        notiz(`size() liefert die Anzahl der Elemente als unsigned int (ohne Vorzeichen) – deshalb steht im Skript unsigned int i.`);
        return erg;
      } else if (n === "empty") {
        return { t: T_BOOL, w: v.w.length === 0 ? 1 : 0 };
      } else if (n === "begin" || n === "end") {
        return { t: { k: "iter" }, w: n === "begin" ? 0 : v.w.length, vec: v };
      } else if (n === "front" || n === "back") {
        if (!v.w.length) {
          oob(v.label, 0, 0, e.zeile, true);
        }
        return rv(v.w[n === "front" ? 0 : v.w.length - 1]);
      } else if (n === "insert") {
        const [it, x] = args();
        if (it.t.k !== "iter" || it.vec !== v) {
          throw new CppFehler(`insert braucht eine Position wie ${v.label}.begin() + 2.`, e.zeile);
        }
        if (it.w < 0 || it.w > v.w.length) {
          oob(v.label, it.w, v.w.length, e.zeile, true);
        }
        v.w.splice(it.w, 0, vektorElement(v, x, it.w));
        vektorNeuNummerieren(v);
        e._beschr = `fügt ${wertText(x)} an Position ${it.w} ein, alles dahinter rückt eine Stelle nach hinten → ${v.label} = ${kurzText(v)}`;
      } else if (n === "erase") {
        const a = args();
        if (a[0].t.k !== "iter" || a[0].vec !== v) {
          throw new CppFehler(`erase braucht eine Position wie ${v.label}.begin() + 2.`, e.zeile);
        }
        const von = a[0].w;
        const bis = a.length > 1 ? a[1].w : von + 1;
        if (von < 0 || bis > v.w.length || von >= bis) {
          oob(v.label, von, v.w.length, e.zeile, true);
        }
        v.w.splice(von, bis - von);
        vektorNeuNummerieren(v);
        e._beschr = bis - von === 1 ? `löscht das Element an Position ${von}, alles dahinter rückt nach vorn → ${v.label} = ${kurzText(v)}` : `löscht die Elemente an den Positionen ${von} bis ${bis - 1} (das Ende ${bis} gehört nicht dazu) → ${v.label} = ${kurzText(v)}`;
      } else if (n === "clear") {
        v.w = [];
        e._beschr = `löscht alle Elemente → ${v.label} ist leer (Größe 0)`;
      } else {
        throw new CppFehler(`Die Methode ${n}() von vector wird hier nicht unterstützt.`, e.zeile);
      }
      if (kurzText(v) !== vorher) {
        notiereZelle(v);
      }
      return erg;
    }
    if (k === "string") {
      if (n === "push_back") {
        const x = wert(e.args[0]);
        obj.w += String.fromCharCode(konvertiere(x, "char", e.zeile));
        notiereZelle(obj);
        e._beschr = `hängt ${wertText(x)} hinten an → ${obj.label} = "${obj.w}"`;
        return { t: T_VOID };
      }
      if (n === "size" || n === "length") {
        e._beschr = `${obj.label}.${n}() = ${obj.w.length}`;
        return { t: T_UNS, w: obj.w.length };
      }
      if (n === "empty") {
        return { t: T_BOOL, w: obj.w.length ? 0 : 1 };
      }
      if (n === "clear") {
        obj.w = "";
        notiereZelle(obj);
        e._beschr = `${obj.label} ist jetzt leer`;
        return { t: T_VOID };
      }
      throw new CppFehler(`Die Methode ${n}() von string wird hier nicht unterstützt.`, e.zeile);
    }
    if (k === "stream") {
      const s = obj;
      if (n === "open") {
        const a = args();
        const datei = a[0].w;
        const modi = a.length > 1 ? a[1].w : s.t.art === "ifstream" ? MODUS.in : s.t.art === "ofstream" ? MODUS.out | MODUS.trunc : MODUS.in | MODUS.out;
        oeffne(s, datei, modi, e.zeile);
        notiereZelle(s);
        e._beschr = s.w.offen ? `öffnet ${datei} (${modusText(modi)})` : `Öffnen von ${datei} fehlgeschlagen`;
        return { t: T_VOID };
      }
      if (n === "close") {
        s.w.offen = false;
        notiereZelle(s);
        e._beschr = `schließt ${s.w.datei} – alles Geschriebene steht jetzt sicher in der Datei`;
        return { t: T_VOID };
      }
      if (n === "is_open") {
        e._beschr = `${s.label}.is_open() = ${s.w.offen ? "wahr" : "falsch"}`;
        return { t: T_BOOL, w: s.w.offen ? 1 : 0 };
      }
      if (n === "get") {
        const zz = ort(e.args[0]);
        const d = lesbar(s, e.zeile);
        if (!d || s.w.pos >= d.inhalt.length) {
          s.w.fehler = true;
          e._beschr = `${s.label}.get(${zz.label}): Dateiende erreicht, kein Zeichen mehr`;
          return { t: s.t, zelle: s };
        }
        const c = d.inhalt.charCodeAt(s.w.pos);
        s.w.pos++;
        zuweise(zz, { t: T_CHAR, w: c }, e.zeile);
        e._beschr = `${s.label}.get(${zz.label}) liest das nächste Zeichen: ${c === 10 ? "Zeilenumbruch '\\n'" : zeigeWert("char", c)}`;
        return { t: s.t, zelle: s };
      }
      throw new CppFehler(`Die Methode ${n}() von ${s.t.art} wird hier nicht unterstützt.`, e.zeile);
    }
    throw new CppFehler(`${e.obj.text} hat keine Methode ${n}().`, e.zeile);
  }

  // --- Anweisungen ausführen -------------------------------------------------------
  function initialisiere(z, init, zeile) {
    const t = z.t;
    if (init.k === "liste") {
      if (t.k === "array") {
        if (init.liste.length > t.n) {
          throw new CppFehler("Zu viele Startwerte für das Array.", zeile);
        }
        z.w.forEach((e, i) => {
          if (i < init.liste.length) {
            initialisiere(e, init.liste[i], zeile);
          } else {
            nullen(e);
          }
        });
        return;
      }
      if (t.k === "struct") {
        t.felder.forEach((f, i) => {
          if (i < init.liste.length) {
            initialisiere(z.w[f.name], init.liste[i], zeile);
          } else {
            nullen(z.w[f.name]);
          }
        });
        return;
      }
      if (t.k === "vector") {
        z.w = init.liste.map((a, i) => vektorElement(z, wert(a), i));
        return;
      }
      throw new CppFehler(`Eine Liste in { } passt nicht zum Typ ${typName(t)}.`, zeile);
    }
    if (init.k === "ctor") {
      if (t.k === "vector") {
        const a = init.args.map((x) => wert(x));
        const n = a.length ? a[0].w : 0;
        z.w = [];
        for (let i = 0; i < n; i++) {
          z.w.push(vektorElement(z, a.length > 1 ? a[1] : { t: T_INT, w: 0 }, i));
        }
        return;
      }
      if (t.k === "stream") {
        const a = init.args.map((x) => wert(x));
        const modi = a.length > 1 ? a[1].w : t.art === "ifstream" ? MODUS.in : t.art === "ofstream" ? MODUS.out | MODUS.trunc : MODUS.in | MODUS.out;
        oeffne(z, a[0].w, modi, zeile);
        return;
      }
      throw new CppFehler(`Die Schreibweise mit ( ) wird für ${typName(t)} hier nicht unterstützt.`, zeile);
    }
    const x = wert(init);
    if (t.k === "array" && t.elem.k === "basis" && t.elem.name === "char" && x.t.k === "cstr") {
      if (x.w.length + 1 > t.n) {
        throw new CppFehler(`„${x.w}“ braucht ${x.w.length + 1} Plätze (mit '\\0'), das Array hat aber nur ${t.n}.`, zeile);
      }
      z.w.forEach((e, i) => {
        e.w = i < x.w.length ? x.w.charCodeAt(i) : 0;
      });
      return;
    }
    zuweise(z, x, zeile, true);
  }

  function nullen(z) {
    if (z.t.k === "basis") {
      z.w = 0;
    } else if (z.t.k === "array") {
      z.w.forEach(nullen);
    } else if (z.t.k === "struct") {
      for (const f of z.t.felder) {
        nullen(z.w[f.name]);
      }
    } else if (z.t.k === "zeiger") {
      z.w = { nul: true };
    }
  }

  function arrayTyp(d, zeile) {
    if (!d.istArr) {
      return d.t;
    }
    let n = null;
    if (d.laenge) {
      const lx = wert(d.laenge);
      n = lx.w;
    } else if (d.init && d.init.k === "liste") {
      n = d.init.liste.length;
    } else if (d.init && d.init.k === "str") {
      n = d.init.wert.length + 1;
    }
    if (!Number.isInteger(n) || n <= 0 || n > 24) {
      throw new CppFehler("Die Arraygröße muss eine ganze Zahl zwischen 1 und 24 sein.", zeile);
    }
    return { k: "array", elem: d.t, n };
  }

  function fuehreDekl(d, istGlobal) {
    const teile = [];
    for (const v of d.vars) {
      const t = arrayTyp(v, d.zeile);
      const rec = lege(v.name, t, d.zeile, istGlobal, "zufall");
      const z = rec.z;
      let info = "";
      if (v.init) {
        initialisiere(z, v.init, d.zeile);
        if (v.init.k !== "liste" && v.init.k !== "ctor") {
          const at = ausdrText(v.init);
          if (at !== v.init.text && z.t.k === "basis") {
            info = ` ${at},`;
          }
        }
      }
      if (z.t.k === "basis") {
        if (v.init) {
          teile.push(`Neue Variable ${v.name} (${typName(t)}, ${wo(istGlobal)}):${info} Startwert ${zeigeWert(t.name, z.w)}.`);
        } else if (istGlobal) {
          teile.push(`Neue globale Variable ${v.name} (${typName(t)}) ohne Startwert – globale Variablen beginnen mit 0.`);
        } else {
          teile.push(`Neue Variable ${v.name} (${typName(t)}, ${wo(istGlobal)}) ohne Startwert – der Inhalt ist zufällig (?).`);
        }
      } else if (z.t.k === "array") {
        let s = `Array ${v.name} (${typName(t.elem)}, ${wo(istGlobal)}) mit ${t.n} Elementen, Index 0 bis ${t.n - 1}`;
        if (t.elem.k === "basis" && t.elem.name === "char" && v.init && v.init.k === "str") {
          s += `, darin der Text „${v.init.wert}“ und danach das Endezeichen '\\0'`;
          notiz(`Ein C-String ist ein char-Array: Jedes Zeichen bekommt ein Element, am Ende steht '\\0'. „${v.init.wert}“ braucht ${v.init.wert.length + 1} Plätze.`);
        } else if (v.init) {
          s += `, gefüllt mit ${kurzText(z)}`;
          if (v.init.k === "liste" && v.init.liste.length < t.n) {
            s += " (fehlende Startwerte sind 0)";
          }
        } else if (!istGlobal) {
          s += " – der Inhalt ist noch zufällig";
        }
        teile.push(s + ".");
      } else if (z.t.k === "vector") {
        teile.push(`Neuer ${typName(t)} ${v.name} (${wo(istGlobal)}) mit ${z.w.length} Elementen: ${kurzText(z)}.`);
      } else if (z.t.k === "string") {
        teile.push(`Neuer string ${v.name}: "${z.w}".`);
      } else if (z.t.k === "struct") {
        teile.push(`Neue Strukturvariable ${v.name} vom Typ ${t.name} (${wo(istGlobal)}) mit den Komponenten ${t.felder.map((f) => f.name).join(", ")}${v.init ? `: ${kurzText(z)}` : " – ohne Startwerte, Inhalt zufällig"}.`);
      } else if (z.t.k === "zeiger") {
        teile.push(`Neuer Zeiger ${v.name} (${typName(t)}, Adresse ${hexAdr(z.adr)}): ${z.w.ziel ? `zeigt auf ${z.w.name} (${hexAdr(z.w.ziel.adr)})` : z.w.nul ? "zeigt auf NULL (nichts)" : "noch ohne Ziel – er zeigt irgendwohin"}.`);
        if (z.w.wild) {
          notiz(`Ein Zeiger ohne Startwert zeigt auf eine zufällige Adresse. Vor dem ersten *${v.name} muss er eine gültige Adresse bekommen (z. B. ${v.name} = &x;).`);
        }
      } else if (z.t.k === "stream") {
        teile.push(`Neuer Dateistrom ${v.name} (${t.art})${z.w.datei ? `: ${z.w.offen ? "öffnet" : "versucht zu öffnen"} ${z.w.datei} mit ${modusText(z.w.modi)}` : " – noch keine Datei geöffnet"}.`);
      }
      if (z.t.k !== "basis" || z.w !== undefined) {
        if (z.t.k === "array" && z.t.elem.k === "basis" && z.t.elem.name !== "char") {
          z.w.forEach((e) => {
            if (e.w !== undefined) {
              notiereZelle(e);
            }
          });
        } else {
          notiereZelle(z);
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

  function scopeEnde(f, zeile, s, text) {
    const weg = Array.from(f.bloecke[f.bloecke.length - 1].keys());
    if (weg.length && !(s && s.art === "return")) {
      schritt("block", zeile, text(weg), { weg });
    }
    f.bloecke.pop();
  }

  function fuehreBlock(b) {
    const f = aktFrame();
    const sp = adrStapel;
    f.bloecke.push(new Map());
    const s = fuehreAnweisungen(b.anw);
    scopeEnde(f, b.endZeile, s, (weg) => `Ende des Blocks: ${weg.join(", ")} ${weg.length > 1 ? "werden" : "wird"} gelöscht – ihr Gültigkeitsbereich endet an der schließenden Klammer }.`);
    adrStapel = sp;
    return s;
  }

  function sichtbar(s) {
    return `„${s.replace(/\n/g, "⏎")}“`;
  }

  function anwText(e, x) {
    if (e.k === "zuw") {
      const z = e._ziel;
      const viaZeiger = e.ziel.k === "deref" || (e.ziel.k === "feld" && e.ziel.pfeil);
      const neu = z.t && z.t.k !== "basis" ? kurzText(z) : wertText(x);
      if (e.op === "=" && z.t && z.t.k === "zeiger") {
        const ziel2 = z.w.ziel ? `zeigt jetzt auf ${z.w.name} (Adresse ${hexAdr(z.w.ziel.adr)})` : z.w.nul ? "zeigt jetzt auf NULL (nichts)" : "zeigt irgendwohin";
        if (z.w.ziel && e.e.k === "adr") {
          notiz(`Man liest „&“ als „Adresse von“: ${e.e.text} ist die Adresse ${hexAdr(z.w.ziel.adr)} der Variablen ${z.w.name}. Diese Adresse steht jetzt im Zeiger ${z.label}.`);
        }
        return `${e.text}: ${z.label} ${ziel2}.`;
      }
      if (e.op === "=") {
        const at = ausdrText(e.e);
        const rechts = at === e.e.text || e.e._v.zelle ? "" : at + " → ";
        let t = `${e.text}: ${rechts}${z.label} ist jetzt ${neu}`;
        if (viaZeiger) {
          t += ` (geschrieben über den Zeiger ${e.ziel.k === "deref" ? e.ziel.e.text : e.ziel.obj.text})`;
        }
        return t + ".";
      }
      return `${e.text}: ${z.label} = ${z.label} ${e.op[0]} ${ersetzt(e.e)} → ${z.label} ist jetzt ${neu}.`;
    }
    if (e.k === "inc") {
      return `${e.text}: ${e._ziel.label} wird um 1 ${e.op === "++" ? "erhöht" : "verringert"} → ${e._ziel.label} ist jetzt ${wertText(e._neu)}.`;
    }
    if (e.k === "aufruf") {
      if (e._beschr) {
        return `${e.text}: ${e._beschr}.`;
      }
      return `${e.text} ist erledigt – weiter in ${aktFrame().label}.`;
    }
    if (e.k === "methode") {
      return `${e.text}: ${e._beschr || "erledigt"}.`;
    }
    return `${ausdrText(e)} (das Ergebnis wird nicht gespeichert).`;
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
        if (e.k === "strom") {
          if (e.richtung === "<<" && !e._datei) {
            const werte = e.teile.filter((t) => t.k !== "str" && t.k !== "lit" && !(t.k === "var" && t.name === "endl") && t._v && !t._v.zelle);
            const ein = werte.length ? ` (${werte.map((t) => `${t.text} = ${wertText(t._v)}`).join(", ")})` : "";
            schritt("ausgabe", a.zeile, `Ausgabe auf dem Bildschirm: ${sichtbar(e._neu)}${ein}.${e._neu.indexOf("\n") >= 0 ? " ⏎ ist ein Zeilenumbruch." : ""}`, { neu: e._neu });
          } else if (e.richtung === "<<") {
            schritt("datei", a.zeile, `In die Datei ${e._datei} geschrieben: ${sichtbar(e._neu)}. Auf dem Bildschirm erscheint nichts.`, { datei: e._datei });
          } else {
            schritt("datei", a.zeile, `${e.text}: ${e._beschr}.`);
          }
          return null;
        }
        schritt("anw", a.zeile, anwText(e, x));
        return null;
      }
      case "if": {
        const x = wert(a.bed);
        if (a.bed.k === "zuw") {
          notiz(`Achtung: = ist eine Zuweisung, kein Vergleich! ${a.bed.ziel.text} bekommt den Wert ${wertText(x)}, und jeder Wert außer 0 gilt als wahr. Gemeint war wohl ==.`);
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
        const sp = adrStapel;
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
              t = `${e.text} am Ende der Runde: ${e._ziel.label} ist jetzt ${wertText(e._neu)}.`;
            } else if (e.k === "zuw") {
              t = `${e.text} am Ende der Runde: ${e._ziel.label} ist jetzt ${wertText(x)}.`;
            } else {
              t = `${ausdrText(e)} am Ende der Runde.`;
            }
            schritt("anw", a.zeile, t);
          }
        }
        scopeEnde(f, a.zeile, ergebnis, (weg) => `Die for-Schleife ist beendet: ${weg.join(", ")} ${weg.length > 1 ? "werden" : "wird"} gelöscht – im Kopf der for-Schleife deklarierte Variablen gelten nur innerhalb der Schleife.`);
        adrStapel = sp;
        return ergebnis;
      }
      case "foreach": {
        const f = aktFrame();
        const sp = adrStapel;
        const q = wert(a.quelle);
        const liste = q.zelle && (q.t.k === "array" || q.t.k === "vector") ? q.zelle.w : null;
        if (!liste) {
          throw new CppFehler(`for (… : ${a.quelle.text}) geht nur mit einem Array oder vector.`, a.zeile);
        }
        let ergebnis = null;
        const n = liste.length;
        for (let i = 0; i < n; i++) {
          f.bloecke.push(new Map());
          const rec = lege(a.var.name, a.var.t, a.zeile, false, "zufall", a.var.ref ? liste[i] : null);
          if (!a.var.ref) {
            zuweise(rec.z, rv(liste[i]), a.zeile, true);
            notiereZelle(rec.z);
          }
          schritt("bed", a.zeile, `for (${typName(a.var.t)}${a.var.ref ? " &" : ""} ${a.var.name} : ${a.quelle.text}): Runde ${i + 1} von ${n} – ${a.var.name} ${a.var.ref ? "ist ein anderer Name für" : "bekommt eine Kopie von"} ${liste[i].label} = ${kurzText(liste[i])}.`, { wahr: true });
          const s = fuehre(a.rumpf);
          f.bloecke.pop();
          if (s) {
            if (s.art === "break") {
              break;
            }
            if (s.art !== "continue") {
              ergebnis = s;
              break;
            }
          }
        }
        if (!ergebnis) {
          schritt("bed", a.zeile, `for (… : ${a.quelle.text}): Alle ${n} Elemente sind durchlaufen – die Schleife endet.`, { wahr: false });
        }
        adrStapel = sp;
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
        let erg = { t: fn.typ, w: undefined };
        let t;
        if (a.e) {
          const x = wert(a.e);
          if (fn.typ.k === "basis") {
            erg = { t: fn.typ, w: konvertiere(x, fn.typ.name, a.zeile) };
          } else if (fn.typ.k === "struct" || fn.typ.k === "string" || fn.typ.k === "vector") {
            const tmp = neueZelle(fn.typ, "null", null, "Rückgabe");
            zuweise(tmp, x, a.zeile, true);
            erg = rv(tmp);
          } else {
            erg = x;
          }
          const at = ausdrText(a.e);
          t = `return ${a.e.text}: ${at === a.e.text ? "" : at + " → "}`;
        } else {
          t = "return: ";
        }
        if (f.fname === "main") {
          t += "main ist fertig – das Programm endet.";
        } else {
          t += `${f.label} gibt ${a.e ? wertText(erg) : "nichts"} zurück. Ihre lokalen Variablen werden gelöscht, weiter beim Aufrufer.`;
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
      const b = eingebaut(e);
      if (b) {
        return b;
      }
      throw new CppFehler(`Eine Funktion ${e.name} gibt es nicht.`, e.zeile);
    }
    if (fn.params.length !== e.args.length) {
      throw new CppFehler(`${e.name} erwartet ${fn.params.length} Werte, bekommt aber ${e.args.length}.`, e.zeile);
    }
    if (stapel.length > 25) {
      throw new CppFehler("Zu viele verschachtelte Funktionsaufrufe.", e.zeile);
    }
    const args = fn.params.map((pa, i) => (pa.ref ? ort(e.args[i]) : wert(e.args[i])));
    const aufrufer = aktFrame().label;
    const sp = adrStapel;
    stapel.push({ fname: fn.name, label: `${fn.name}()`, bloecke: [new Map()] });
    const teile = [];
    fn.params.forEach((pa, i) => {
      if (pa.ref) {
        const z = args[i];
        lege(pa.name, pa.t, fn.zeile, false, "zufall", z);
        teile.push(`${pa.name} ist ein anderer Name für ${z.label} (Referenz)`);
        notiz(`Referenzparameter (&): ${pa.name} ist keine Kopie, sondern nur ein zweiter Name für ${z.label}. Jede Änderung an ${pa.name} ändert ${z.label} (call by reference).`);
        return;
      }
      if (pa.istArr) {
        const x = args[i];
        if (x.t.k !== "array") {
          throw new CppFehler(`${pa.name}[] erwartet ein Array.`, e.zeile);
        }
        const rec = lege(pa.name, { k: "zeiger", ziel: pa.t }, fn.zeile, false, "zufall");
        rec.z.w = zeigerAuf(x.zelle.w[0]);
        teile.push(`${pa.name} zeigt auf das Array ${x.zelle.label} (keine Kopie)`);
        notiz(`Bei einem Array wird nur die Adresse des ersten Elements übergeben. Die Funktion arbeitet direkt im Array ${x.zelle.label} (call by reference).`);
        return;
      }
      const rec = lege(pa.name, pa.t, fn.zeile, false, "zufall");
      zuweise(rec.z, args[i], fn.zeile, true);
      notiereZelle(rec.z);
      teile.push(`${pa.name} = ${kurzText(rec.z)}${pa.t.k === "zeiger" ? ` (Adresse ${rec.z.w.ziel ? hexAdr(rec.z.w.ziel.adr) : "?"})` : ""}`);
      if (pa.t.k === "zeiger" && rec.z.w.ziel) {
        notiz(`Übergeben wird eine Adresse: ${pa.name} zeigt auf ${rec.z.w.name}. Über *${pa.name} kann die Funktion ${rec.z.w.name} direkt ändern (call by reference mit Zeiger).`);
      }
    });
    const aufrufText = e.args.length ? `${e.name}(${e.args.map((a, i) => (fn.params[i].ref || args[i].t.k === "zeiger" || args[i].zelle ? a.text : wertText(args[i]))).join(", ")})` : e.text;
    schritt("aufruf", fn.zeile, `Aufruf ${aufrufText}: Der Ablauf springt aus ${aufrufer} in die Funktion ${fn.name}.${teile.length ? ` ${teile.join("; ")}.` : ""}`);
    const s = fuehreAnweisungen(fn.koerper.anw);
    let erg = { t: fn.typ, w: undefined };
    if (s && s.art === "return") {
      erg = s.wert;
    } else {
      if (fn.typ.k !== "void") {
        notiz(`Die Funktion ${fn.name} sollte mit return einen Wert zurückgeben – das fehlt hier.`);
      }
      schritt("return", fn.koerper.endZeile, `Ende der Funktion ${fn.name}: Ihre lokalen Variablen werden gelöscht, weiter in ${aufrufer}.`);
    }
    stapel.pop();
    adrStapel = sp;
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
    let txt = `Das Programm ist zu Ende. Die gesamte Ausgabe ist der Code für das Schloss: ${anzeige ? "„" + anzeige + "“" : "(keine Ausgabe auf dem Bildschirm)"}.`;
    const geschrieben = Object.keys(dateien).filter((n) => !opt.dateien || opt.dateien[n] !== dateien[n].inhalt);
    if (geschrieben.length) {
      txt += ` Geänderte Dateien: ${geschrieben.map((n) => `${n} (${sichtbar(dateien[n].inhalt)})`).join(", ")}.`;
    }
    if (geoeffnet.some((x) => x.w.offen)) {
      notiz("Nicht geschlossene Dateien werden beim Programmende automatisch geschlossen. Sauberer ist close().");
    }
    schritt("ende", s ? schritte[schritte.length - 1].zeile : main.koerper.endZeile, txt, { fertig: true });
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

  const dateiInhalt = {};
  for (const n of Object.keys(dateien)) {
    dateiInhalt[n] = dateien[n].inhalt;
  }
  return { quelle: src, zeilen, schritte, tabelle, spalten, ausgabe, fehler, fehlerArt, dateien: dateiInhalt };
}

if (typeof module !== "undefined") {
  module.exports = { fuehreAus, parseCpp, ausgabeNormal, fmtDouble, zeigeWert, zellText, kurzText, typName, hexAdr, zeichenText, wrapChar, wrapInt };
}
