// =============================================================================
//  ui.js – HTML-Bedienelemente über der Zeichenfläche
// =============================================================================
//  Alle Positionen werden im logischen 1600×900-Raster angegeben und beim
//  Ändern der Fenstergröße mitskaliert (siehe layoutUi).
// =============================================================================

const ui = {};
const uiPositionen = [];
let huelle;

function platziere(el, x, y, w, ...klassen) {
  el.addClass("ui");
  for (const k of klassen) {
    el.addClass(k);
  }
  el.parent(huelle);
  const pos = { el, x, y, w };
  uiPositionen.push(pos);
  el._pos = pos;
  return el;
}

function layoutUi() {
  huelle.style("width", width + "px");
  huelle.style("font-size", 15 * S + "px");
  for (const p of uiPositionen) {
    const y = p.y >= 56 && !p.el.hasClass("beispiel") ? p.y + LEISTE : p.y;
    p.el.position(p.x * S, y * S);
    if (p.w) {
      p.el.style("width", p.w * S + "px");
    }
  }
}

function zeige(el, sichtbar) {
  const soll = sichtbar ? "" : "none";
  if (el.elt.style.display !== soll) {
    el.elt.style.display = soll;
  }
}

function erstelleUi() {
  huelle = createDiv();
  huelle.addClass("huelle");

  // --- Kopfzeile -------------------------------------------------------------
  ui.logo = platziere(createImg("assets/logo-jps.png", "Logo der Jakob-Preh-Schule"), 14, 3, 122, "logo");
  ui.modusUeben = platziere(createButton("Rätsel lösen"), 1182, 12, 190, "kopf");
  ui.modusUeben.mousePressed(() => {
    modusWechseln("ueben");
    ui.modusUeben.elt.blur();
  });
  ui.modusPruef = platziere(createButton("Freigabeprüfung"), 1380, 12, 196, "kopf");
  ui.modusPruef.mousePressed(() => {
    modusWechseln("pruefung");
    ui.modusPruef.elt.blur();
  });

  // --- Stufen-Leiste -----------------------------------------------------------
  ui.stufen = [];
  let bx = 104;
  STUFEN.forEach((st, i) => {
    const text = `${i + 1} · ${st.name}`;
    const b = 48 + text.length * 8.4;
    const knopf = platziere(createButton(text), bx, 63, b, "beispiel");
    knopf.attribute("title", `Freigabestufe ${i + 1}: ${st.rang}`);
    knopf.mousePressed(() => {
      stufeWechseln(i);
      knopf.elt.blur();
    });
    ui.stufen.push(knopf);
    bx += b + 10;
  });

  // --- Üben ----------------------------------------------------------------------
  ui.beispiel = platziere(createSelect(), 958, 562, 364);
  ui.beispiel.changed(() => {
    beispielWechseln(parseInt(ui.beispiel.value(), 10));
    ui.beispiel.elt.blur();
  });

  ui.schritt = platziere(createButton("Schritt ▶ (→)"), 958, 788, 178, "dunkel");
  ui.schritt.mousePressed(() => {
    schrittKnopf();
    ui.schritt.elt.blur();
  });
  ui.auto = platziere(createButton("▶ Automatisch"), 1144, 788, 178, "primaer");
  ui.auto.mousePressed(() => {
    autoUmschalten();
    ui.auto.elt.blur();
  });
  ui.neu = platziere(createButton("↺ Neustart (R)"), 958, 834, 178);
  ui.neu.mousePressed(() => {
    neustart();
    ui.neu.elt.blur();
  });
  ui.tempo = platziere(createSelect(), 1144, 836, 178);
  for (const t of ["langsam", "mittel", "schnell"]) {
    ui.tempo.option("Tempo: " + t, t);
  }
  ui.tempo.selected(tempo);
  ui.tempo.changed(() => {
    tempo = ui.tempo.value();
    ui.tempo.elt.blur();
  });

  // Vorhersage vor dem Durchsteppen
  ui.vorhersage = platziere(createInput(""), 958, 734, 364, "feld");
  ui.vorhersage.attribute("placeholder", "Deine Vorhersage für das Schloss …");
  ui.vorhersage.attribute("autocomplete", "off");
  ui.vorhersage.attribute("spellcheck", "false");
  ui.vorhersage.elt.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      ui.vorhersage.elt.blur();
    }
  });

  // --- Prüfung -------------------------------------------------------------------
  ui.antwort = platziere(createInput(""), 958, 660, 200, "feld");
  ui.antwort.attribute("placeholder", "Ausgabe / Antwort");
  ui.antwort.attribute("spellcheck", "false");
  ui.antwort.attribute("autocomplete", "off");
  ui.antwort.elt.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      pruefAktion();
    }
  });
  ui.pruefen = platziere(createButton("Prüfen ✓"), 1166, 658, 156, "primaer");
  ui.pruefen.mousePressed(() => {
    pruefAktion();
    ui.pruefen.elt.blur();
  });
  ui.naechste = platziere(createButton("Nächste Frage ▶"), 958, 840, 200, "primaer");
  ui.naechste.mousePressed(() => {
    naechsteAufgabe();
    ui.naechste.elt.blur();
  });
  ui.aufloesung = platziere(createButton("▶ Ablauf zeigen"), 1166, 840, 156, "dunkel");
  ui.aufloesung.mousePressed(() => {
    zeigeAufloesung();
    ui.aufloesung.elt.blur();
  });
  ui.andere = platziere(createButton("Andere Frage"), 1226, 485, 104, "klein");
  ui.andere.attribute("title", "Neue Frage – die Serie beginnt dabei von vorn");
  ui.andere.mousePressed(() => {
    serie = 0;
    naechsteAufgabe();
    ui.andere.elt.blur();
  });

  // --- Freigaben -----------------------------------------------------------------
  ui.reset = platziere(createButton("zurücksetzen"), 1468, 485, 100, "klein");
  ui.reset.attribute("title", "Alle Prüfsiegel löschen (z. B. für die nächste Klasse)");
  ui.reset.mousePressed(() => {
    if (window.confirm("Alle Prüfsiegel löschen?")) {
      freigabenZuruecksetzen();
    }
    ui.reset.elt.blur();
  });
}

function pruefAktion() {
  if (rueckmeldung) {
    naechsteAufgabe();
    ui.antwort.elt.focus();
    return;
  }
  pruefeAntwort(ui.antwort.value());
}

function leereEingaben() {
  if (ui.antwort) {
    ui.antwort.value("");
  }
}

function leereVorhersage() {
  if (ui.vorhersage) {
    ui.vorhersage.value("");
  }
}

// Auswahlliste je nach Stufe befüllen
let befuelltFuer = -1;
function befuelleAuswahl() {
  if (befuelltFuer === stufe) {
    return;
  }
  befuelltFuer = stufe;
  ui.beispiel.elt.innerHTML = "";
  RAETSEL[STUFEN[stufe].id].forEach((r, i) => ui.beispiel.option(`Rätsel ${i + 1}: ${r.titel}`, String(i)));
}

function beschrifte(el, html) {
  if (el._html !== html) {
    el.html(html);
    el._html = html;
  }
}

function sperre(el, gesperrt) {
  if (el.elt.disabled !== gesperrt) {
    el.elt.disabled = gesperrt;
  }
}

function klasse(el, name, an) {
  if (an) {
    el.addClass(name);
  } else {
    el.removeClass(name);
  }
}

function aktualisiereUi() {
  befuelleAuswahl();
  const ueben = modus === "ueben";

  klasse(ui.modusUeben, "aktiv", ueben);
  klasse(ui.modusPruef, "aktiv", !ueben);
  ui.stufen.forEach((k, i) => {
    klasse(k, "aktiv", i === stufe);
    beschrifte(k, `${i + 1} · ${STUFEN[i].name}${freigaben[i] ? " ✓" : ""}`);
  });

  zeige(ui.beispiel, ueben);
  for (const el of [ui.schritt, ui.auto, ui.neu, ui.tempo]) {
    zeige(el, ueben);
  }
  zeige(ui.vorhersage, ueben);
  if (ueben) {
    const soll = String(beispielIdx);
    if (ui.beispiel.value() !== soll) {
      ui.beispiel.selected(soll);
    }
    beschrifte(ui.auto, laufAuto ? "■ Anhalten" : "▶ Automatisch");
    klasse(ui.auto, "primaer", !laufAuto);
    klasse(ui.auto, "dunkel", laufAuto);
    sperre(ui.schritt, laufAuto);
    const ende = sim && schrittIdx >= sim.schritte.length - 1;
    beschrifte(ui.schritt, ende ? "↺ Nochmal" : "Schritt ▶ (→)");
  }

  // Prüfung
  const zahl = !ueben && aufgabe && (aufgabe.art === "zahl" || aufgabe.art === "text");
  zeige(ui.antwort, zahl);
  zeige(ui.pruefen, zahl);
  zeige(ui.naechste, !ueben && !!rueckmeldung);
  zeige(ui.aufloesung, !ueben && !!rueckmeldung && !!(aufgabe && aufgabe.code));
  zeige(ui.andere, !ueben);
  if (!ueben) {
    sperre(ui.antwort, !!rueckmeldung);
    sperre(ui.pruefen, !!rueckmeldung);
    sperre(ui.aufloesung, laufAuto);
  }
}
