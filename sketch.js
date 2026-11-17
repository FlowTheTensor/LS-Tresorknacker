// =============================================================================
//  Tresorknacker · Ein Escape-Room für C++
//  Sechs Räume, in jedem Raum Schlösser. Der Code eines Schlosses ist die
//  Ausgabe eines kurzen C++-Programms. Wer das Programm im Kopf (oder mit
//  einem Schreibtischtest) richtig durchspielt, öffnet die Tür.
//  Räume = Freigabestufen vom Neuling bis zum Tresorknacker:
//    1 Eingangshalle (Datentypen) · 2 Bibliothek (Verzweigungen) ·
//    3 Uhrenzimmer (Schleifen) · 4 Schließfachraum (Arrays) ·
//    5 Spiegelsaal (Funktionen, Geltungsbereich) · 6 Kesselraum (Überlauf)
// =============================================================================
//
//  Dateien
//    tracer.js  kleiner C++-Interpreter: führt das Programm vorab aus und
//               liefert alle Schritte (Zeile, Erklärung, Speicher, Ausgabe)
//    stufen.js  Räume, Rätsel zum Üben, Prüfungsfragen
//    ui.js      Knöpfe, Auswahllisten, Eingabefelder
//    sketch.js  Ablauf und Zeichnen (Quelltext, Schloss, Speicher, Tafel)
//
//  Bedienung
//    →         nächster Schritt
//    Leertaste automatisch ablaufen lassen / anhalten
//    R         Neustart
//
//  Läuft mit p5.js 1.x und 2.x.
//  Hinweis: Alle Schleifen haben geschweifte Klammern – der p5-Web-Editor
//  kommt mit Schleifen ohne Klammern nicht zurecht.
// =============================================================================

const W = 1600;
const LEISTE = 64;
const H_INHALT = 900;
const H = H_INHALT + LEISTE;
let S = 1;

const SCHRIFTEN = {
  titel: ["Quicksand", "Arial"],
  text: ["Inter", "Arial"],
  mono: ["JetBrains Mono", "monospace"],
};
const schriftGeladen = { titel: false, text: false, mono: false };
let TITEL = "Arial";
let SCHRIFT = "Arial";
let MONO = "monospace";

function ladeSchriften() {
  if (!document.fonts || !document.fonts.load) {
    return;
  }
  for (const art of Object.keys(SCHRIFTEN)) {
    const name = SCHRIFTEN[art][0];
    Promise.all([document.fonts.load(`400 16px "${name}"`), document.fonts.load(`700 16px "${name}"`)])
      .then((ergebnis) => {
        if (ergebnis[0].length > 0 && ergebnis[1].length > 0) {
          schriftGeladen[art] = true;
          TITEL = schriftGeladen.titel ? SCHRIFTEN.titel[0] : SCHRIFTEN.titel[1];
          SCHRIFT = schriftGeladen.text ? SCHRIFTEN.text[0] : SCHRIFTEN.text[1];
          MONO = schriftGeladen.mono ? SCHRIFTEN.mono[0] : SCHRIFTEN.mono[1];
        }
      })
      .catch(() => {});
  }
}

const P_WELT = { x: 24, y: 84, w: 900, h: 540, titel: "Escape-Room" };
const P_TAFEL = { x: 24, y: 640, w: 520, h: 244, titel: "Schreibtischtest (Variablentafel)" };
const P_KONSOLE = { x: 560, y: 640, w: 364, h: 244, titel: "Konsole" };
const P_ERKL = { x: 940, y: 84, w: 636, h: 380, titel: "" };
const P_STEUER = { x: 940, y: 480, w: 400, h: 404, titel: "" };
const P_FREIGABE = { x: 1356, y: 480, w: 220, h: 404, titel: "Freigaben" };
const KOPF_H = 34;

// Bereiche in der Welt
const CODE = { x: 40, y: 126, w: 472, h: 486 };
const TUER = { x: 526, y: 124, w: 384, h: 196 };
const SPEICHER = { x: 526, y: 330, w: 384, h: 282 };

const FARBE_HELL = {
  papier: [251, 249, 245],
  flaeche: [255, 255, 255],
  flaeche2: [243, 238, 230],
  linie: [231, 225, 214],
  text: [29, 29, 28],
  grau: [91, 88, 82],
  blass: [125, 122, 114],
  akzent: [200, 30, 58],
  akzentHell: [228, 0, 43],
  senf: [184, 122, 28],
  gruen: [52, 128, 84],
  blau: [44, 92, 150],
  violett: [122, 74, 150],
  notiz: [255, 247, 214],
  // Flächen und Schrift auf Flächen (für das dunkle Schema nötig)
  textInvers: [255, 255, 255],
  dunkelFlaeche: [29, 29, 28],
  schatten: [29, 29, 28],
  akzentFlaeche: [253, 240, 242],
  akzentLinie: [240, 200, 208],
  rotFlaeche: [251, 225, 230],
  gruenFlaeche: [228, 241, 233],
  neutral: [160, 155, 146], // inaktive Elemente
};

const FARBE_DUNKEL = {
  papier: [22, 22, 21],
  flaeche: [32, 31, 30],
  flaeche2: [44, 42, 40],
  linie: [62, 59, 55],
  text: [236, 232, 224],
  grau: [184, 178, 168],
  blass: [140, 135, 126],
  akzent: [236, 76, 98],
  akzentHell: [255, 64, 92],
  senf: [222, 166, 72],
  gruen: [96, 186, 132],
  blau: [104, 156, 222],
  violett: [176, 136, 206],
  notiz: [66, 60, 38],
  textInvers: [22, 22, 21],
  dunkelFlaeche: [70, 67, 62],
  schatten: [0, 0, 0],
  akzentFlaeche: [52, 27, 32],
  akzentLinie: [104, 44, 56],
  rotFlaeche: [72, 32, 40],
  gruenFlaeche: [30, 54, 41],
  neutral: [120, 116, 108], // inaktive Elemente
};

const FARBE = {};

// --- Farbschema hell/dunkel ---------------------------------------------------
// FARBE enthält immer die aktive Palette. Beim Umschalten werden die Arrays
// in place überschrieben, damit Verweise wie [FARBE.blau, …] gültig bleiben.
// Die Wahl gilt für alle Lernsituationen (gleicher localStorage-Schlüssel).
const FARBSCHEMA_SCHLUESSEL = "jps-lernsituationen-farbschema";
let dunkelModus = false;

function setzeFarbschema(dunkel) {
  dunkelModus = !!dunkel;
  const quelle = dunkelModus ? FARBE_DUNKEL : FARBE_HELL;
  for (const k in quelle) {
    if (FARBE[k]) {
      FARBE[k].splice(0, FARBE[k].length, ...quelle[k]);
    } else {
      FARBE[k] = quelle[k].slice();
    }
  }
  document.documentElement.classList.toggle("dunkelmodus", dunkelModus);
}

function gespeichertesFarbschema() {
  try {
    const v = localStorage.getItem(FARBSCHEMA_SCHLUESSEL);
    if (v === "dunkel" || v === "hell") {
      return v === "dunkel";
    }
  } catch (e) {
    // kein Speicher verfügbar (z. B. privater Modus) – Systemeinstellung nehmen
  }
  return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

setzeFarbschema(gespeichertesFarbschema());


const SYNTAX = {
  typ: [44, 92, 150],
  wort: [122, 74, 150],
  zahl: [184, 122, 28],
  text: [52, 128, 84],
  kommentar: [150, 146, 138],
  praep: [125, 122, 114],
};
const SCHLUESSELWOERTER = ["if", "else", "for", "while", "do", "return", "break", "continue", "cout", "endl", "using", "namespace", "std", "const", "true", "false"];
const TYPWOERTER = ["int", "char", "double", "void", "bool"];

const TEMPO = { langsam: 1.6, mittel: 1, schnell: 0.4 };

// -----------------------------------------------------------------------------
// Zustand
// -----------------------------------------------------------------------------
let stufe = 0;
let modus = "ueben";
let beispielIdx = 0;
let tempo = "mittel";
let sim = null; // Ergebnis von fuehreAus
let schrittIdx = 0;
let laufAuto = false;
let animT0 = 0;

let aufgabe = null;
let serie = 0;
let rueckmeldung = null; // {ok, text}
let antwortIdx = -1;
let aufloesung = false;
let rueckT0 = 0;
let freigaben = STUFEN.map(() => false);
let stempel = null;
let mcRechtecke = [];
let fehlerMeldung = null;
let cnv;

// =============================================================================
// Start
// =============================================================================
function setup() {
  ladeSchriften();
  const [cw, ch] = zeichenflaeche();
  cnv = createCanvas(cw, ch);
  S = width / W;
  ladeFreigaben();
  erstelleUi();
  cnv.parent(huelle);
  stufeWechseln(0, true);
  layoutUi();
}

function zeichenflaeche() {
  const cw = Math.max(800, Math.min(1600, windowWidth - 24, ((windowHeight - 24) * W) / H));
  return [Math.round(cw), Math.round((cw * H) / W)];
}

function windowResized() {
  const [cw, ch] = zeichenflaeche();
  resizeCanvas(cw, ch);
  S = width / W;
  layoutUi();
}

function draw() {
  try {
    logik();
    background(...FARBE.papier);
    push();
    scale(S);
    zeichneKopf();
    zeichneStufenLeiste();
    push();
    translate(0, LEISTE);
    zeichneStatus();
    zeichneWelt();
    zeichneTafel();
    zeichneKonsole();
    zeichneBericht();
    zeichneSteuerung();
    zeichneFreigaben();
    zeichneStempel();
    zeichneFehlerMeldung();
    pop();
    pop();
    aktualisiereUi();
  } catch (err) {
    behandleFehler(err);
  }
}

function behandleFehler(err) {
  console.error(err);
  fehlerMeldung = { text: String((err && err.message) || err), t0: millis() };
  laufAuto = false;
}

function animDauer() {
  return 260 * TEMPO[tempo];
}

function pausenDauer(s) {
  if (!s) {
    return 1000;
  }
  const lesen = 700 + s.text.length * 13 + s.hinweise.length * 900;
  return animDauer() + Math.min(5200, lesen) * TEMPO[tempo];
}

function animT() {
  return constrain((millis() - animT0) / animDauer(), 0, 1);
}

function logik() {
  if (!laufAuto) {
    return;
  }
  if (millis() - animT0 > pausenDauer(aktSchritt())) {
    if (!naechsterSchritt()) {
      laufAuto = false;
    }
  }
}

// Zeigt die Welt gerade den Ablauf (Üben oder Auflösung) oder nur das Rätsel?
function zeigtAblauf() {
  return modus === "ueben" || aufloesung;
}

// =============================================================================
// Stufen, Modus, Rätsel
// =============================================================================
function stufeWechseln(neu, erzwingen) {
  if (!erzwingen && neu === stufe) {
    return;
  }
  stufe = neu;
  beispielIdx = 0;
  zuruecksetzen();
}

function modusWechseln(neu) {
  if (neu === modus) {
    return;
  }
  modus = neu;
  zuruecksetzen();
}

function zuruecksetzen() {
  laufAuto = false;
  serie = 0;
  rueckmeldung = null;
  aufloesung = false;
  aufgabe = null;
  if (modus === "pruefung") {
    naechsteAufgabe();
  } else {
    neueSimulation();
  }
  if (typeof leereEingaben === "function") {
    leereEingaben();
  }
}

function aktRaetsel() {
  const liste = RAETSEL[STUFEN[stufe].id];
  return liste[Math.min(beispielIdx, liste.length - 1)];
}

function neueSimulation() {
  sim = fuehreAus(aktRaetsel().code, { dateien: aktRaetsel().dateien });
  schrittIdx = 0;
  animT0 = millis();
  laufAuto = false;
}

function aktSchritt() {
  return sim ? sim.schritte[schrittIdx] : null;
}

function vorigerSchritt() {
  return sim && schrittIdx > 0 ? sim.schritte[schrittIdx - 1] : null;
}

function naechsterSchritt() {
  if (!sim || schrittIdx >= sim.schritte.length - 1) {
    return false;
  }
  schrittIdx++;
  animT0 = millis();
  return true;
}

function schrittKnopf() {
  if (sim && schrittIdx >= sim.schritte.length - 1) {
    neueSimulation();
    return;
  }
  naechsterSchritt();
}

function autoUmschalten() {
  if (sim && schrittIdx >= sim.schritte.length - 1) {
    neueSimulation();
  }
  laufAuto = !laufAuto;
  if (laufAuto && schrittIdx === 0) {
    animT0 = millis() - 100000;
  }
}

function neustart() {
  neueSimulation();
}

function beispielWechseln(i) {
  beispielIdx = i;
  neueSimulation();
  if (typeof leereVorhersage === "function") {
    leereVorhersage();
  }
}

function amEnde() {
  return sim && schrittIdx >= sim.schritte.length - 1;
}

// =============================================================================
// Freigabeprüfung
// =============================================================================
function naechsteAufgabe() {
  aufgabe = neuePruefung(stufe);
  rueckmeldung = null;
  antwortIdx = -1;
  aufloesung = false;
  laufAuto = false;
  sim = aufgabe.code ? fuehreAus(aufgabe.code, { dateien: aufgabe.dateien || undefined }) : null;
  schrittIdx = 0;
  animT0 = millis();
  if (typeof leereEingaben === "function") {
    leereEingaben();
  }
}

function pruefeAntwort(eingabe) {
  if (!aufgabe || rueckmeldung) {
    return;
  }
  let ok;
  if (aufgabe.art === "mc") {
    antwortIdx = eingabe;
    ok = eingabe === aufgabe.richtig;
  } else {
    if (String(eingabe).trim() === "") {
      return;
    }
    ok = antwortPasst(aufgabe, eingabe);
  }
  rueckT0 = millis();
  if (ok) {
    serie++;
    rueckmeldung = { ok: true, text: "Richtig – das Schloss springt auf!" };
    if (serie >= SERIE_ZIEL) {
      if (!freigaben[stufe]) {
        freigaben[stufe] = true;
        speichereFreigaben();
      }
      stempel = { stufe, t0: millis() };
      rueckmeldung.text = `Prüfsiegel erteilt: Freigabe als ${STUFEN[stufe].rang}!`;
      serie = 0;
    }
  } else {
    serie = 0;
    let txt = "Leider falsch – das Schloss bleibt zu. Die Serie beginnt von vorn.";
    if (aufgabe.art === "text") {
      txt = `Leider falsch. Richtig ist: „${aufgabe.antwort}“. Die Serie beginnt von vorn.`;
    } else if (aufgabe.art === "zahl") {
      txt = `Leider falsch – richtig ist ${aufgabe.antwort}. Die Serie beginnt von vorn.`;
    }
    rueckmeldung = { ok: false, text: txt };
  }
}

function zeigeAufloesung() {
  if (!aufgabe || !aufgabe.code) {
    return;
  }
  aufloesung = true;
  sim = fuehreAus(aufgabe.code, { dateien: aufgabe.dateien || undefined });
  schrittIdx = 0;
  laufAuto = true;
  animT0 = millis() - 100000;
}

function ladeFreigaben() {
  try {
    // Prüfsiegel je Raum-id (damit neue Räume die alten Siegel nicht verschieben)
    const roh = window.localStorage.getItem("tresorknacker-siegel");
    if (roh) {
      const obj = JSON.parse(roh);
      freigaben = STUFEN.map((st) => obj[st.id] === true);
    } else {
      const alt = window.localStorage.getItem("tresorknacker-freigaben");
      if (alt) {
        const ids = ["eingang", "bibliothek", "uhren", "schliessfach", "spiegel", "kessel"];
        const liste = JSON.parse(alt);
        freigaben = STUFEN.map((st) => Array.isArray(liste) && liste[ids.indexOf(st.id)] === true);
      }
    }
  } catch (e) {
    // kein Speicher verfügbar
  }
}

function speichereFreigaben() {
  try {
    const obj = {};
    STUFEN.forEach((st, i) => {
      obj[st.id] = freigaben[i];
    });
    window.localStorage.setItem("tresorknacker-siegel", JSON.stringify(obj));
  } catch (e) {
    // kein Speicher verfügbar
  }
}

function freigabenZuruecksetzen() {
  freigaben = STUFEN.map(() => false);
  speichereFreigaben();
}

// =============================================================================
// Maus und Tasten
// =============================================================================
function mausPos() {
  return { x: mouseX / S, y: mouseY / S - LEISTE };
}

function inRechteck(m, r) {
  return m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h;
}

function mousePressed() {
  try {
    const m = mausPos();
    if (modus === "pruefung" && aufgabe && aufgabe.art === "mc" && !rueckmeldung) {
      for (let i = 0; i < mcRechtecke.length; i++) {
        if (inRechteck(m, mcRechtecke[i])) {
          pruefeAntwort(i);
          return;
        }
      }
    }
  } catch (err) {
    behandleFehler(err);
  }
}

function keyPressed() {
  if (document.activeElement && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "SELECT")) {
    return;
  }
  if (modus === "pruefung" && !aufloesung) {
    return;
  }
  if (keyCode === RIGHT_ARROW) {
    schrittKnopf();
    return false;
  }
  if (key === " ") {
    autoUmschalten();
    return false;
  }
  if (key === "r" || key === "R") {
    neustart();
    return false;
  }
}

// =============================================================================
// Grundbausteine
// =============================================================================
function panel(p) {
  noStroke();
  fill(...FARBE.schatten, 10);
  rect(p.x + 1, p.y + 3, p.w, p.h, 12);
  fill(...FARBE.flaeche);
  stroke(...FARBE.linie);
  strokeWeight(1);
  rect(p.x, p.y, p.w, p.h, 12);
  stroke(...FARBE.linie);
  line(p.x + 12, p.y + KOPF_H, p.x + p.w - 12, p.y + KOPF_H);
  if (p.titel) {
    noStroke();
    fill(...FARBE.akzentHell);
    circle(p.x + 19, p.y + KOPF_H / 2 + 1, 7);
    fill(...FARBE.text);
    textFont(TITEL);
    textStyle(BOLD);
    textSize(16);
    textAlign(LEFT, CENTER);
    text(p.titel, p.x + 30, p.y + KOPF_H / 2 + 1);
    textStyle(NORMAL);
  }
}

function hell(farbe, anteil) {
  return [lerp(farbe[0], FARBE.flaeche[0], anteil), lerp(farbe[1], FARBE.flaeche[1], anteil), lerp(farbe[2], FARBE.flaeche[2], anteil)];
}

function umbrechen(txt, maxBreite) {
  const zeilen = [];
  for (const absatzText of String(txt).split("\n")) {
    const woerter = absatzText.split(" ");
    let akt = "";
    for (const wort of woerter) {
      const probe = akt ? akt + " " + wort : wort;
      if (textWidth(probe) > maxBreite && akt) {
        zeilen.push(akt);
        akt = wort;
      } else {
        akt = probe;
      }
    }
    zeilen.push(akt);
  }
  return zeilen;
}

function absatz(txt, x, y, breite, groesse, farbe, fett, maxZeilen) {
  textFont(SCHRIFT);
  textSize(groesse);
  textStyle(fett ? BOLD : NORMAL);
  textAlign(LEFT, TOP);
  fill(...(farbe || FARBE.text));
  noStroke();
  let zeilen = umbrechen(txt, breite);
  if (maxZeilen && zeilen.length > maxZeilen) {
    zeilen = zeilen.slice(0, maxZeilen);
    zeilen[maxZeilen - 1] += " …";
  }
  const za = groesse * 1.42;
  for (let i = 0; i < zeilen.length; i++) {
    text(zeilen[i], x, y + i * za);
  }
  textStyle(NORMAL);
  return zeilen.length * za;
}

function weich(t) {
  const u = constrain(t, 0, 1);
  return u * u * (3 - 2 * u);
}

// =============================================================================
// Kopf, Leiste, Status
// =============================================================================
function zeichneKopf() {
  noStroke();
  fill(...FARBE.flaeche);
  rect(0, 0, W, 56);
  stroke(...FARBE.linie);
  strokeWeight(1);
  line(0, 56, W, 56);
  noStroke();
  fill(...FARBE.akzentHell);
  circle(160, 28, 6);
  stroke(...FARBE.akzentHell);
  strokeWeight(3);
  line(170, 34, 180, 22);
  noStroke();
  fill(...FARBE.text);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(21);
  textAlign(LEFT, CENTER);
  text("Tresorknacker", 194, 21);
  textStyle(NORMAL);
  textFont(SCHRIFT);
  textSize(13);
  fill(...FARBE.blass);
  text(STUFEN[stufe].untertitel, 194, 41);
}

function zeichneStufenLeiste() {
  noStroke();
  fill(...FARBE.akzentFlaeche);
  rect(0, 56, W, LEISTE);
  stroke(...FARBE.akzentLinie);
  strokeWeight(1);
  line(0, 56 + LEISTE, W, 56 + LEISTE);
  noStroke();
  fill(...FARBE.akzent);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(15);
  textAlign(LEFT, CENTER);
  text("Raum", 26, 56 + LEISTE / 2);
  textStyle(NORMAL);
  stroke(...FARBE.akzent);
  strokeWeight(2);
  const px = 26 + textWidth("Raum") + 10;
  const py = 56 + LEISTE / 2;
  line(px, py - 5, px + 5, py);
  line(px + 5, py, px, py + 5);
  noStroke();
}

function zeichneStatus() {
  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(13);
  textAlign(LEFT, CENTER);
  let txt;
  if (modus === "pruefung") {
    txt = `Freigabeprüfung „${STUFEN[stufe].rang}“: ${SERIE_ZIEL} richtige Antworten in Folge ergeben das Prüfsiegel. Das Programm steht links, die Antwort ist der Code für das Schloss.`;
  } else {
    txt = "Erst die Ausgabe vorhersagen, dann durchsteppen · → nächster Schritt · Leertaste automatisch · R Neustart";
  }
  text(txt, 26, 70);
}


// =============================================================================
// Die Welt: Quelltext, Tür mit Code-Schloss, Speicher
// =============================================================================
function zeichneWelt() {
  const p = P_WELT;
  p.titel = `Raum ${stufe + 1} · ${STUFEN[stufe].name}`;
  panel(p);
  noStroke();
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(12);
  textAlign(RIGHT, CENTER);
  text(STUFEN[stufe].thema, p.x + p.w - 16, p.y + KOPF_H / 2 + 1);
  zeichneCode();
  zeichneTuer();
  zeichneSpeicher();
}

// ---------------------------------------------------------------------------
// Quelltext mit Hervorhebung
// ---------------------------------------------------------------------------
function zerlegeZeile(z) {
  // liefert [{t, art}]
  const teile = [];
  if (/^\s*#/.test(z)) {
    return [{ t: z, art: "praep" }];
  }
  let i = 0;
  while (i < z.length) {
    const rest = z.slice(i);
    let m;
    if (rest.startsWith("//")) {
      teile.push({ t: rest, art: "kommentar" });
      break;
    }
    if ((m = rest.match(/^"(\\.|[^"\\])*"/)) || (m = rest.match(/^'(\\.|[^'\\])*'/))) {
      teile.push({ t: m[0], art: "text" });
    } else if ((m = rest.match(/^[0-9]+(\.[0-9]+)?/))) {
      teile.push({ t: m[0], art: "zahl" });
    } else if ((m = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/))) {
      const w = m[0];
      teile.push({ t: w, art: TYPWOERTER.indexOf(w) >= 0 ? "typ" : SCHLUESSELWOERTER.indexOf(w) >= 0 ? "wort" : "name" });
    } else {
      m = [rest[0]];
      teile.push({ t: rest[0], art: "zeichen" });
    }
    i += m[0].length;
  }
  return teile;
}

function codeZeilen() {
  if (sim) {
    return sim.zeilen;
  }
  return [];
}

function zeichneCode() {
  const c = CODE;
  noStroke();
  fill(...FARBE.papier);
  stroke(...FARBE.linie);
  strokeWeight(1);
  rect(c.x, c.y, c.w, c.h, 8);
  const zeilen = codeZeilen();
  if (!zeilen.length) {
    absatz("Bei dieser Frage gibt es kein Programm – denk an das, was du in den Räumen gelernt hast.", c.x + 20, c.y + 30, c.w - 40, 14, FARBE.blass);
    return;
  }
  const lh = Math.min(22, (c.h - 20) / zeilen.length);
  const laengste = Math.max(...zeilen.map((z) => z.length));
  const groesse = Math.min(14, lh * 0.68, (c.w - 64) / (laengste * 0.6));
  const s = aktSchritt();
  const v = vorigerSchritt();
  const ablauf = zeigtAblauf() && s;
  // Hervorhebung der aktuellen Zeile (gleitet von der vorigen Zeile)
  if (ablauf && s.zeile) {
    const yNeu = c.y + 10 + (s.zeile - 1) * lh;
    const yAlt = v && v.zeile ? c.y + 10 + (v.zeile - 1) * lh : yNeu;
    const y = lerp(yAlt, yNeu, weich(animT()));
    noStroke();
    fill(...(s.fehler ? hell(FARBE.akzent, 0.8) : s.fertig ? hell(FARBE.gruen, 0.78) : hell(FARBE.senf, 0.68)));
    rect(c.x + 4, y, c.w - 8, lh, 4);
    fill(...(s.fehler ? FARBE.akzent : FARBE.text));
    textFont(MONO);
    textSize(groesse);
    textAlign(LEFT, CENTER);
    text(s.fehler ? "✗" : "▶", c.x + 8, y + lh / 2);
  }
  textFont(MONO);
  textSize(groesse);
  textAlign(LEFT, CENTER);
  const zeichenB = textWidth("M");
  zeilen.forEach((z, i) => {
    const y = c.y + 10 + i * lh + lh / 2;
    noStroke();
    fill(...FARBE.blass);
    textAlign(RIGHT, CENTER);
    text(i + 1, c.x + 44, y);
    textAlign(LEFT, CENTER);
    let x = c.x + 54;
    for (const t of zerlegeZeile(z)) {
      if (t.art === "typ") {
        fill(...SYNTAX.typ);
      } else if (t.art === "wort") {
        fill(...SYNTAX.wort);
      } else if (t.art === "zahl") {
        fill(...SYNTAX.zahl);
      } else if (t.art === "text") {
        fill(...SYNTAX.text);
      } else if (t.art === "kommentar") {
        fill(...SYNTAX.kommentar);
      } else if (t.art === "praep") {
        fill(...SYNTAX.praep);
      } else {
        fill(...FARBE.text);
      }
      if (t.art === "typ" || t.art === "wort") {
        textStyle(BOLD);
      }
      text(t.t, x, y);
      textStyle(NORMAL);
      x += t.t.length * zeichenB;
    }
  });
}

// ---------------------------------------------------------------------------
// Tür mit Code-Schloss
// ---------------------------------------------------------------------------
function zeichneRaumSymbol(id, x, y) {
  push();
  translate(x, y);
  stroke(...FARBE.text);
  strokeWeight(2);
  noFill();
  if (id === "eingang") {
    circle(10, 16, 14);
    line(17, 16, 36, 16);
    line(30, 16, 30, 22);
    line(35, 16, 35, 21);
  } else if (id === "bibliothek") {
    fill(...FARBE.akzent);
    rect(4, 6, 8, 26, 1);
    fill(...FARBE.flaeche);
    rect(13, 10, 7, 22, 1);
    rect(21, 4, 9, 28, 1);
    push();
    translate(32, 32);
    rotate(-0.3);
    rect(0, -24, 6, 24, 1);
    pop();
  } else if (id === "uhren") {
    fill(...FARBE.flaeche);
    circle(19, 18, 30);
    line(19, 18, 19, 8);
    line(19, 18, 26, 22);
    noStroke();
    fill(...FARBE.akzent);
    circle(19, 18, 4);
  } else if (id === "schliessfach") {
    fill(...FARBE.flaeche);
    for (let i = 0; i < 3; i++) {
      rect(2 + i * 12, 4, 11, 28, 1);
    }
    noStroke();
    fill(...FARBE.akzent);
    circle(11, 18, 3);
    circle(23, 18, 3);
    circle(35, 18, 3);
  } else if (id === "spiegel") {
    fill(232, 238, 244);
    ellipse(19, 18, 26, 32);
    stroke(...FARBE.flaeche);
    line(12, 10, 16, 6);
    line(12, 16, 20, 7);
  } else if (id === "lager") {
    line(2, 30, 38, 30);
    circle(6, 34, 6);
    circle(34, 34, 6);
    fill(...FARBE.flaeche);
    rect(6, 16, 12, 12, 1);
    rect(20, 16, 12, 12, 1);
    noStroke();
    fill(...FARBE.akzent);
    rect(23, 6, 6, 8, 1);
  } else if (id === "funk") {
    line(19, 12, 19, 34);
    line(12, 34, 26, 34);
    noFill();
    arc(19, 12, 14, 14, PI + 0.6, TWO_PI - 0.6);
    arc(19, 12, 26, 26, PI + 0.6, TWO_PI - 0.6);
    noStroke();
    fill(...FARBE.akzent);
    circle(19, 12, 5);
  } else if (id === "archiv") {
    fill(...FARBE.flaeche);
    rect(4, 14, 30, 20, 2);
    rect(8, 8, 22, 8, 1);
    line(14, 24, 24, 24);
    noStroke();
    fill(...FARBE.akzent);
    circle(19, 24, 4);
  } else if (id === "labyrinth") {
    rect(3, 3, 32, 32, 2);
    line(11, 3, 11, 25);
    line(19, 11, 19, 35);
    line(27, 3, 27, 25);
    noStroke();
    fill(...FARBE.akzent);
    circle(31, 31, 5);
  } else if (id === "tresor") {
    fill(...FARBE.flaeche);
    rect(3, 4, 32, 30, 3);
    circle(19, 19, 14);
    line(19, 19, 23, 15);
    noStroke();
    fill(...FARBE.akzent);
    circle(19, 19, 4);
  } else {
    fill(...FARBE.flaeche);
    arc(19, 22, 34, 34, PI, TWO_PI, CHORD);
    stroke(...FARBE.akzent);
    line(19, 22, 30, 10);
    noStroke();
    fill(...FARBE.akzent);
    circle(19, 22, 5);
  }
  pop();
}

function schlossCode() {
  if (modus === "pruefung" && !aufloesung) {
    return ui && ui.antwort ? ui.antwort.value() : "";
  }
  const s = aktSchritt();
  return s ? ausgabeNormal(s.ausgabe) : "";
}

function tuerOffen() {
  if (modus === "pruefung" && !aufloesung) {
    return rueckmeldung && rueckmeldung.ok ? weich((millis() - rueckT0) / 700) : 0;
  }
  const s = aktSchritt();
  if (s && s.fertig && !sim.fehler) {
    return weich(animT() * 0.4 + Math.min(1, (millis() - animT0) / 900) * 0.6);
  }
  return 0;
}

function zeichneTuer() {
  const t = TUER;
  const id = STUFEN[stufe].id;
  zeichneRaumSymbol(id, t.x + 2, t.y + 2);
  noStroke();
  fill(...FARBE.text);
  textFont(TITEL);
  textStyle(BOLD);
  textSize(15);
  textAlign(LEFT, TOP);
  text(STUFEN[stufe].name, t.x + 50, t.y + 4);
  textStyle(NORMAL);
  textFont(SCHRIFT);
  textSize(11.5);
  fill(...FARBE.grau);
  text(`Rang nach der Prüfung: ${STUFEN[stufe].rang}`, t.x + 50, t.y + 24);

  // Code-Schloss
  const sx = t.x + 2;
  const sy = t.y + 54;
  const sw = 248;
  const offen = tuerOffen();
  const s = aktSchritt();
  const fehler = (zeigtAblauf() && s && s.fehler) || (modus === "pruefung" && !aufloesung && rueckmeldung && !rueckmeldung.ok);
  let wackel = 0;
  if (modus === "pruefung" && rueckmeldung && !rueckmeldung.ok && millis() - rueckT0 < 500) {
    wackel = sin((millis() - rueckT0) / 25) * 4 * (1 - (millis() - rueckT0) / 500);
  }
  push();
  translate(wackel, 0);
  noStroke();
  fill(70, 72, 78);
  rect(sx, sy, sw, 122, 10);
  fill(30, 38, 30);
  rect(sx + 12, sy + 12, sw - 24, 44, 6);
  // Code im Display
  let code = schlossCode();
  textFont(MONO);
  textSize(18);
  while (textWidth(code) > sw - 44 && code.length > 1) {
    code = code.slice(1);
  }
  const leer = code === "";
  fill(...(fehler ? [255, 110, 110] : offen > 0 ? [140, 255, 160] : [120, 230, 140]));
  textAlign(LEFT, CENTER);
  if (leer) {
    fill(70, 110, 76);
    text(modus === "pruefung" && !aufloesung ? (aufgabe && aufgabe.art === "mc" ? "Antwort wählen …" : "Code eingeben …") : "— — — —", sx + 22, sy + 34);
  } else {
    text(code, sx + 22, sy + 34);
  }
  if (!leer && frameCount % 60 < 30 && offen === 0) {
    rect(sx + 22 + textWidth(code) + 3, sy + 24, 2, 20);
  }
  // Lampe und Text
  fill(...(offen > 0 ? [80, 210, 110] : fehler ? [235, 70, 70] : [160, 70, 60]));
  circle(sx + 24, sy + 82, 14);
  fill(255);
  textFont(SCHRIFT);
  textStyle(BOLD);
  textSize(13);
  textAlign(LEFT, CENTER);
  text(offen > 0 ? "entriegelt" : fehler ? "Fehler – verriegelt" : "verriegelt", sx + 40, sy + 82);
  textStyle(NORMAL);
  fill(200, 200, 205);
  textSize(10.5);
  text("Code = die komplette Ausgabe des Programms", sx + 12, sy + 106);
  pop();

  // Tür
  const tx = t.x + 270;
  const ty = t.y + 6;
  const tw = 110;
  const th = 186;
  noStroke();
  fill(...FARBE.text);
  rect(tx - 6, ty - 6, tw + 12, th + 6, 4, 4, 0, 0);
  fill(...(offen > 0 ? [255, 236, 170] : [40, 40, 44]));
  rect(tx, ty, tw, th);
  if (offen > 0) {
    // Licht aus dem nächsten Raum
    fill(255, 246, 210);
    textFont(TITEL);
    textStyle(BOLD);
    textSize(12);
    textAlign(CENTER, CENTER);
    fill(150, 110, 30);
    text(stufe < STUFEN.length - 1 ? "weiter →" : "Tresor ✓", tx + tw / 2 + 12, ty + th / 2);
    textStyle(NORMAL);
  }
  // Türblatt (klappt nach links auf)
  const breite = tw * (1 - offen * 0.82);
  fill(...hell(FARBE.akzent, 0.1));
  quad(tx, ty, tx + breite, ty + offen * 14, tx + breite, ty + th - offen * 14, tx, ty + th);
  stroke(...FARBE.flaeche, 255, 255, 60);
  strokeWeight(1.5);
  noFill();
  if (offen < 0.5) {
    rect(tx + 12, ty + 14, breite - 24, 64, 3);
    rect(tx + 12, ty + 92, breite - 24, 80, 3);
  }
  noStroke();
  fill(...FARBE.senf);
  circle(tx + breite - 14, ty + th / 2 + 6, 9);
}

// ---------------------------------------------------------------------------
// Speicher: Variablen nach Gültigkeitsbereich, Dateien, Zeiger-Pfeile
// ---------------------------------------------------------------------------
function frameFarbe(art) {
  return art === "global" ? FARBE.senf : art === "main" ? FARBE.blau : art === "datei" ? FARBE.gruen : FARBE.violett;
}

const CHIP_W = 84;
const CHIP_H = 42;

// Wie wird eine Variable dargestellt?
function darstellung(v) {
  const t = v.z.t;
  if (v.alias) {
    return "chip";
  }
  if ((t.k === "array" || t.k === "vector") && t.elem.k === "basis") {
    return "reihe";
  }
  if (t.k === "array" || t.k === "vector" || t.k === "struct") {
    return "karte";
  }
  if (t.k === "string" && v.z.w.length > 8) {
    return "karte";
  }
  return "chip";
}

function kartenZeilen(z) {
  const t = z.t;
  if (t.k === "struct") {
    return t.felder.map((f) => ({ name: f.name, z: z.w[f.name] }));
  }
  if (t.k === "array" || t.k === "vector") {
    return z.w.map((e, i) => ({ name: `[${i}]`, z: e }));
  }
  return [{ name: "", z }];
}

function varHoehe(v, breite) {
  const d = darstellung(v);
  if (d === "reihe") {
    const n = Math.max(1, v.z.w.length);
    const zw = Math.max(15, Math.min(44, (breite - 4) / n));
    const proZeile = Math.max(1, Math.floor((breite - 4) / zw));
    return 18 + Math.ceil(n / proZeile) * 44;
  }
  if (d === "karte") {
    return 22 + kartenZeilen(v.z).length * 15 + 6;
  }
  return CHIP_H;
}

function frameHoehe(f, breite) {
  let h = 24;
  const chips = f.vars.filter((v) => darstellung(v) === "chip");
  const proZeile = Math.max(1, Math.floor((breite - 12) / (CHIP_W + 6)));
  h += Math.ceil(chips.length / proZeile) * (CHIP_H + 6);
  for (const v of f.vars.filter((x) => darstellung(x) !== "chip")) {
    h += varHoehe(v, breite - 16) + 6;
  }
  return h + (f.vars.length ? 2 : 22);
}

function dateiZeilen(d, breite) {
  textFont(MONO);
  textSize(10.5);
  const zeilen = [];
  let akt = "";
  let start = 0;
  const txt = d.inhalt;
  for (let i = 0; i <= txt.length; i++) {
    const c = i < txt.length ? txt[i] : null;
    if (c === null || c === "\n" || textWidth(akt + (c || "")) > breite) {
      zeilen.push({ t: akt, start, nl: c === "\n" });
      if (c === "\n") {
        akt = "";
        start = i + 1;
        continue;
      }
      if (c === null) {
        break;
      }
      akt = "";
      start = i;
    }
    akt += c;
  }
  return zeilen.slice(0, 6);
}

function dateiHoehe(d, breite) {
  return 24 + Math.max(1, dateiZeilen(d, breite - 20).length) * 14 + 8;
}

function zeichneSpeicher() {
  const sp = SPEICHER;
  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textStyle(BOLD);
  textSize(12);
  textAlign(LEFT, TOP);
  const s = aktSchritt();
  const dateien = s && zeigtAblauf() ? s.dateien || [] : [];
  text(dateien.length ? "Speicher und Dateien" : "Speicher – Variablen nach Gültigkeitsbereich", sp.x + 2, sp.y);
  textStyle(NORMAL);
  if (!zeigtAblauf() || !s) {
    let hinweis = "";
    if (modus === "pruefung") {
      hinweis = "Erst selbst durchdenken: Welche Werte stehen in den Variablen? Nach der Antwort zeigt „Ablauf zeigen“ den Speicher Schritt für Schritt.";
      if (aufgabe && aufgabe.dateien && Object.keys(aufgabe.dateien).length) {
        hinweis += " Vorhandene Dateien: " + Object.keys(aufgabe.dateien).map((n) => `${n} = „${aufgabe.dateien[n].replace(/\n/g, "⏎")}“`).join(", ");
      }
    }
    absatz(hinweis, sp.x + 2, sp.y + 26, sp.w - 4, 12.5, FARBE.blass);
    return;
  }
  const frames = s.speicher;
  if (!frames.length && !dateien.length) {
    absatz("Noch keine Variablen.", sp.x + 2, sp.y + 26, sp.w - 4, 12.5, FARBE.blass);
    return;
  }
  let gesamt = 0;
  for (const f of frames) {
    gesamt += frameHoehe(f, sp.w) + 8;
  }
  for (const d of dateien) {
    gesamt += dateiHoehe(d, sp.w) + 8;
  }
  const sk = Math.min(1, (sp.h - 22) / gesamt);
  const zeigeAdr = frames.some((f) => f.vars.some((v) => v.z.t.k === "zeiger" || v.alias));
  const pos = new Map();
  const zeiger = [];
  push();
  translate(sp.x, sp.y + 22);
  scale(sk);
  let y = 0;
  const weg = s.weg || [];
  frames.forEach((f, fi) => {
    const h = frameHoehe(f, sp.w);
    const farbe = frameFarbe(f.art);
    const verschwindet = s.art === "return" && fi === frames.length - 1 && f.art === "funktion";
    stroke(...farbe);
    strokeWeight(f.art === "funktion" ? 2.5 : 1.5);
    fill(...hell(farbe, 0.93));
    rect(0, y, sp.w, h, 8);
    if (f.art === "funktion") {
      stroke(...FARBE.flaeche, 255, 255, 180);
      strokeWeight(1);
      noFill();
      rect(3, y + 3, sp.w - 6, h - 6, 6);
    }
    noStroke();
    fill(...farbe);
    rect(0, y, sp.w, 20, 8, 8, 0, 0);
    fill(255);
    textFont(MONO);
    textStyle(BOLD);
    textSize(11.5);
    textAlign(LEFT, CENTER);
    text(f.titel === "global" ? "global" : `lokal in ${f.titel}`, 10, y + 10);
    textStyle(NORMAL);
    if (verschwindet) {
      textAlign(RIGHT, CENTER);
      text("wird gelöscht", sp.w - 10, y + 10);
    }
    let yy = y + 26;
    if (!f.vars.length) {
      fill(...FARBE.blass);
      textFont(SCHRIFT);
      textSize(11);
      textAlign(LEFT, TOP);
      text("(keine Variablen)", 10, yy);
    }
    const chips = f.vars.filter((v) => darstellung(v) === "chip");
    const proZeile = Math.max(1, Math.floor((sp.w - 12) / (CHIP_W + 6)));
    chips.forEach((v, i) => {
      const cx = 8 + (i % proZeile) * (CHIP_W + 6);
      const cy = yy + Math.floor(i / proZeile) * (CHIP_H + 6);
      zeichneVariable(v, cx, cy, s, verschwindet || weg.indexOf(v.name) >= 0, zeigeAdr, pos, zeiger);
    });
    yy += Math.ceil(chips.length / proZeile) * (CHIP_H + 6);
    for (const v of f.vars.filter((x) => darstellung(x) !== "chip")) {
      const vh = varHoehe(v, sp.w - 16);
      if (darstellung(v) === "reihe") {
        zeichneReihe(v, 8, yy, sp.w - 16, s, verschwindet || weg.indexOf(v.name) >= 0, pos);
      } else {
        zeichneKarte(v, 8, yy, sp.w - 16, vh, s, verschwindet || weg.indexOf(v.name) >= 0, pos, zeiger);
      }
      yy += vh + 6;
    }
    y += h + 8;
  });
  for (const d of dateien) {
    y += zeichneDatei(d, 0, y, sp.w, s) + 8;
  }
  // Zeiger als Pfeile
  for (const z of zeiger) {
    const ziel = pos.get(z.ziel);
    if (!ziel) {
      continue;
    }
    const x1 = z.x;
    const y1 = z.y;
    const x2 = ziel.x + ziel.w / 2;
    const y2 = ziel.y + (ziel.y > y1 ? 0 : ziel.h);
    noFill();
    stroke(...FARBE.akzent, 200);
    strokeWeight(2);
    const mx = Math.max(x1, x2) + 30;
    bezier(x1, y1, mx, y1, mx, y2 + (ziel.y > y1 ? -20 : 20), x2, y2);
    noStroke();
    fill(...FARBE.akzent);
    const dir = ziel.y > y1 ? -1 : 1;
    triangle(x2, y2, x2 - 5, y2 + dir * 9, x2 + 5, y2 + dir * 9);
  }
  pop();
}

function wertGross(z) {
  const t = z.t;
  if (t.k === "basis") {
    if (z.w === undefined) {
      return "?";
    }
    if (t.name === "char") {
      return z.w === 0 ? "'\\0'" : z.w === 10 ? "'\\n'" : z.w >= 32 && z.w <= 126 ? `'${String.fromCharCode(z.w)}'` : String(z.w);
    }
    if (t.name === "double") {
      return fmtDouble(z.w);
    }
    return String(z.w);
  }
  if (t.k === "string") {
    return `"${z.w.replace(/\n/g, "⏎")}"`;
  }
  if (t.k === "zeiger") {
    return z.w.ziel !== undefined ? `→ ${z.w.name}` : z.w.nul ? "NULL" : "?";
  }
  if (t.k === "stream") {
    return z.w.datei ? z.w.datei : "–";
  }
  return kurzText(z);
}

function zeichneVariable(v, x, y, s, verschwindet, zeigeAdr, pos, zeiger) {
  const z = v.z;
  const neu = s.geaendert.indexOf(v.key) >= 0 || (v.alias && false);
  const w = CHIP_W;
  const h = CHIP_H;
  stroke(...(neu ? FARBE.akzent : v.alias ? FARBE.violett : FARBE.linie));
  strokeWeight(neu ? 2 : 1);
  if (v.tiefe > 0 || v.alias) {
    drawingContext.setLineDash([4, 3]);
  }
  fill(...(neu ? hell(FARBE.akzent, 0.9) : FARBE.flaeche));
  rect(x, y, w, h, 6);
  drawingContext.setLineDash([]);
  noStroke();
  const alpha = verschwindet ? 110 : 255;
  fill(...FARBE.grau, alpha);
  textFont(MONO);
  textSize(10.5);
  textAlign(LEFT, TOP);
  let nm = v.name;
  while (textWidth(nm) > 44 && nm.length > 2) {
    nm = nm.slice(0, -1);
  }
  text(nm, x + 5, y + 3);
  textAlign(RIGHT, TOP);
  fill(...FARBE.blass, alpha);
  textSize(8.5);
  let tn = v.alias ? "Referenz" : typName(z.t);
  while (textWidth(tn) > w - textWidth(nm) - 14 && tn.length > 3) {
    tn = tn.slice(0, -1);
  }
  text(tn, x + w - 4, y + 4);
  let wt = v.alias ? `→ ${v.alias}` : wertGross(z);
  fill(...((z.t.k === "basis" && z.w === undefined) || (z.t.k === "zeiger" && z.w.wild) ? FARBE.blass : z.t.k === "zeiger" || v.alias ? FARBE.akzent : FARBE.text), alpha);
  textStyle(BOLD);
  let gr = 15;
  textSize(gr);
  while (textWidth(wt) > w - 10 && gr > 9) {
    gr -= 1;
    textSize(gr);
  }
  while (textWidth(wt) > w - 10 && wt.length > 2) {
    wt = wt.slice(0, -2) + "…";
  }
  textAlign(LEFT, BOTTOM);
  text(wt, x + 5, y + h - (zeigeAdr ? 11 : 4));
  textStyle(NORMAL);
  if (z.t.k === "basis" && z.t.name === "char" && z.w !== undefined && z.w >= 32 && z.w <= 126) {
    fill(...FARBE.blass, alpha);
    textSize(9);
    textAlign(RIGHT, BOTTOM);
    text(z.w, x + w - 4, y + h - (zeigeAdr ? 11 : 4));
  }
  if (zeigeAdr && !v.alias && z.adr) {
    fill(...FARBE.blass, alpha);
    textSize(8);
    textAlign(LEFT, BOTTOM);
    text(hexAdr(z.adr), x + 5, y + h - 2);
  }
  if (verschwindet) {
    stroke(...FARBE.akzent);
    strokeWeight(1.5);
    line(x + 4, y + h / 2, x + w - 4, y + h / 2);
    noStroke();
  }
  if (!v.alias) {
    pos.set(z.id, { x, y, w, h });
  }
  if (z.t.k === "zeiger" && z.w.ziel !== undefined) {
    zeiger.push({ x: x + w, y: y + h / 2, ziel: z.w.ziel });
  } else if (v.alias) {
    zeiger.push({ x: x + w, y: y + h / 2, ziel: z.id });
  }
}

function zeichneReihe(v, x, y, breite, s, verschwindet, pos) {
  const z = v.z;
  noStroke();
  fill(...FARBE.grau);
  textFont(MONO);
  textSize(10.5);
  textAlign(LEFT, TOP);
  let kopf = `${typName(z.t)} ${v.name}`;
  if (z.t.k === "array") {
    kopf = `${typName(z.t.elem)} ${v.name}[${z.w.length}]`;
  } else {
    kopf += `  ·  size() = ${z.w.length}`;
  }
  if (z.t.k === "array" && z.t.elem.name === "char") {
    const c = cStringText(z);
    kopf += `  ·  Text: ${c}`;
  }
  text(kopf, x, y);
  const neuGanz = s.geaendert.indexOf(v.key) >= 0;
  const n = z.w.length;
  if (!n) {
    fill(...FARBE.blass);
    textSize(10.5);
    text("(leer)", x, y + 22);
    return;
  }
  const zw = Math.max(15, Math.min(44, (breite - 4) / n));
  const proZeile = Math.max(1, Math.floor((breite - 4) / zw));
  z.w.forEach((e, i) => {
    const key = `${v.key}[${i}]`;
    const neu = s.geaendert.indexOf(key) >= 0 || (neuGanz && z.t.k === "vector");
    const cx = x + (i % proZeile) * zw;
    const cy = y + 15 + Math.floor(i / proZeile) * 44;
    const nullz = z.t.elem.name === "char" && e.w === 0;
    stroke(...(neu ? FARBE.akzent : [150, 146, 138]));
    strokeWeight(neu ? 2 : 1);
    fill(...(neu ? hell(FARBE.akzent, 0.88) : nullz ? [226, 232, 240] : FARBE.flaeche2));
    rect(cx, cy, zw - 3, 28, 3);
    noStroke();
    fill(...(e.w === undefined ? FARBE.blass : nullz ? FARBE.blau : FARBE.text), verschwindet ? 110 : 255);
    textStyle(BOLD);
    let wt = wertGross(e);
    if (z.t.elem.name === "char" && e.w !== undefined && e.w !== 0 && e.w >= 32 && e.w <= 126) {
      wt = String.fromCharCode(e.w);
    }
    let gr = Math.min(13, zw * 0.42);
    textSize(gr);
    while (textWidth(wt) > zw - 5 && gr > 7) {
      gr -= 1;
      textSize(gr);
    }
    textAlign(CENTER, CENTER);
    text(wt, cx + (zw - 3) / 2, cy + 14);
    textStyle(NORMAL);
    fill(...FARBE.blass);
    textSize(Math.min(9, zw * 0.5));
    textAlign(CENTER, TOP);
    text(i, cx + (zw - 3) / 2, cy + 30);
    pos.set(e.id, { x: cx, y: cy, w: zw - 3, h: 28 });
  });
  pos.set(z.id, { x, y: y + 15, w: zw - 3, h: 28 });
}

function cStringText(z) {
  let t = "";
  for (const e of z.w) {
    if (e.w === 0) {
      return `"${t}"`;
    }
    t += e.w === undefined ? "?" : String.fromCharCode(e.w);
  }
  return `"${t}…" (kein \\0!)`;
}

function zeichneKarte(v, x, y, breite, h, s, verschwindet, pos, zeiger) {
  const z = v.z;
  const neu = s.geaendert.indexOf(v.key) >= 0;
  stroke(...(neu ? FARBE.akzent : FARBE.linie));
  strokeWeight(neu ? 2 : 1);
  if (v.tiefe > 0) {
    drawingContext.setLineDash([4, 3]);
  }
  fill(...(neu ? hell(FARBE.akzent, 0.92) : FARBE.flaeche));
  rect(x, y, breite, h, 6);
  drawingContext.setLineDash([]);
  noStroke();
  fill(...FARBE.grau);
  textFont(MONO);
  textSize(10.5);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  text(`${typName(z.t)} ${v.name}${z.t.k === "vector" ? `  ·  size() = ${z.w.length}` : ""}`, x + 6, y + 4);
  textStyle(NORMAL);
  pos.set(z.id, { x, y, w: breite, h });
  let yy = y + 22;
  const alpha = verschwindet ? 110 : 255;
  for (const zl of kartenZeilen(z)) {
    fill(...FARBE.blass, alpha);
    textSize(10.5);
    textAlign(LEFT, TOP);
    text(zl.name, x + 10, yy);
    const nb = Math.max(56, textWidth(zl.name) + 14);
    fill(...(zl.z.t.k === "zeiger" ? FARBE.akzent : FARBE.text), alpha);
    let wt = zl.z.t.k === "basis" || zl.z.t.k === "zeiger" || zl.z.t.k === "string" ? wertGross(zl.z) : kurzText(zl.z);
    while (textWidth(wt) > breite - nb - 14 && wt.length > 3) {
      wt = wt.slice(0, -2) + "…";
    }
    text(wt, x + nb, yy);
    pos.set(zl.z.id, { x: x + nb, y: yy - 1, w: Math.min(breite - nb - 10, textWidth(wt) + 4), h: 14 });
    if (zl.z.t.k === "zeiger" && zl.z.w.ziel !== undefined) {
      zeiger.push({ x: x + nb + textWidth(wt) + 4, y: yy + 6, ziel: zl.z.w.ziel });
    }
    yy += 15;
  }
}

function zeichneDatei(d, x, y, breite, s) {
  const h = dateiHoehe(d, breite);
  const farbe = FARBE.gruen;
  const neu = s.flags && s.flags.datei === d.name;
  stroke(...(neu ? FARBE.akzent : farbe));
  strokeWeight(neu ? 2.5 : 1.5);
  fill(...hell(farbe, 0.94));
  rect(x, y, breite, h, 8);
  noStroke();
  fill(...farbe);
  rect(x, y, breite, 20, 8, 8, 0, 0);
  fill(255);
  textFont(MONO);
  textStyle(BOLD);
  textSize(11.5);
  textAlign(LEFT, CENTER);
  text(`Datei ${d.name}`, x + 10, y + 10);
  textStyle(NORMAL);
  textAlign(RIGHT, CENTER);
  const status = [];
  if (d.lese.length) {
    status.push("wird gelesen");
  }
  if (d.schreib) {
    status.push("wird beschrieben");
  }
  text(status.join(" · ") || (d.neu ? "neu" : ""), x + breite - 10, y + 10);
  const zeilen = dateiZeilen(d, breite - 20);
  textFont(MONO);
  textSize(10.5);
  textAlign(LEFT, TOP);
  let yy = y + 26;
  if (!d.inhalt.length) {
    fill(...FARBE.blass);
    text("(leer)", x + 10, yy);
  }
  for (const z of zeilen) {
    let xx = x + 10;
    for (let i = 0; i <= z.t.length; i++) {
      const p = z.start + i;
      const cursor = d.lese.indexOf(p) >= 0;
      const c = i < z.t.length ? z.t[i] : z.nl ? "⏎" : "";
      if (cursor) {
        fill(...hell(FARBE.akzent, 0.75));
        rect(xx - 1, yy - 1, Math.max(6, textWidth(c || " ")) + 2, 14, 2);
      }
      fill(...(c === "⏎" ? FARBE.blass : FARBE.text));
      text(c, xx, yy);
      xx += textWidth(c);
    }
    yy += 14;
  }
  return h;
}

// =============================================================================
// Schreibtischtest (Variablentafel)
// =============================================================================
function spaltenName(sp, alle) {
  const doppelt = alle.filter((x) => x.name === sp.name).length > 1;
  if (!doppelt) {
    return sp.name;
  }
  const teile = sp.key.split(":");
  if (teile[0] === "global") {
    return `${sp.name} (g)`;
  }
  const tiefe = parseInt(teile[2], 10);
  const f = teile[0].length > 7 ? teile[0].slice(0, 6) + "…" : teile[0];
  return `${sp.name} (${f}${tiefe > 0 ? ", Block" : ""})`;
}

function zeichneTafel() {
  const p = P_TAFEL;
  panel(p);
  const x0 = p.x + 12;
  const y0 = p.y + KOPF_H + 6;
  const b = p.w - 24;
  const s = aktSchritt();
  if (!zeigtAblauf() || !s || !sim) {
    absatz("Beim Durchsteppen entsteht hier der Schreibtischtest: Jede Zeile hält fest, welche Variable sich in welcher Programmzeile ändert und was ausgegeben wird.", x0 + 4, y0 + 10, b - 8, 12.5, FARBE.blass);
    return;
  }
  const zeilen = sim.tabelle.slice(0, s.tabN);
  const zeilenH = 19;
  const maxZeilen = Math.floor((p.y + p.h - 10 - (y0 + 22)) / zeilenH);
  const sichtbar = zeilen.slice(Math.max(0, zeilen.length - maxZeilen));
  // Spalten bestimmen
  let spalten = sim.spalten.filter((sp) => zeilen.some((z) => z.zellen[sp.key] !== undefined));
  textFont(MONO);
  textSize(10.5);
  const zeileB = 44;
  const ausB = 82;
  const platz = b - zeileB - ausB;
  const breiteVon = (sp) => {
    let w = textWidth(spaltenName(sp, sim.spalten)) + 12;
    for (const z of sichtbar) {
      if (z.zellen[sp.key] !== undefined) {
        w = Math.max(w, textWidth(z.zellen[sp.key]) + 12);
      }
    }
    return Math.max(34, Math.min(90, w));
  };
  let breiten = spalten.map(breiteVon);
  while (breiten.reduce((a, c) => a + c, 0) > platz && spalten.length > 1) {
    // älteste Spalte ohne Änderung in den sichtbaren Zeilen zuerst weglassen
    let idx = spalten.findIndex((sp) => !sichtbar.some((z) => z.zellen[sp.key] !== undefined));
    if (idx < 0) {
      idx = 0;
    }
    spalten.splice(idx, 1);
    breiten.splice(idx, 1);
  }
  const summe = breiten.reduce((a, c) => a + c, 0);
  const extra = spalten.length ? (platz - summe) / spalten.length : 0;
  breiten = breiten.map((w) => w + Math.max(0, Math.min(extra, 30)));
  // Kopf
  noStroke();
  fill(...FARBE.flaeche2);
  rect(x0, y0, b, 20, 4);
  fill(...FARBE.grau);
  textStyle(BOLD);
  textAlign(LEFT, CENTER);
  text("Zeile", x0 + 4, y0 + 10);
  let cx = x0 + zeileB;
  spalten.forEach((sp, i) => {
    let kopf = spaltenName(sp, sim.spalten);
    while (textWidth(kopf) > breiten[i] - 6 && kopf.length > 2) {
      kopf = kopf.slice(0, -1);
    }
    text(kopf, cx + 4, y0 + 10);
    cx += breiten[i];
  });
  text("Ausgabe", cx + 4, y0 + 10);
  textStyle(NORMAL);
  // Zeilen
  let y = y0 + 22;
  sichtbar.forEach((z, zi) => {
    const neu = zi === sichtbar.length - 1 && z === zeilen[zeilen.length - 1] && s.tabN > (vorigerSchritt() ? vorigerSchritt().tabN : 0);
    noStroke();
    if (neu) {
      fill(...hell(FARBE.akzent, 0.9));
      rect(x0, y, b, zeilenH - 1, 3);
    } else if (zi % 2) {
      fill(...FARBE.papier);
      rect(x0, y, b, zeilenH - 1, 3);
    }
    fill(...FARBE.blass);
    textAlign(LEFT, CENTER);
    text(z.zeile, x0 + 4, y + zeilenH / 2);
    let xx = x0 + zeileB;
    spalten.forEach((sp, i) => {
      const w = z.zellen[sp.key];
      if (w !== undefined) {
        fill(...(neu ? FARBE.akzent : FARBE.text));
        textStyle(neu ? BOLD : NORMAL);
        text(w, xx + 4, y + zeilenH / 2);
        textStyle(NORMAL);
      }
      xx += breiten[i];
    });
    if (z.aus) {
      fill(...FARBE.gruen);
      let a = z.aus.replace(/\n/g, "⏎");
      while (textWidth(a) > ausB - 6 && a.length > 2) {
        a = a.slice(0, -2);
      }
      text(a, xx + 4, y + zeilenH / 2);
    }
    y += zeilenH;
  });
  // Trennlinien
  stroke(...FARBE.linie);
  strokeWeight(1);
  let lx = x0 + zeileB - 3;
  line(lx, y0 + 2, lx, y);
  spalten.forEach((sp, i) => {
    lx += breiten[i];
    line(lx, y0 + 2, lx, y);
  });
  noStroke();
  if (!zeilen.length) {
    absatz("Noch keine Änderungen.", x0 + 4, y0 + 30, b - 8, 12, FARBE.blass);
  }
}

// =============================================================================
// Konsole
// =============================================================================
function zeichneKonsole() {
  const p = P_KONSOLE;
  panel(p);
  const x = p.x + 12;
  const y = p.y + KOPF_H + 6;
  const w = p.w - 24;
  const h = p.h - KOPF_H - 18;
  noStroke();
  fill(26, 28, 30);
  rect(x, y, w, h, 8);
  textFont(MONO);
  textSize(13);
  textAlign(LEFT, TOP);
  fill(130, 135, 140);
  text("> ./raetsel", x + 12, y + 10);
  const s = aktSchritt();
  if (!zeigtAblauf() || !s) {
    fill(110, 116, 122);
    textSize(11.5);
    text("(Die Ausgabe erscheint hier,\n sobald das Programm läuft.)", x + 12, y + 34);
    return;
  }
  // Ausgabe umbrechen
  const maxB = w - 24;
  const zeilen = [];
  const neuAb = s.neu ? s.ausgabe.length - s.neu.length : s.ausgabe.length;
  let akt = "";
  let aktStart = 0;
  for (let i = 0; i < s.ausgabe.length; i++) {
    const c = s.ausgabe[i];
    if (c === "\n") {
      zeilen.push({ t: akt, start: aktStart });
      akt = "";
      aktStart = i + 1;
      continue;
    }
    if (textWidth(akt + c) > maxB) {
      zeilen.push({ t: akt, start: aktStart });
      akt = "";
      aktStart = i;
    }
    akt += c;
  }
  zeilen.push({ t: akt, start: aktStart });
  const lh = 18;
  const maxZ = Math.floor((h - 40) / lh);
  const sicht = zeilen.slice(Math.max(0, zeilen.length - maxZ));
  let yy = y + 32;
  sicht.forEach((z, zi) => {
    let xx = x + 12;
    for (let i = 0; i < z.t.length; i++) {
      const pos = z.start + i;
      fill(...(pos >= neuAb ? [255, 214, 90] : [225, 230, 225]));
      text(z.t[i], xx, yy);
      xx += textWidth(z.t[i]);
    }
    if (zi === sicht.length - 1 && !s.fertig && !s.fehler && frameCount % 60 < 30) {
      fill(225, 230, 225);
      rect(xx + 2, yy + 1, 8, 15);
    }
    yy += lh;
  });
  if (s.fehler) {
    fill(255, 110, 110);
    textSize(11.5);
    text(s.fehlerArt === "oob" ? "Speicherzugriffsfehler" : "Abbruch", x + 12, y + h - 22);
  } else if (s.fertig) {
    fill(130, 135, 140);
    textSize(11.5);
    text("Programm beendet.", x + 12, y + h - 22);
  }
}

// =============================================================================
// Rätselbericht (rechts oben)
// =============================================================================
function zeichneHinweise(liste, x, y, b, yMax) {
  for (const h of liste) {
    textFont(SCHRIFT);
    textSize(12.5);
    const zeilen = umbrechen(h, b - 40);
    const bh = zeilen.length * 17 + 12;
    if (y + bh > yMax) {
      break;
    }
    noStroke();
    fill(...FARBE.notiz);
    rect(x, y, b, bh, 6);
    fill(...FARBE.senf);
    rect(x, y, 4, bh, 6, 0, 0, 6);
    textFont(TITEL);
    textStyle(BOLD);
    textSize(13);
    textAlign(LEFT, TOP);
    text("!", x + 14, y + 6);
    textStyle(NORMAL);
    absatz(h, x + 28, y + 6, b - 40, 12.5, FARBE.text);
    y += bh + 6;
  }
  return y;
}

function zeichneBericht() {
  const p = P_ERKL;
  p.titel = modus === "pruefung" ? "Prüfung" : "Rätselbericht";
  panel(p);
  const x = p.x + 20;
  let y = p.y + KOPF_H + 12;
  const b = p.w - 40;
  if (modus === "pruefung") {
    zeichnePruefungsInfo(x, y, b);
    return;
  }
  const s = aktSchritt();
  if (!s) {
    return;
  }
  noStroke();
  fill(...FARBE.blass);
  textFont(SCHRIFT);
  textSize(12);
  textAlign(LEFT, TOP);
  text(`Rätsel ${beispielIdx + 1}: ${aktRaetsel().titel} · Schritt ${schrittIdx + 1} von ${sim.schritte.length}`, x, y);
  y += 22;
  // aktuelle Zeile
  if (s.zeile && sim.zeilen[s.zeile - 1] !== undefined) {
    fill(...(s.fehler ? hell(FARBE.akzent, 0.88) : hell(FARBE.senf, 0.8)));
    rect(x, y, b, 28, 6);
    fill(...FARBE.blass);
    textFont(MONO);
    textSize(11);
    textAlign(LEFT, CENTER);
    text(`Zeile ${s.zeile}`, x + 10, y + 14);
    fill(...FARBE.text);
    textSize(13);
    let z = sim.zeilen[s.zeile - 1].trim();
    while (textWidth(z) > b - 90 && z.length > 4) {
      z = z.slice(0, -2);
    }
    text(z, x + 72, y + 14);
    y += 38;
  }
  if (s.fehler) {
    fill(...FARBE.akzent);
    textFont(SCHRIFT);
    textStyle(BOLD);
    textSize(14);
    textAlign(LEFT, TOP);
    text(s.fehlerArt === "oob" ? "✗ Zugriff außerhalb des Arrays" : "✗ Fehler", x, y);
    textStyle(NORMAL);
    y += 22;
  }
  y += absatz(s.text, x, y, b, 14.5, FARBE.text, false, 6) + 10;
  const yMax = p.y + p.h - 12;
  // Vorhersage am Ende vergleichen
  if (s.fertig && !s.fehler && ui.vorhersage && ui.vorhersage.value().trim()) {
    const ok = ausgabeNormal(ui.vorhersage.value()) === ausgabeNormal(s.ausgabe);
    const farbe = ok ? FARBE.gruen : FARBE.akzent;
    fill(...hell(farbe, 0.86));
    rect(x, y, b, 30, 6);
    fill(...farbe);
    textFont(SCHRIFT);
    textStyle(BOLD);
    textSize(13);
    textAlign(LEFT, CENTER);
    text(ok ? `✓ Deine Vorhersage stimmt – du hättest das Schloss geknackt!` : `✗ Deine Vorhersage „${ausgabeNormal(ui.vorhersage.value())}“ stimmt nicht.`, x + 10, y + 15);
    textStyle(NORMAL);
    y += 38;
  }
  zeichneHinweise(s.hinweise, x, y, b, yMax);
}

function zeichnePruefungsInfo(x, y, b) {
  y += absatz(`Freigabeprüfung · ${STUFEN[stufe].rang}`, x, y, b, 18, FARBE.text, true) + 6;
  absatz(`${SERIE_ZIEL} geknackte Schlösser in Folge ergeben das Prüfsiegel. Lies das Programm links und spiele es im Kopf (oder auf Papier) durch.`, x, y, b, 13, FARBE.grau);
  y += 44;
  // Serie als Schlüssel
  for (let i = 0; i < SERIE_ZIEL; i++) {
    const kx = x + 10 + i * 64;
    const an = i < serie;
    push();
    translate(kx, y + 6);
    stroke(...(an ? FARBE.senf : FARBE.neutral));
    strokeWeight(4);
    noFill();
    circle(10, 14, 18);
    line(19, 14, 46, 14);
    line(38, 14, 38, 22);
    line(44, 14, 44, 20);
    pop();
  }
  y += 40;
  noStroke();
  fill(...FARBE.grau);
  textFont(MONO);
  textSize(12);
  textAlign(LEFT, TOP);
  text(`${serie} / ${SERIE_ZIEL} in Folge`, x, y);
  y += 24;
  if (rueckmeldung) {
    const farbe = rueckmeldung.ok ? FARBE.gruen : FARBE.akzent;
    textFont(SCHRIFT);
    textSize(13);
    const zeilenA = umbrechen(rueckmeldung.text, b - 24);
    const zeilenB = umbrechen(aufgabe.erklaerung || "", b - 24);
    const hBox = 16 + zeilenA.length * 19 + zeilenB.length * 18 + 8;
    noStroke();
    fill(...hell(farbe, 0.88));
    rect(x, y, b, hBox, 8);
    let yy = y + 8;
    yy += absatz((rueckmeldung.ok ? "✓ " : "✗ ") + rueckmeldung.text, x + 12, yy, b - 24, 14, farbe, true) + 4;
    absatz(aufgabe.erklaerung || "", x + 12, yy, b - 24, 13, FARBE.text);
    y += hBox + 8;
  }
  if (aufloesung) {
    const s = aktSchritt();
    if (s) {
      absatz(s.text, x, Math.max(y, P_ERKL.y + P_ERKL.h - 76), b, 12.5, FARBE.grau, false, 4);
    }
  }
}

// =============================================================================
// Steuerung (rechts unten)
// =============================================================================
function zeichneSteuerung() {
  const p = P_STEUER;
  p.titel = modus === "pruefung" ? "Frage" : "Steuerung";
  panel(p);
  const x = p.x + 18;
  const b = p.w - 36;
  const y = p.y + KOPF_H + 12;
  mcRechtecke = [];
  if (modus === "pruefung") {
    if (!aufgabe) {
      return;
    }
    const h = absatz(aufgabe.frage, x, y, b, 14, FARBE.text, true, 6);
    if (aufgabe.art === "mc") {
      let yy = Math.max(y + h + 10, p.y + 120);
      aufgabe.optionen.forEach((o, i) => {
        textFont(SCHRIFT);
        textSize(12.5);
        const zeilen = umbrechen(o, b - 40);
        const bh = Math.max(36, zeilen.length * 16 + 14);
        const r = { x, y: yy, w: b, h: bh };
        mcRechtecke.push(r);
        const hover = !rueckmeldung && inRechteck(mausPos(), r);
        let fuell = hover ? hell(FARBE.akzent, 0.92) : FARBE.flaeche2;
        let rahmen = hover ? FARBE.akzent : FARBE.linie;
        if (rueckmeldung) {
          if (i === aufgabe.richtig) {
            fuell = hell(FARBE.gruen, 0.82);
            rahmen = FARBE.gruen;
          } else if (i === antwortIdx) {
            fuell = hell(FARBE.akzent, 0.85);
            rahmen = FARBE.akzent;
          }
        }
        fill(...fuell);
        stroke(...rahmen);
        strokeWeight(1.5);
        rect(r.x, r.y, r.w, r.h, 8);
        noStroke();
        fill(...FARBE.grau);
        textFont(MONO);
        textStyle(BOLD);
        textSize(12);
        textAlign(LEFT, TOP);
        text("ABCD"[i], r.x + 10, r.y + 8);
        textStyle(NORMAL);
        fill(...FARBE.text);
        textFont(SCHRIFT);
        textSize(12.5);
        zeilen.forEach((zl, j) => text(zl, r.x + 30, r.y + 8 + j * 16));
        yy += bh + 6;
      });
    } else {
      absatz(aufgabe.art === "text" ? "Leerzeichen zwischen den Werten wie in der Ausgabe. Groß- und Kleinschreibung zählt. Enter = Prüfen." : "Eine Zahl eingeben. Enter = Prüfen.", x, p.y + 230, b, 12, FARBE.blass);
    }
    return;
  }
  noStroke();
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(12);
  textAlign(LEFT, BOTTOM);
  text("Rätsel", x, p.y + 58);
  absatz(STUFEN[stufe].auftrag, x, p.y + 124, b, 13, FARBE.text, false, 6);
  fill(...FARBE.grau);
  textFont(SCHRIFT);
  textSize(12);
  textAlign(LEFT, BOTTOM);
  text("Erst vorhersagen, dann durchsteppen:", x, p.y + 250);
}

function zeichneFreigaben() {
  const p = P_FREIGABE;
  panel(p);
  const x = p.x + 14;
  const y = p.y + KOPF_H + 8;
  const zh = Math.min(52, (p.h - KOPF_H - 34) / STUFEN.length);
  STUFEN.forEach((st, i) => {
    const zy = y + i * zh;
    const ok = freigaben[i];
    const r = Math.min(18, zh - 6);
    if (ok) {
      noStroke();
      fill(...FARBE.akzent);
      circle(x + 9, zy + zh / 2, r);
      fill(255);
      textFont(SCHRIFT);
      textStyle(BOLD);
      textSize(10);
      textAlign(CENTER, CENTER);
      text("✓", x + 9, zy + zh / 2 + 1);
      textStyle(NORMAL);
    } else {
      noFill();
      stroke(...FARBE.linie);
      strokeWeight(1.5);
      drawingContext.setLineDash([3, 3]);
      circle(x + 9, zy + zh / 2, r);
      drawingContext.setLineDash([]);
    }
    noStroke();
    fill(...(i === stufe ? FARBE.akzent : ok ? FARBE.text : FARBE.blass));
    textFont(SCHRIFT);
    textStyle(i === stufe ? BOLD : NORMAL);
    textSize(11.5);
    textAlign(LEFT, CENTER);
    text(`${i + 1} ${st.name}`, x + 24, zy + zh / 2 - 6);
    textStyle(NORMAL);
    fill(...(ok ? FARBE.grau : FARBE.blass));
    textSize(9.5);
    text(st.rang, x + 24, zy + zh / 2 + 7);
  });
  const anzahl = freigaben.filter((f) => f).length;
  const alle = anzahl === STUFEN.length;
  absatz(alle ? "Alle Räume geschafft: Der Tresor ist offen!" : `${anzahl} von ${STUFEN.length} Prüfsiegeln`, x, y + STUFEN.length * zh + 4, p.w - 28, 11, alle ? FARBE.akzent : FARBE.blass);
}

function zeichneStempel() {
  if (!stempel) {
    return;
  }
  const t = millis() - stempel.t0;
  if (t > 3200) {
    stempel = null;
    return;
  }
  const p = P_WELT;
  const fall = 1 - weich(t / 300);
  const alpha = t > 2600 ? map(t, 2600, 3200, 255, 0) : 255;
  push();
  translate(p.x + p.w / 2, p.y + p.h / 2 + 10);
  rotate(-0.18);
  scale(1 + fall * 1.5);
  noStroke();
  fill(...FARBE.flaeche, 255, 255, alpha * 0.85);
  circle(0, 0, 250);
  noFill();
  stroke(...FARBE.akzent, alpha);
  strokeWeight(7);
  circle(0, 0, 250);
  strokeWeight(2.5);
  circle(0, 0, 222);
  noStroke();
  fill(...FARBE.akzent, alpha);
  textFont(TITEL);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  textSize(30);
  text("FREIGEGEBEN", 0, -8);
  textSize(16);
  text(STUFEN[stempel.stufe].rang.toUpperCase(), 0, 26);
  textSize(11);
  text("Escape-Room · C++", 0, 56);
  textStyle(NORMAL);
  pop();
}

function zeichneFehlerMeldung() {
  if (!fehlerMeldung || millis() - fehlerMeldung.t0 > 8000) {
    return;
  }
  noStroke();
  fill(...FARBE.akzent, 235);
  rect(24, 846, 900, 34, 8);
  fill(255);
  textFont(SCHRIFT);
  textSize(13);
  textAlign(LEFT, CENTER);
  text("Interner Fehler (bitte neu laden): " + fehlerMeldung.text, 36, 863);
}
