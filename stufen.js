// =============================================================================
//  stufen.js – Räume (Freigabestufen), Rätsel zum Üben, Prüfungsfragen
// =============================================================================

const SERIE_ZIEL = 5;

// Rahmen eines Programms wie im Skript
function cpp(rumpf, vorher) {
  return ["#include <iostream>", "using namespace std;", vorher || null, "int main()", "{", rumpf, "  return 0;", "}"].filter((z) => z !== null).join("\n");
}

const STUFEN = [
  {
    id: "eingang",
    name: "Eingangshalle",
    kurz: "Halle",
    rang: "Neuling",
    thema: "Variablen und Datentypen",
    untertitel: "Raum 1 · Eingangshalle: int, char und double",
    auftrag: "Das erste Schloss: Welche Werte landen in den Variablen? Achte auf die Datentypen – int rechnet ohne Komma, char ist eigentlich eine Zahl, und beim Umwandeln wird abgeschnitten.",
  },
  {
    id: "bibliothek",
    name: "Bibliothek",
    kurz: "Bibliothek",
    rang: "Spurensucher",
    thema: "Verzweigungen",
    untertitel: "Raum 2 · Bibliothek: if, else if und else",
    auftrag: "Hinter jedem Regal wartet eine Abzweigung. Prüfe jede Bedingung mit den aktuellen Werten: Welcher Zweig wird ausgeführt – und welcher nicht?",
  },
  {
    id: "uhren",
    name: "Uhrenzimmer",
    kurz: "Uhren",
    rang: "Rätsellöser",
    thema: "Schleifen",
    untertitel: "Raum 3 · Uhrenzimmer: for, while und do-while",
    auftrag: "Die Uhren ticken Runde für Runde. Führe einen Schreibtischtest: Schreibe nach jeder Runde die Werte auf – so findest du die Ausgabe sicher.",
  },
  {
    id: "schliessfach",
    name: "Schließfachraum",
    kurz: "Fächer",
    rang: "Schließfachprofi",
    thema: "Arrays",
    untertitel: "Raum 4 · Schließfachraum: Arrays und Index",
    auftrag: "Eine Reihe Schließfächer, nummeriert ab 0. Verfolge, welches Fach gerade geöffnet wird – und denk daran: Das letzte Fach hat die Nummer Länge − 1.",
  },
  {
    id: "lager",
    name: "Lagerhalle",
    kurz: "Lager",
    rang: "Lagerist",
    thema: "vector",
    untertitel: "Raum 5 · Lagerhalle: vector mit push_back, insert und erase",
    auftrag: "Das Förderband der Lagerhalle wächst und schrumpft: push_back legt hinten an, insert schiebt dazwischen, erase nimmt heraus. Verfolge Inhalt und Größe des vectors.",
  },
  {
    id: "spiegel",
    name: "Spiegelsaal",
    kurz: "Spiegel",
    rang: "Schlossknacker",
    thema: "Funktionen und Geltungsbereich",
    untertitel: "Raum 6 · Spiegelsaal: Funktionen, lokale und globale Variablen",
    auftrag: "Im Spiegelsaal heißen manche Variablen gleich – sind aber verschiedene. Schau genau, in welchem Bereich (global, main, Funktion, Block) eine Variable gilt.",
  },
  {
    id: "funk",
    name: "Funkraum",
    kurz: "Funk",
    rang: "Funker",
    thema: "Zeichenketten",
    untertitel: "Raum 7 · Funkraum: Zeichenketten als char-Array mit '\\0'",
    auftrag: "Im Funkraum kommen Nachrichten Zeichen für Zeichen an. Eine Zeichenkette ist ein char-Array – und erst das Endezeichen '\\0' sagt, wo der Text aufhört.",
  },
  {
    id: "archiv",
    name: "Archiv",
    kurz: "Archiv",
    rang: "Archivar",
    thema: "struct",
    untertitel: "Raum 8 · Archiv: eigene Datenstrukturen mit struct",
    auftrag: "Jede Karteikarte im Archiv ist eine Strukturvariable mit mehreren Komponenten. Mit dem Punkt-Operator kommst du an die einzelnen Einträge.",
  },
  {
    id: "labyrinth",
    name: "Labyrinth",
    kurz: "Labyrinth",
    rang: "Pfadfinder",
    thema: "Zeiger",
    untertitel: "Raum 9 · Labyrinth: Zeiger, Adressen und call by reference",
    auftrag: "Im Labyrinth zeigen Wegweiser auf andere Orte. Ein Zeiger speichert eine Adresse: & heißt „Adresse von“, * heißt „Inhalt der Adresse, auf die … zeigt“.",
  },
  {
    id: "kessel",
    name: "Kesselraum",
    kurz: "Kessel",
    rang: "Kesselmeister",
    thema: "Überlauf und Grenzen",
    untertitel: "Raum 10 · Kesselraum: Überlauf, Wertebereiche und Rundungsfehler",
    auftrag: "Der Druck steigt, bis der Zeiger überschlägt: Was passiert, wenn ein Wert nicht mehr in seinen Datentyp passt?",
  },
  {
    id: "tresor",
    name: "Tresorraum",
    kurz: "Tresor",
    rang: "Tresorknacker",
    thema: "Dateiarbeit",
    untertitel: "Raum 11 · Tresorraum: Dateien lesen und schreiben mit fstream",
    auftrag: "Im Tresor liegt das Root-Passwort des Laborservers – in einer Datei. Verfolge, was das Programm aus den Dateien liest und was es hineinschreibt.",
  },
];

// =============================================================================
// Rätsel zum Üben
// =============================================================================
const RAETSEL = {
  eingang: [
    {
      titel: "Ganzzahldivision",
      code: cpp(`  int a = 7;
  int b = 2;
  int c = a / b;
  double d = a / b;
  double e = a / 2.0;
  cout << c << " " << d << " " << e;`),
    },
    {
      titel: "Zeichen sind Zahlen",
      code: cpp(`  char buchstabe1 = 68;
  char buchstabe2 = 'D';
  char z = 'B';
  cout << buchstabe1 << buchstabe2 << " ";
  cout << z << " " << z + 1;`),
    },
    {
      titel: "Abgeschnitten, nicht gerundet",
      code: cpp(`  double preis = 7.9;
  int euro = preis;
  double rest = preis - euro;
  cout << euro << " " << rest;`),
    },
    {
      titel: "Fehler: Tauschen ohne Zwischenspeicher",
      code: cpp(`  int a = 3;
  int b = 8;
  // Ziel: a und b vertauschen
  a = b;
  b = a;
  cout << a << " " << b;`),
    },
    {
      titel: "Richtig tauschen mit Zwischenspeicher",
      code: cpp(`  int a = 3;
  int b = 8;
  int hilf = a;
  a = b;
  b = hilf;
  cout << a << " " << b;`),
    },
  ],
  bibliothek: [
    {
      titel: "IHK-Notenschlüssel",
      code: cpp(`  int punkte = 78;
  int note;
  if (punkte >= 92)
    note = 1;
  else if (punkte >= 81)
    note = 2;
  else if (punkte >= 67)
    note = 3;
  else if (punkte >= 50)
    note = 4;
  else if (punkte >= 30)
    note = 5;
  else
    note = 6;
  cout << note;`),
    },
    {
      titel: "Und, oder",
      code: cpp(`  int temperatur = 24;
  int feuchte = 70;
  if (temperatur > 20 && feuchte < 50)
  {
    cout << 'A';
  }
  else if (temperatur > 20 || feuchte < 50)
  {
    cout << 'B';
  }
  else
  {
    cout << 'C';
  }`),
    },
    {
      titel: "Größte von drei Zahlen",
      code: cpp(`  int a = 14;
  int b = 31;
  int c = 9;
  int max = a;
  if (b > max)
    max = b;
  if (c > max)
    max = c;
  cout << max;`),
    },
    {
      titel: "Einzelne ifs statt else if",
      code: cpp(`  int x = 12;
  if (x > 10)
    x = x - 10;
  if (x > 5)
    x = x * 2;
  else
    x = x + 1;
  cout << x;`),
    },
    {
      titel: "Fehler: = statt ==",
      code: cpp(`  int x = 0;
  if (x = 5)
  {
    cout << "Treffer ";
  }
  cout << x;`),
    },
  ],
  uhren: [
    {
      titel: "Summe von 1 bis 5",
      code: cpp(`  int summe = 0;
  for (int i = 1; i <= 5; i++)
  {
    summe = summe + i;
  }
  cout << summe;`),
    },
    {
      titel: "Countdown mit while",
      code: cpp(`  int n = 10;
  while (n > 0)
  {
    cout << n << " ";
    n = n - 3;
  }`),
    },
    {
      titel: "do-while läuft mindestens einmal",
      code: cpp(`  int x = 50;
  do
  {
    x = x * 2;
    cout << x << " ";
  } while (x < 20);`),
    },
    {
      titel: "break und continue",
      code: cpp(`  for (int i = 1; i <= 10; i++)
  {
    if (i % 3 == 0)
      continue;
    if (i > 7)
      break;
    cout << i << " ";
  }`),
    },
    {
      titel: "Verschachtelte Schleifen",
      code: cpp(`  for (int i = 1; i <= 3; i++)
  {
    for (int j = 1; j <= i; j++)
    {
      cout << j;
    }
    cout << " ";
  }`),
    },
    {
      titel: "Fehler: Summe ohne Startwert",
      code: cpp(`  int summe;
  for (int i = 1; i <= 3; i++)
  {
    summe = summe + i;
  }
  cout << summe;`),
    },
  ],
  schliessfach: [
    {
      titel: "Regal füllen",
      code: cpp(`  int regal[5];
  for (int i = 0; i < 5; i++)
  {
    regal[i] = i + 1;
  }
  cout << regal[0] << " " << regal[4];`),
    },
    {
      titel: "Maximum suchen",
      code: cpp(`  int werte[6] = {12, 40, 7, 33, 51, 18};
  int max = werte[0];
  for (int i = 1; i < 6; i++)
  {
    if (werte[i] > max)
      max = werte[i];
  }
  cout << max;`),
    },
    {
      titel: "Rückwärts ausgeben",
      code: cpp(`  char wort[4] = {'L', 'A', 'B', 'S'};
  for (int i = 3; i >= 0; i--)
  {
    cout << wort[i];
  }`),
    },
    {
      titel: "Mittelwert mit double",
      code: cpp(`  double temp[4] = {20.5, 22.0, 21.5, 23.0};
  double summe = 0;
  for (int i = 0; i < 4; i++)
  {
    summe = summe + temp[i];
  }
  cout << summe / 4;`),
    },
    {
      titel: "Fehler: i <= 5",
      code: cpp(`  int regal[5] = {1, 2, 3, 4, 5};
  int s = 0;
  for (int i = 0; i <= 5; i++)
  {
    s = s + regal[i];
  }
  cout << s;`),
    },
  ],
  spiegel: [
    {
      titel: "Lokal und global",
      code: [
        "#include <iostream>",
        "using namespace std;",
        "int var_g = 1;",
        "void machPlusFuenf();",
        "int main()",
        "{",
        "  int var_l = 2;",
        "  machPlusFuenf();",
        '  cout << var_l << " " << var_g;',
        "  return 0;",
        "}",
        "void machPlusFuenf()",
        "{",
        "  int var_l = 10;",
        "  var_g = var_g + 5;",
        '  cout << var_l << " " << var_g << " ";',
        "}",
      ].join("\n"),
    },
    {
      titel: "Nur eine Kopie",
      code: [
        "#include <iostream>",
        "using namespace std;",
        "void erhoehe(int x)",
        "{",
        "  x = x + 10;",
        '  cout << x << " ";',
        "}",
        "int main()",
        "{",
        "  int x = 5;",
        "  erhoehe(x);",
        "  cout << x;",
        "  return 0;",
        "}",
      ].join("\n"),
    },
    {
      titel: "Rückgabewert",
      code: [
        "#include <iostream>",
        "using namespace std;",
        "int verdopple(int z)",
        "{",
        "  return z * 2;",
        "}",
        "int main()",
        "{",
        "  int a = 4;",
        "  int b = verdopple(a) + 1;",
        "  int c = verdopple(b);",
        '  cout << a << " " << b << " " << c;',
        "  return 0;",
        "}",
      ].join("\n"),
    },
    {
      titel: "Variable im Block",
      code: cpp(`  int x = 1;
  {
    int x = 20;
    x = x + 1;
    cout << x << " ";
  }
  cout << x;`),
    },
    {
      titel: "Fehler: i nach der Schleife",
      code: cpp(`  int summe = 0;
  for (int i = 1; i <= 3; i++)
  {
    summe = summe + i;
  }
  cout << summe << " " << i;`),
    },
  ],
  kessel: [
    {
      titel: "char läuft über",
      code: cpp(`  char druck = 120;
  druck = druck + 10;
  cout << (int)druck;`),
    },
    {
      titel: "char als Schleifenzähler",
      code: cpp(`  int runden = 0;
  for (char c = 125; c > 0; c++)
  {
    runden++;
  }
  cout << runden;`),
    },
    {
      titel: "int an der Grenze",
      code: cpp(`  int x = 2147483647;
  x = x + 1;
  cout << x;`),
    },
    {
      titel: "0.1 + 0.2",
      code: cpp(`  double a = 0.1;
  double b = 0.2;
  if (a + b == 0.3)
    cout << "gleich";
  else
    cout << "ungleich";`),
    },
    {
      titel: "Groß und klein (ASCII)",
      code: cpp(`  char c = 'g';
  c = c - 32;
  cout << c;`),
    },
  ],
};

// =============================================================================
// Hilfen
// =============================================================================
function zufall(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function waehle(liste) {
  return liste[zufall(0, liste.length - 1)];
}
function mischen(liste) {
  const a = liste.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = zufall(0, i);
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}
function verschiedene(n, min, max) {
  const s = new Set();
  while (s.size < n) {
    s.add(zufall(min, max));
  }
  return Array.from(s);
}

// Multiple Choice: erste Option richtig
function mc(frage, optionen, erklaerung, code) {
  const gemischt = mischen(optionen.map((o, i) => ({ o, richtig: i === 0 })));
  return { art: "mc", frage, optionen: gemischt.map((x) => x.o), richtig: gemischt.findIndex((x) => x.richtig), erklaerung, code: code || null };
}

// Ausgabe-Frage: Antwort wird mit dem Interpreter berechnet
function ausgabeFrage(code, erklaerung, dateien) {
  const lauf = fuehreAus(code, { dateien });
  if (lauf.fehler || /\?/.test(lauf.ausgabe) || !ausgabeNormal(lauf.ausgabe)) {
    return null;
  }
  return { art: "text", frage: "Welchen Code zeigt das Schloss? Gib die komplette Ausgabe ein (Zeilenumbrüche als Leerzeichen).", antwort: ausgabeNormal(lauf.ausgabe), erklaerung, code, dateien: dateien || null };
}

// Frage nach dem Inhalt einer Datei nach dem Programm
function dateiFrage(code, datei, erklaerung, dateien) {
  const lauf = fuehreAus(code, { dateien });
  if (lauf.fehler || lauf.dateien[datei] === undefined) {
    return null;
  }
  return { art: "text", frage: `Was steht nach dem Programm in der Datei ${datei}? (Zeilenumbrüche als Leerzeichen)`, antwort: ausgabeNormal(lauf.dateien[datei]), erklaerung, code, dateien: dateien || null };
}

function zahlFrage(code, frage, antwortFn, erklaerung) {
  const lauf = fuehreAus(code, {});
  if (lauf.fehler) {
    return null;
  }
  const a = antwortFn(lauf);
  if (typeof a !== "number" || isNaN(a)) {
    return null;
  }
  return { art: "zahl", frage, antwort: a, erklaerung: typeof erklaerung === "function" ? erklaerung(a, lauf) : erklaerung, code };
}

function ausgabenAnzahl(lauf) {
  return lauf.schritte.filter((s) => s.art === "ausgabe").length;
}

// =============================================================================
// Prüfungsaufgaben je Raum
// =============================================================================
const PRUEF_MC = {
  eingang: [
    ["Was ergibt 7 / 2 in C++, wenn beide Zahlen int sind?", ["3", "3.5", "4", "1"], "Ganzzahldivision: Der Rest fällt weg, es wird nicht gerundet."],
    ["Was gibt cout aus bei: char c = 65; cout << c;", ["A", "65", "'A'", "c"], "65 ist der ASCII-Code von A. Ein char wird als Zeichen ausgegeben."],
    ["Welchen Wert hat z nach: int z = 3.9;", ["3", "4", "3.9", "Das Programm stürzt ab"], "Beim Umwandeln nach int werden die Nachkommastellen abgeschnitten."],
    ["Welcher Datentyp passt für einen Messwert wie 21.5 °C?", ["double", "int", "char", "bool"], "Gleitpunktzahlen speichert man in double."],
    ["Was ergibt 17 % 5?", ["2", "3", "3.4", "12"], "% liefert den Rest: 17 = 3 · 5 + 2."],
  ],
  bibliothek: [
    ["Was ist der Unterschied zwischen = und ==?", ["= weist zu, == vergleicht", "Es gibt keinen", "= vergleicht, == weist zu", "== gibt es in C++ nicht"], "if (x = 5) weist 5 zu und ist damit immer wahr – ein typischer Fehler."],
    ["Wann ist (a > 5 && b < 3) wahr?", ["wenn beide Teilbedingungen wahr sind", "wenn mindestens eine wahr ist", "wenn keine wahr ist", "immer"], "&& ist das logische UND."],
    ["Wann ist (a > 5 || b < 3) wahr?", ["wenn mindestens eine Teilbedingung wahr ist", "nur wenn beide wahr sind", "nie", "nur wenn beide falsch sind"], "|| ist das logische ODER."],
    ["In einer else-if-Kette sind zwei Bedingungen wahr. Was passiert?", ["Nur der erste passende Zweig wird ausgeführt", "Beide Zweige werden ausgeführt", "Keiner wird ausgeführt", "Der letzte passende Zweig wird ausgeführt"], "Nach dem ersten zutreffenden Zweig wird der Rest der Kette übersprungen."],
  ],
  uhren: [
    ["Wie oft läuft eine do-while-Schleife mindestens?", ["einmal", "keinmal", "zweimal", "unendlich oft"], "Die Bedingung wird erst am Ende der Runde geprüft."],
    ["Was bewirkt break in einer Schleife?", ["Die Schleife wird sofort verlassen", "Nur die aktuelle Runde wird übersprungen", "Das Programm wird beendet", "Die Schleife beginnt von vorn"], "continue überspringt nur den Rest der Runde."],
    ["Was bewirkt continue in einer Schleife?", ["Der Rest der aktuellen Runde wird übersprungen", "Die Schleife wird verlassen", "Das Programm hält an", "Die Variable wird auf 0 gesetzt"], "Danach wird (bei for nach dem i++) wieder die Bedingung geprüft."],
    ["Warum schreibt man summe = 0 vor die Schleife?", ["Ohne Startwert steht ein zufälliger Wert in summe", "Damit die Schleife schneller ist", "Weil summe sonst global ist", "Das ist nicht nötig"], "Lokale Variablen haben ohne Startwert einen unbestimmten Inhalt."],
  ],
  schliessfach: [
    ["Welchen Index hat das letzte Element von int a[6]?", ["5", "6", "0", "7"], "Die Zählung beginnt bei 0 und endet bei Länge − 1."],
    ["Was passiert bei Zugriff auf a[6], wenn a nur 6 Elemente hat?", ["Zugriff außerhalb des Arrays – undefiniertes Verhalten", "Es wird automatisch 0 geliefert", "Es wird das letzte Element geliefert", "Das Array wird größer"], "C++ prüft die Grenzen nicht. Der Fehler fällt oft erst spät oder gar nicht auf."],
    ["Mit welcher Schleife durchläuft man int a[5] vollständig?", ["for (int i = 0; i < 5; i++)", "for (int i = 1; i <= 5; i++)", "for (int i = 0; i <= 5; i++)", "for (int i = 1; i < 5; i++)"], "Index 0 bis 4 – also i < 5."],
    ["int a[5] = {4, 2}; Welchen Wert hat a[3]?", ["0", "2", "zufällig", "4"], "Fehlende Startwerte in der Liste werden mit 0 gefüllt."],
  ],
  spiegel: [
    ["Wo ist eine lokale Variable gültig?", ["nur in dem Block bzw. der Funktion, in der sie deklariert wurde", "im ganzen Programm", "nur in main", "in allen Funktionen mit gleichem Namen"], "Am Ende des Blocks wird sie gelöscht."],
    ["Eine Funktion ändert ihren int-Parameter x. Ändert sich dadurch die Variable beim Aufrufer?", ["Nein, die Funktion arbeitet mit einer Kopie", "Ja, immer", "Nur wenn beide x heißen", "Nur bei globalen Funktionen"], "Bei Wertparametern wird der Wert kopiert."],
    ["Zwei Funktionen haben je eine lokale Variable zahl. Wie viele Variablen gibt es?", ["zwei verschiedene", "eine gemeinsame", "keine – das ist ein Fehler", "eine globale"], "Gleicher Name, aber verschiedene Gültigkeitsbereiche."],
    ["Was gibt return in einer Funktion?", ["den Rückgabewert an den Aufrufer", "eine Ausgabe auf dem Bildschirm", "eine neue globale Variable", "den Wert aller Parameter"], "return beendet die Funktion und liefert den Wert zurück."],
  ],
  kessel: [
    ["Welchen Wertebereich hat ein char (mit Vorzeichen)?", ["−128 bis 127", "0 bis 255", "−255 bis 255", "−32768 bis 32767"], "1 Byte im Zweierkomplement."],
    ["char c = 127; c = c + 1; Welchen Wert hat c?", ["−128", "128", "0", "127"], "Überlauf: Nach dem größten Wert geht es beim kleinsten weiter."],
    ["Warum ist 0.1 + 0.2 == 0.3 in C++ falsch?", ["0.1 und 0.2 lassen sich im Binärsystem nicht exakt speichern", "double rechnet immer ganzzahlig", "== funktioniert nicht mit Zahlen", "0.3 ist zu groß für double"], "Kleine Rundungsfehler – double-Werte nie mit == vergleichen."],
    ["Was passiert bei int x = 2147483647; x = x + 1;?", ["Überlauf: x wird −2147483648", "x wird 2147483648", "x bleibt 2147483647", "x wird 0"], "Der größte int-Wert ist 2147483647."],
  ],
};

const GENERATOREN = {
  eingang: [
    () => {
      const b = zufall(2, 5);
      let a = zufall(7, 29);
      while (a % b === 0) {
        a++;
      }
      return ausgabeFrage(
        cpp(`  int a = ${a};
  int b = ${b};
  int c = a / b;
  double d = a / b;
  double e = a / 2.0;
  cout << c << " " << d << " " << e;`),
        `a / b ist eine Ganzzahldivision (${a} / ${b} = ${Math.trunc(a / b)}) – auch wenn das Ergebnis in einen double geschrieben wird. Erst mit 2.0 rechnet C++ mit Komma.`
      );
    },
    () => {
      const x = zufall(3, 12);
      const m = zufall(2, 5);
      const c = zufall(1, 9);
      const d = zufall(3, 7);
      return ausgabeFrage(
        cpp(`  int x = ${x};
  x = x * ${m} + ${c};
  x = x % ${d};
  cout << x;`),
        `${x} · ${m} + ${c} = ${x * m + c}, Rest bei Division durch ${d}: ${(x * m + c) % d}.`
      );
    },
    () => {
      const z = String.fromCharCode(zufall(66, 88));
      return ausgabeFrage(
        cpp(`  char z = '${z}';
  cout << z << " " << z + 1;`),
        `z ist ein char und wird als Zeichen ausgegeben. z + 1 ist aber ein int (ASCII-Code ${z.charCodeAt(0)} + 1) und erscheint als Zahl. ASCII: 'A' = 65.`
      );
    },
    () => {
      const n = zufall(65, 90);
      const k = zufall(1, 3);
      return ausgabeFrage(
        cpp(`  char c = ${n};
  c = c + ${k};
  cout << c;`),
        `${n} + ${k} = ${n + k} ist der ASCII-Code von ${String.fromCharCode(n + k)}. Hilfe: 'A' = 65.`
      );
    },
    () => {
      const ganz = zufall(2, 19);
      const komma = waehle([0.25, 0.5, 0.75, 0.9]);
      const p = ganz + komma;
      return ausgabeFrage(
        cpp(`  double preis = ${p};
  int euro = preis;
  cout << euro << " " << preis * 2;`),
        `Beim Umwandeln nach int wird abgeschnitten: ${p} → ${ganz}. preis selbst bleibt ${p}.`
      );
    },
    () => {
      const [a, b] = verschiedene(2, 2, 30);
      return ausgabeFrage(
        cpp(`  int a = ${a};
  int b = ${b};
  a = b;
  b = a;
  cout << a << " " << b;`),
        `Nach a = b ist der alte Wert von a verloren. b = a schreibt dann ${b} zurück. Zum Tauschen braucht man eine Hilfsvariable.`
      );
    },
  ],
  bibliothek: [
    () => {
      const p = zufall(20, 100);
      const note = p >= 92 ? 1 : p >= 81 ? 2 : p >= 67 ? 3 : p >= 50 ? 4 : p >= 30 ? 5 : 6;
      return ausgabeFrage(
        cpp(`  int punkte = ${p};
  if (punkte >= 92)
    cout << 1;
  else if (punkte >= 81)
    cout << 2;
  else if (punkte >= 67)
    cout << 3;
  else if (punkte >= 50)
    cout << 4;
  else if (punkte >= 30)
    cout << 5;
  else
    cout << 6;`),
        `Die Kette wird von oben geprüft, der erste zutreffende Zweig gewinnt: ${p} Punkte → Note ${note}.`
      );
    },
    () => {
      const t = zufall(10, 30);
      const f = zufall(30, 80);
      return ausgabeFrage(
        cpp(`  int t = ${t};
  int f = ${f};
  if (t > 20 && f < 50)
    cout << 'A';
  else if (t > 20 || f < 50)
    cout << 'B';
  else
    cout << 'C';`),
        `t > 20 ist ${t > 20 ? "wahr" : "falsch"}, f < 50 ist ${f < 50 ? "wahr" : "falsch"}. && braucht beides, || mindestens eins.`
      );
    },
    () => {
      const [a, b, c] = verschiedene(3, 1, 60);
      return ausgabeFrage(
        cpp(`  int a = ${a};
  int b = ${b};
  int c = ${c};
  int m = a;
  if (b > m)
    m = b;
  if (c > m)
    m = c;
  cout << m;`),
        `m merkt sich den bisher größten Wert: am Ende ${Math.max(a, b, c)}.`
      );
    },
    () => {
      const x = zufall(3, 20);
      return ausgabeFrage(
        cpp(`  int x = ${x};
  if (x > 10)
    x = x - 10;
  if (x > 5)
    x = x * 2;
  else
    x = x + 1;
  cout << x;`),
        "Das sind zwei getrennte if-Anweisungen: Die zweite wird immer geprüft – mit dem schon veränderten x."
      );
    },
    () => {
      const x = zufall(1, 30);
      const g = zufall(2, 3);
      return ausgabeFrage(
        cpp(`  int x = ${x};
  if (x % ${g} == 0)
  {
    if (x > 15)
      cout << 1;
    else
      cout << 2;
  }
  else
  {
    cout << 3;
  }`),
        `${x} % ${g} = ${x % g}. Das innere if wird nur erreicht, wenn x durch ${g} teilbar ist.`
      );
    },
  ],
  uhren: [
    () => {
      const a = zufall(1, 4);
      const b = a + zufall(2, 5);
      return ausgabeFrage(
        cpp(`  int summe = 0;
  for (int i = ${a}; i <= ${b}; i++)
  {
    summe = summe + i;
  }
  cout << summe;`),
        `Summe der Zahlen von ${a} bis ${b}.`
      );
    },
    () => {
      const s = zufall(0, 4);
      const k = zufall(2, 4);
      const e = s + k * zufall(2, 4) + zufall(0, k - 1);
      return ausgabeFrage(
        cpp(`  for (int i = ${s}; i < ${e}; i = i + ${k})
  {
    cout << i << " ";
  }`),
        `i startet bei ${s} und wächst um ${k}, solange i < ${e} ist.`
      );
    },
    () => {
      const n = zufall(8, 20);
      const k = zufall(2, 5);
      return zahlFrage(
        cpp(`  int n = ${n};
  while (n > 0)
  {
    cout << n << " ";
    n = n - ${k};
  }`),
        "Wie oft wird die Zeile mit cout ausgeführt?",
        ausgabenAnzahl,
        (a) => `n = ${n}, dann jeweils − ${k}, solange n > 0 ist: ${a} Ausgaben.`
      );
    },
    () => {
      const x = zufall(2, 30);
      const g = zufall(5, 40);
      return ausgabeFrage(
        cpp(`  int x = ${x};
  do
  {
    x = x * 2;
    cout << x << " ";
  } while (x < ${g});`),
        "Eine do-while-Schleife prüft die Bedingung erst am Ende – die erste Runde läuft immer."
      );
    },
    () => {
      const a = zufall(2, 4);
      const b = zufall(2, 5);
      return ausgabeFrage(
        cpp(`  int z = 0;
  for (int i = 0; i < ${a}; i++)
  {
    for (int j = 0; j < ${b}; j++)
    {
      z++;
    }
  }
  cout << z;`),
        `Die innere Schleife läuft in jeder der ${a} äußeren Runden ${b}-mal: ${a} · ${b} = ${a * b}.`
      );
    },
    () => {
      const k = zufall(2, 4);
      const m = zufall(4, 8);
      return ausgabeFrage(
        cpp(`  for (int i = 1; i <= 10; i++)
  {
    if (i % ${k} == 0)
      continue;
    if (i > ${m})
      break;
    cout << i << " ";
  }`),
        `continue überspringt Vielfache von ${k}, break beendet die Schleife, sobald ein ausgegebenes i größer als ${m} wäre.`
      );
    },
  ],
  schliessfach: [
    () => {
      const k = zufall(2, 5);
      const c = zufall(0, 6);
      const j = zufall(0, 4);
      return ausgabeFrage(
        cpp(`  int regal[5];
  for (int i = 0; i < 5; i++)
  {
    regal[i] = i * ${k} + ${c};
  }
  cout << regal[${j}];`),
        `regal[${j}] = ${j} · ${k} + ${c} = ${j * k + c}. Der Index beginnt bei 0.`
      );
    },
    () => {
      const w = verschiedene(5, 1, 20);
      return ausgabeFrage(
        cpp(`  int werte[5] = {${w.join(", ")}};
  int s = 0;
  for (int i = 0; i < 5; i++)
  {
    s = s + werte[i];
  }
  cout << s;`),
        `Summe aller fünf Werte: ${w.join(" + ")} = ${w.reduce((x, y) => x + y, 0)}.`
      );
    },
    () => {
      const w = verschiedene(6, 1, 60);
      return ausgabeFrage(
        cpp(`  int werte[6] = {${w.join(", ")}};
  int max = werte[0];
  for (int i = 1; i < 6; i++)
  {
    if (werte[i] > max)
      max = werte[i];
  }
  cout << max;`),
        `max merkt sich das bisher größte Element: ${Math.max(...w)}.`
      );
    },
    () => {
      const w = verschiedene(4, 1, 9);
      return ausgabeFrage(
        cpp(`  int a[4] = {${w.join(", ")}};
  for (int i = 3; i >= 0; i--)
  {
    cout << a[i] << " ";
  }`),
        "Die Schleife läuft von Index 3 rückwärts bis 0."
      );
    },
    () => {
      const w = verschiedene(5, 1, 9);
      return ausgabeFrage(
        cpp(`  int a[5] = {${w.join(", ")}};
  for (int i = 1; i < 5; i++)
  {
    a[i] = a[i - 1] + a[i];
  }
  cout << a[4];`),
        "Jedes Fach bekommt die Summe aller Fächer bis dahin (laufende Summe). a[i − 1] ist dabei schon der neue Wert."
      );
    },
    () => {
      const w = [zufall(36, 50) / 2, zufall(36, 50) / 2, zufall(36, 50) / 2, zufall(36, 50) / 2];
      return ausgabeFrage(
        cpp(`  double t[4] = {${w.map((x) => (Number.isInteger(x) ? x.toFixed(1) : String(x))).join(", ")}};
  double summe = 0;
  for (int i = 0; i < 4; i++)
  {
    summe = summe + t[i];
  }
  cout << summe / 4;`),
        "summe ist ein double, deshalb rechnet summe / 4 mit Nachkommastellen."
      );
    },
  ],
  spiegel: [
    () => {
      const g = zufall(1, 9);
      const l1 = zufall(2, 9);
      const l2 = zufall(10, 30);
      const k = zufall(2, 9);
      return ausgabeFrage(
        ["#include <iostream>", "using namespace std;", `int g = ${g};`, "void f()", "{", `  int l = ${l2};`, `  g = g + ${k};`, '  cout << l << " " << g << " ";', "}", "int main()", "{", `  int l = ${l1};`, "  f();", '  cout << l << " " << g;', "  return 0;", "}"].join("\n"),
        `Die beiden l sind verschiedene lokale Variablen. g ist global – die Änderung in f() gilt auch in main.`
      );
    },
    () => {
      const x = zufall(1, 20);
      const k = zufall(2, 15);
      return ausgabeFrage(
        ["#include <iostream>", "using namespace std;", "void erhoehe(int x)", "{", `  x = x + ${k};`, '  cout << x << " ";', "}", "int main()", "{", `  int x = ${x};`, "  erhoehe(x);", "  cout << x;", "  return 0;", "}"].join("\n"),
        `erhoehe bekommt eine Kopie von x. Die Kopie wird ${x + k}, das x in main bleibt ${x}.`
      );
    },
    () => {
      const a = zufall(2, 9);
      const m = zufall(2, 4);
      const c = zufall(1, 5);
      return ausgabeFrage(
        ["#include <iostream>", "using namespace std;", "int mal(int z)", "{", `  return z * ${m};`, "}", "int main()", "{", `  int a = ${a};`, `  int b = mal(a) + ${c};`, '  cout << a << " " << b;', "  return 0;", "}"].join("\n"),
        `mal(${a}) liefert ${a * m}, plus ${c} ergibt ${a * m + c}. a bleibt unverändert.`
      );
    },
    () => {
      const x = zufall(1, 9);
      const y = zufall(10, 40);
      return ausgabeFrage(
        cpp(`  int x = ${x};
  {
    int x = ${y};
    x = x + 1;
    cout << x << " ";
  }
  cout << x;`),
        `Im Block verdeckt das innere x das äußere. Nach der } gilt wieder das äußere x = ${x}.`
      );
    },
    () => {
      const n = zufall(3, 7);
      return ausgabeFrage(
        ["#include <iostream>", "using namespace std;", "int summe(int n)", "{", "  int s = 0;", "  for (int i = 1; i <= n; i++)", "  {", "    s = s + i;", "  }", "  return s;", "}", "int main()", "{", `  int s = ${n};`, "  cout << summe(s) << \" \" << s;", "  return 0;", "}"].join("\n"),
        `summe(${n}) rechnet 1 + … + ${n} = ${(n * (n + 1)) / 2} in ihrem eigenen s. Das s in main bleibt ${n}.`
      );
    },
    () => {
      const k = zufall(2, 4);
      const l = zufall(5, 20);
      return ausgabeFrage(
        ["#include <iostream>", "using namespace std;", "int zaehler = 0;", "void zaehle()", "{", "  zaehler++;", "}", "int main()", "{", ...Array.from({ length: k }, () => "  zaehle();"), `  int zaehler = ${l};`, "  zaehle();", '  cout << zaehler;', "  return 0;", "}"].join("\n"),
        `zaehle() erhöht immer die globale Variable. Ab int zaehler = ${l} meint zaehler in main aber die lokale Variable – sie bleibt ${l}.`
      );
    },
  ],
  kessel: [
    () => {
      const s = zufall(100, 127);
      const k = zufall(5, 40);
      return ausgabeFrage(
        cpp(`  char druck = ${s};
  druck = druck + ${k};
  cout << (int)druck;`),
        `${s} + ${k} = ${s + k}${s + k > 127 ? ` passt nicht in char: ${s + k} − 256 = ${s + k - 256}` : " passt noch in char"}.`
      );
    },
    () => {
      const s = zufall(118, 126);
      return ausgabeFrage(
        cpp(`  int runden = 0;
  for (char c = ${s}; c > 0; c++)
  {
    runden++;
  }
  cout << runden;`),
        `c läuft von ${s} bis 127, dann springt es auf −128 und die Bedingung c > 0 ist falsch: ${128 - s} Runden.`
      );
    },
    () => {
      const s = zufall(-128, -110);
      const k = zufall(3, 30);
      return ausgabeFrage(
        cpp(`  char c = ${s};
  c = c - ${k};
  cout << (int)c;`),
        `${s} − ${k} = ${s - k}${s - k < -128 ? ` ist kleiner als −128: ${s - k} + 256 = ${s - k + 256}` : " passt noch in char"}.`
      );
    },
    () => {
      const k = zufall(1, 3);
      return ausgabeFrage(
        cpp(`  int x = 2147483647;
  x = x + ${k};
  cout << x;`),
        `2147483647 ist der größte int-Wert. Danach geht es bei −2147483648 weiter.`
      );
    },
    () => {
      const paare = [
        ["0.1", "0.2", "0.3"],
        ["0.5", "0.25", "0.75"],
        ["0.1", "0.7", "0.8"],
        ["1.5", "2.5", "4.0"],
        ["0.2", "0.4", "0.6"],
        ["0.125", "0.375", "0.5"],
      ];
      const [a, b, c] = waehle(paare);
      return ausgabeFrage(
        cpp(`  double a = ${a};
  double b = ${b};
  if (a + b == ${c})
    cout << 1;
  else
    cout << 0;`),
        "Halbe, Viertel, Achtel … lassen sich im Binärsystem exakt speichern, Zehntel wie 0.1 nicht – dann entsteht ein winziger Rundungsfehler."
      );
    },
    () => {
      const klein = String.fromCharCode(zufall(97, 122));
      return ausgabeFrage(
        cpp(`  char c = '${klein}';
  c = c - 32;
  cout << c;`),
        `In der ASCII-Tabelle liegen Klein- und Großbuchstaben genau 32 auseinander ('a' = 97, 'A' = 65).`
      );
    },
  ],
};

// =============================================================================
// Neue Räume: Lagerhalle (vector), Funkraum (Zeichenketten), Archiv (struct),
// Labyrinth (Zeiger), Tresorraum (Dateiarbeit)
// =============================================================================

// Programm mit eigenen #include-Zeilen und beliebigem Inhalt
function prog(includes, zeilen) {
  return [...includes.map((i) => `#include <${i}>`), "using namespace std;", ...zeilen].join("\n");
}
function mainProg(includes, rumpf, vorher) {
  return prog(includes, [...(vorher || []), "int main()", "{", rumpf, "  return 0;", "}"]);
}

const WOERTER = ["LABOR", "SERVER", "KABEL", "ROUTER", "SWITCH", "DOCKER", "LINUX", "BINAER", "PORT", "SOCKET", "PAKET", "TRESOR"];

Object.assign(RAETSEL, {
  lager: [
    {
      titel: "Beispiel aus dem Skript",
      code: mainProg(
        ["iostream", "vector"],
        `  vector<int> v = {1, 2, 3, 45, 65};
  v[2] = 10;
  for (unsigned int i = 0; i < v.size(); i++)
  {
    cout << v[i] << " ";
  }
  v.push_back(1);
  v.pop_back();
  v.insert(v.begin() + 3, 10);
  v.erase(v.begin() + 2);
  v.erase(v.begin(), v.begin() + 2);
  cout << v.size();`
      ),
    },
    {
      titel: "push_back füllt das Lager",
      code: mainProg(
        ["iostream", "vector"],
        `  vector<int> lager;
  for (int i = 1; i <= 4; i++)
  {
    lager.push_back(i * 10);
  }
  cout << lager.size() << " " << lager[3];`
      ),
    },
    {
      titel: "insert und erase",
      code: mainProg(
        ["iostream", "vector"],
        `  vector<char> regal = {'A', 'C', 'D'};
  regal.insert(regal.begin() + 1, 'B');
  regal.erase(regal.begin() + 3);
  for (char c : regal)
  {
    cout << c;
  }`
      ),
    },
    {
      titel: "vector mit Startwerten",
      code: mainProg(
        ["iostream", "vector"],
        `  vector<double> preise(3, 2.5);
  preise[1] = 4.0;
  double summe = 0;
  for (double p : preise)
  {
    summe = summe + p;
  }
  cout << summe;`
      ),
    },
    {
      titel: "Fehler: Index statt push_back",
      code: mainProg(
        ["iostream", "vector"],
        `  vector<int> v;
  v[0] = 5;
  cout << v[0];`
      ),
    },
    {
      titel: "Fehler: size() − 1 bei leerem vector",
      code: mainProg(
        ["iostream", "vector"],
        `  vector<int> v;
  for (unsigned int i = 0; i < v.size() - 1; i++)
  {
    cout << v[i];
  }`
      ),
    },
  ],
  funk: [
    {
      titel: "Karl-Heinz (Skript)",
      code: mainProg(
        ["iostream", "cstring"],
        `  char vorname[20] = "Karl-Heinz";
  cout << vorname[2] << " ";
  cout << vorname << " ";
  cout << strlen(vorname);`
      ),
    },
    {
      titel: "Zeichen für Zeichen",
      code: mainProg(
        ["iostream"],
        `  char wort[6];
  wort[0] = 'F';
  wort[1] = 'u';
  wort[2] = 'n';
  wort[3] = 'k';
  wort[4] = '\\0';
  wort[0] = 'P';
  cout << wort;`
      ),
    },
    {
      titel: "Zeichen zählen bis '\\0'",
      code: mainProg(
        ["iostream"],
        `  char text[] = "Morsecode";
  int n = 0;
  for (int i = 0; text[i] != '\\0'; i++)
  {
    if (text[i] == 'e')
      n++;
  }
  cout << n;`
      ),
    },
    {
      titel: "strcpy",
      code: mainProg(
        ["iostream", "cstring"],
        `  char ziel[10];
  strcpy(ziel, "Funk");
  ziel[0] = 'P';
  cout << ziel << " " << strlen(ziel);`
      ),
    },
    {
      titel: "string statt char-Array",
      code: mainProg(
        ["iostream", "string"],
        `  string s = "Fun";
  s.push_back('k');
  s += "raum";
  cout << s << " " << s.size();`
      ),
    },
    {
      titel: "Fehler: '\\0' vergessen",
      code: mainProg(
        ["iostream"],
        `  char kurz[3];
  kurz[0] = 'O';
  kurz[1] = 'K';
  kurz[2] = '!';
  cout << kurz;`
      ),
    },
    {
      titel: "Fehler: = statt strcpy",
      code: mainProg(
        ["iostream"],
        `  char vorname[20];
  vorname = "Karl";
  cout << vorname;`
      ),
    },
    {
      titel: "Fehler: strcpy zu lang",
      code: mainProg(
        ["iostream", "cstring"],
        `  char name[5];
  strcpy(name, "Funkraum");
  cout << name;`
      ),
    },
  ],
  archiv: [
    {
      titel: "Adresse (Skript)",
      code: prog(
        ["iostream", "cstring"],
        [
          "struct adresse",
          "{",
          "  char strasse[20];",
          "  int hausnummer;",
          "  int postleitzahl;",
          "};",
          "int main()",
          "{",
          "  struct adresse a1;",
          "  a1.hausnummer = 10;",
          '  strcpy(a1.strasse, "Hauptstr");',
          '  struct adresse a2 = {"Poststrasse", 30, 97616};',
          '  cout << a1.strasse << " " << a1.hausnummer << " ";',
          "  cout << a2.postleitzahl;",
          "  return 0;",
          "}",
        ]
      ),
    },
    {
      titel: "Verschachtelt: schueler",
      code: prog(
        ["iostream"],
        [
          "struct adresse",
          "{",
          "  char strasse[20];",
          "  int hausnummer;",
          "};",
          "struct schueler",
          "{",
          "  char vorname[20];",
          "  struct adresse wohnort;",
          "};",
          "int main()",
          "{",
          '  schueler s = {"Ida", {"Ring", 5}};',
          "  s.wohnort.hausnummer++;",
          '  cout << s.vorname << " " << s.wohnort.strasse;',
          '  cout << " " << s.wohnort.hausnummer;',
          "  return 0;",
          "}",
        ]
      ),
    },
    {
      titel: "Eine Kopie der Karteikarte",
      code: prog(
        ["iostream"],
        ["struct punkt", "{", "  int x;", "  int y;", "};", "int main()", "{", "  punkt a = {1, 2};", "  punkt b = a;", "  b.x = 5;", '  cout << a.x << " " << b.x << " " << b.y;', "  return 0;", "}"]
      ),
    },
    {
      titel: "Längster Film (Array von structs)",
      code: prog(
        ["iostream"],
        [
          "struct film",
          "{",
          "  char titel[12];",
          "  int laufzeit;",
          "};",
          "int main()",
          "{",
          '  film liste[3] = {{"Matrix", 136}, {"Up", 96}, {"Avatar", 162}};',
          "  int best = 0;",
          "  for (int i = 1; i < 3; i++)",
          "  {",
          "    if (liste[i].laufzeit > liste[best].laufzeit)",
          "      best = i;",
          "  }",
          "  cout << liste[best].titel;",
          "  return 0;",
          "}",
        ]
      ),
    },
    {
      titel: "Struktur an eine Funktion",
      code: prog(
        ["iostream"],
        ["struct punkt", "{", "  int x;", "  int y;", "};", "void verschiebe(punkt p)", "{", "  p.x = p.x + 10;", '  cout << p.x << " ";', "}", "int main()", "{", "  punkt a = {3, 4};", "  verschiebe(a);", "  cout << a.x;", "  return 0;", "}"]
      ),
    },
  ],
  labyrinth: [
    {
      titel: "Adresse und Inhalt",
      code: mainProg(
        ["iostream"],
        `  int zahl = 7;
  int *izeiger;
  izeiger = &zahl;
  *izeiger = 12;
  cout << zahl << " " << *izeiger;`
      ),
    },
    {
      titel: "Zwei Wegweiser, ein Ziel",
      code: mainProg(
        ["iostream"],
        `  int a = 3;
  int *p = &a;
  int *q = p;
  *q = *q + 4;
  cout << a << " " << *p;`
      ),
    },
    {
      titel: "Adresse ausgeben",
      adresse: true,
      code: mainProg(
        ["iostream"],
        `  int zahl = 5;
  int *p = &zahl;
  cout << p << " " << *p;`
      ),
    },
    {
      titel: "call by reference (Skript)",
      code: prog(
        ["iostream"],
        ["void inkrement(int *zeigerAufx)", "{", "  *zeigerAufx = *zeigerAufx + 1;", "}", "void inkrement2(int &z)", "{", "  z = z + 1;", "}", "int main()", "{", "  int x = 5;", "  inkrement(&x);", "  inkrement2(x);", "  cout << x;", "  return 0;", "}"]
      ),
    },
    {
      titel: "Tauschen mit Zeigern",
      code: prog(
        ["iostream"],
        ["void tausche(int *a, int *b)", "{", "  int hilf = *a;", "  *a = *b;", "  *b = hilf;", "}", "int main()", "{", "  int x = 10;", "  int y = 11;", "  tausche(&x, &y);", '  cout << x << " " << y;', "  return 0;", "}"]
      ),
    },
    {
      titel: "Zeiger auf struct: ->",
      code: prog(
        ["iostream"],
        ["struct bruch", "{", "  int zaehler;", "  int nenner;", "};", "int main()", "{", "  bruch b2;", "  bruch *pb2;", "  pb2 = &b2;", "  (*pb2).zaehler = 10;", "  pb2->nenner = 20;", '  cout << pb2->zaehler << " / " << (*pb2).nenner;', "  return 0;", "}"]
      ),
    },
    {
      titel: "Zeiger durch ein Array",
      code: mainProg(
        ["iostream"],
        `  int arr[4] = {5, 6, 7, 8};
  int *p = arr;
  p++;
  cout << *p << " " << p[1] << " " << *(p + 2);`
      ),
    },
    {
      titel: "Fehler: Zeiger ohne Ziel",
      code: mainProg(
        ["iostream"],
        `  int *p;
  *p = 5;
  cout << *p;`
      ),
    },
    {
      titel: "Fehler: Nullzeiger",
      code: mainProg(
        ["iostream"],
        `  int zahl = 3;
  int *p = NULL;
  cout << zahl << " ";
  cout << *p;`
      ),
    },
  ],
  tresor: [
    {
      titel: "Datei kopieren (Skript)",
      dateien: { "input.txt": "Root\nPasswort" },
      code: mainProg(
        ["iostream", "fstream"],
        `  string ausgelesen;
  fstream dateistrom("input.txt", ios::in);
  ofstream ausgabe("output.txt", ios::out | ios::trunc);
  char c;
  while (dateistrom.get(c))
  {
    ausgelesen.push_back(c);
  }
  ausgabe << ausgelesen;
  cout << ausgelesen;
  dateistrom.close();
  ausgabe.close();`
      ),
    },
    {
      titel: "Zahlen aus einer Datei summieren",
      dateien: { "werte.txt": "4 8 15\n16 23" },
      code: mainProg(
        ["iostream", "fstream"],
        `  ifstream ein("werte.txt");
  int zahl;
  int summe = 0;
  while (ein >> zahl)
  {
    summe = summe + zahl;
  }
  ein.close();
  cout << summe;`
      ),
    },
    {
      titel: "Das Passwort in Zeile 3",
      dateien: { "tresor.txt": "Laborserver\nroot\nKabelsalat42\nEnde" },
      code: mainProg(
        ["iostream", "fstream", "string"],
        `  ifstream tresor("tresor.txt");
  string zeile;
  int nr = 0;
  while (getline(tresor, zeile))
  {
    nr++;
    if (nr == 3)
      cout << zeile;
  }
  tresor.close();`
      ),
    },
    {
      titel: "Anhängen mit ios::app",
      dateien: { "log.txt": "Start;" },
      code: mainProg(
        ["iostream", "fstream"],
        `  fstream fs;
  fs.open("log.txt", fstream::in | fstream::out | fstream::app);
  for (int i = 1; i <= 3; i++)
  {
    fs << "Tür" << i << ";";
  }
  fs.close();
  cout << "fertig";`
      ),
    },
    {
      titel: "Tippfehler im Dateinamen",
      dateien: { "passwort.txt": "geheim" },
      code: mainProg(
        ["iostream", "fstream", "string"],
        `  ifstream ein("pasword.txt");
  string wort;
  if (!ein.is_open())
  {
    cout << "Datei fehlt";
  }
  else
  {
    ein >> wort;
    cout << wort;
  }`
      ),
    },
    {
      titel: "Achtung: ofstream löscht den Inhalt",
      dateien: { "notiz.txt": "Wichtige alte Notiz" },
      code: mainProg(
        ["iostream", "fstream"],
        `  ofstream aus("notiz.txt");
  aus << "neu";
  aus.close();
  cout << "gespeichert";`
      ),
    },
  ],
});

Object.assign(PRUEF_MC, {
  lager: [
    ["Was macht v.push_back(7)?", ["Hängt 7 hinten an den vector an", "Setzt das erste Element auf 7", "Löscht das Element 7", "Fügt 7 vorne ein"], "push_back = hinten anhängen, der vector wird um 1 größer."],
    ["v = {4, 5, 6}; Was ist v.size() nach v.pop_back()?", ["2", "3", "1", "6"], "pop_back entfernt das letzte Element."],
    ["Was ist ein Vorteil von vector gegenüber einem Array?", ["Er kann nachträglich wachsen und schrumpfen", "Er braucht keinen Index", "Er ist immer schneller", "Er kann nur int speichern"], "Siehe Skript S. 40: vergrößerbar, einfügen an beliebiger Stelle, Größe abfragbar."],
    ["Warum ist v[0] = 5; bei einem leeren vector falsch?", ["Der vector hat noch kein Element 0 – Zugriff außerhalb", "Weil man 5 nicht speichern darf", "Weil der Index bei 1 beginnt", "Das ist richtig"], "Erst mit push_back (oder vector<int> v(n)) entstehen Elemente."],
    ["Welchen Datentyp liefert v.size()?", ["unsigned int (ohne Vorzeichen)", "double", "char", "bool"], "Deshalb ist v.size() − 1 bei einem leeren vector eine riesige Zahl."],
  ],
  funk: [
    ["Wie viele Plätze braucht der Text „Funk“ in einem char-Array?", ["5", "4", "6", "3"], "4 Zeichen plus das Endezeichen '\\0'."],
    ["Woran erkennt cout das Ende einer Zeichenkette in einem char-Array?", ["am Endezeichen '\\0'", "an der Arraygröße", "an einem Leerzeichen", "an einem Punkt"], "Ohne '\\0' liest cout einfach weiter im Speicher."],
    ["char name[20]; Wie bekommt name den Text „Ute“?", ["strcpy(name, \"Ute\");", "name = \"Ute\";", "name[20] = \"Ute\";", "name == \"Ute\";"], "Einem Array kann man mit = nichts zuweisen."],
    ["Was liefert strlen(\"Labor\")?", ["5", "6", "4", "20"], "strlen zählt die Zeichen ohne das '\\0'."],
    ["char wort[] = \"Port\"; Was steht in wort[4]?", ["'\\0'", "'t'", "nichts – es gibt kein wort[4]", "ein zufälliger Wert"], "Das Array hat 5 Elemente: P, o, r, t und '\\0'."],
  ],
  archiv: [
    ["Wie greift man auf die Komponente hausnummer der Strukturvariable a1 zu?", ["a1.hausnummer", "a1->hausnummer", "hausnummer.a1", "a1[hausnummer]"], "Der Punkt-Operator verbindet Variable und Komponente."],
    ["Wo steht die Definition eines struct-Typs?", ["vor main, mit ; nach der }", "in main nach return", "in einer eigenen Datei, ohne ;", "hinter dem Programmende"], "Siehe Skript S. 51."],
    ["punkt b = a; Danach wird b.x geändert. Was passiert mit a.x?", ["Nichts – b ist eine Kopie", "a.x ändert sich mit", "Das Programm stürzt ab", "a.x wird 0"], "Beim Zuweisen einer Struktur wird jede Komponente kopiert."],
    ["Welche Datentypen dürfen in einem struct stehen?", ["beliebige, auch Arrays und andere structs", "nur int", "nur gleiche Datentypen", "nur char-Arrays"], "Genau das ist der Unterschied zum Array."],
  ],
  labyrinth: [
    ["Was bedeutet &zahl?", ["die Adresse von zahl", "der Inhalt von zahl", "zahl wird verdoppelt", "eine Referenz auf 0"], "& liest man „Adresse von“."],
    ["int *p = &x; Was bedeutet *p = 5;?", ["In die Adresse, auf die p zeigt (also x), wird 5 geschrieben", "p bekommt die Adresse 5", "p wird 5-mal erhöht", "x wird gelöscht"], "* liest man „Inhalt der Adresse, auf die … zeigt“."],
    ["Warum stürzt *p = 5; ab, wenn p = NULL ist?", ["NULL zeigt auf keine gültige Speicherstelle", "5 ist zu groß", "NULL ist eine Zahl", "Das stürzt nicht ab"], "Vor dem Dereferenzieren muss ein Zeiger auf eine echte Variable zeigen."],
    ["Was unterscheidet call by reference von call by value?", ["Die Funktion bekommt die Adresse und kann das Original ändern", "Die Funktion bekommt eine Kopie", "Es werden nur Texte übergeben", "Es gibt keinen Unterschied"], "Mit Zeiger (int *p) oder Referenz (int &z)."],
    ["bruch *pb = &b; Was ist gleichwertig zu pb->nenner?", ["(*pb).nenner", "*pb.nenner", "pb.nenner", "&pb.nenner"], "Der Pfeil -> ist die Kurzform für Dereferenzieren und Punkt."],
  ],
  tresor: [
    ["Was passiert beim Öffnen mit ofstream aus(\"x.txt\"); wenn x.txt schon Text enthält?", ["Der alte Inhalt wird gelöscht", "Der neue Text wird hinten angehängt", "Das Öffnen schlägt fehl", "Der Text bleibt, man kann nur lesen"], "ofstream öffnet standardmäßig mit ios::out | ios::trunc."],
    ["Mit welchem Modus hängt man Text an das Ende einer Datei an?", ["ios::app", "ios::trunc", "ios::in", "ios::end"], "app = append = anhängen."],
    ["Was liefert while (datei.get(c)) am Dateiende?", ["falsch – die Schleife endet", "wahr – die Schleife läuft weiter", "einen Fehler", "das letzte Zeichen noch einmal"], "Kann kein Zeichen mehr gelesen werden, ist der Strom nicht mehr in Ordnung."],
    ["Warum sollte man eine Datei mit close() schließen?", ["Damit alles Gepufferte wirklich in die Datei geschrieben wird", "Damit die Datei gelöscht wird", "Damit der Computer schneller wird", "Das ist verboten"], "Siehe Skript: nicht geschriebener Inhalt im Puffer wird erst beim Schließen geschrieben."],
    ["Welche Bibliothek braucht man für fstream?", ["<fstream>", "<iostream> reicht", "<cstring>", "<vector>"], "#include <fstream>"],
  ],
});

Object.assign(GENERATOREN, {
  lager: [
    () => {
      const w = verschiedene(5, 1, 40);
      return ausgabeFrage(
        mainProg(
          ["iostream", "vector"],
          `  vector<int> v = {${w[0]}, ${w[1]}, ${w[2]}};
  v.push_back(${w[3]});
  v.push_back(${w[4]});
  v.pop_back();
  cout << v.size() << " " << v[v.size() - 1];`
        ),
        `Nach zwei push_back und einem pop_back hat der vector 4 Elemente, das letzte ist ${w[3]}.`
      );
    },
    () => {
      const w = verschiedene(4, 1, 9);
      const k = zufall(0, 4);
      const x = zufall(10, 99);
      return ausgabeFrage(
        mainProg(
          ["iostream", "vector"],
          `  vector<int> v = {${w.join(", ")}};
  v.insert(v.begin() + ${k}, ${x});
  for (unsigned int i = 0; i < v.size(); i++)
  {
    cout << v[i] << " ";
  }`
        ),
        `insert schiebt ${x} an Position ${k}, alle Elemente dahinter rücken nach hinten.`
      );
    },
    () => {
      const w = verschiedene(5, 1, 9);
      const k = zufall(0, 4);
      return ausgabeFrage(
        mainProg(
          ["iostream", "vector"],
          `  vector<int> v = {${w.join(", ")}};
  v.erase(v.begin() + ${k});
  for (int x : v)
  {
    cout << x << " ";
  }`
        ),
        `erase löscht das Element an Position ${k} (also ${w[k]}), der Rest rückt nach vorn.`
      );
    },
    () => {
      const n = zufall(3, 6);
      const w = zufall(2, 9);
      const j = zufall(0, n - 1);
      const x = zufall(10, 30);
      return ausgabeFrage(
        mainProg(
          ["iostream", "vector"],
          `  vector<int> v(${n}, ${w});
  v[${j}] = ${x};
  int s = 0;
  for (int e : v)
  {
    s = s + e;
  }
  cout << s;`
        ),
        `vector<int> v(${n}, ${w}) legt ${n} Elemente mit dem Wert ${w} an. Eins wird zu ${x}: ${(n - 1) * w} + ${x} = ${(n - 1) * w + x}.`
      );
    },
    () => {
      const n = zufall(3, 6);
      return ausgabeFrage(
        mainProg(
          ["iostream", "vector"],
          `  vector<int> q;
  for (int i = 1; i <= ${n}; i++)
  {
    q.push_back(i * i);
  }
  cout << q.size() << " " << q[${n - 2}];`
        ),
        `Die Quadratzahlen 1 bis ${n * n} werden angehängt. q[${n - 2}] ist das ${n - 1}. Element: ${(n - 1) * (n - 1)}.`
      );
    },
  ],
  funk: [
    () => {
      const w = waehle(WOERTER);
      const k = zufall(0, w.length - 1);
      return ausgabeFrage(
        mainProg(
          ["iostream", "cstring"],
          `  char wort[] = "${w}";
  cout << wort[${k}] << " " << strlen(wort);`
        ),
        `wort[${k}] ist das ${k + 1}. Zeichen. strlen zählt ${w.length} Zeichen – das '\\0' zählt nicht.`
      );
    },
    () => {
      const w = waehle(WOERTER);
      const c = waehle(w.split(""));
      return ausgabeFrage(
        mainProg(
          ["iostream"],
          `  char text[] = "${w}";
  int n = 0;
  int i = 0;
  while (text[i] != '\\0')
  {
    if (text[i] == '${c}')
      n++;
    i++;
  }
  cout << n << " " << i;`
        ),
        `Die Schleife läuft bis zum '\\0'. ${c} kommt ${w.split(c).length - 1}-mal vor, i endet bei der Länge ${w.length}.`
      );
    },
    () => {
      const w = waehle(WOERTER);
      const j = zufall(0, w.length - 1);
      return ausgabeFrage(
        mainProg(
          ["iostream", "cstring"],
          `  char ziel[12];
  strcpy(ziel, "${w}");
  ziel[${j}] = 'x';
  cout << ziel;`
        ),
        `strcpy kopiert „${w}“ samt '\\0', danach wird Element ${j} überschrieben.`
      );
    },
    () => {
      const w = waehle(WOERTER);
      const k = zufall(2, Math.min(4, w.length - 1));
      return ausgabeFrage(
        mainProg(
          ["iostream", "cstring"],
          `  char kurz[10];
  strcpy(kurz, "${w}");
  kurz[${k}] = '\\0';
  cout << kurz << " " << strlen(kurz);`
        ),
        `Das '\\0' an Position ${k} beendet die Zeichenkette vorzeitig: Es bleiben ${k} Zeichen.`
      );
    },
    () => {
      const w = waehle(WOERTER).toLowerCase();
      const c = waehle(["x", "s", "a", "e"]);
      return ausgabeFrage(
        mainProg(
          ["iostream", "string"],
          `  string s = "${w}";
  s.push_back('${c}');
  cout << s << " " << s.size();`
        ),
        `push_back hängt '${c}' an, der string wird ${w.length + 1} Zeichen lang.`
      );
    },
  ],
  archiv: [
    () => {
      const x = zufall(1, 9);
      const y = zufall(1, 9);
      const k = zufall(2, 9);
      return ausgabeFrage(
        prog(["iostream"], ["struct punkt", "{", "  int x;", "  int y;", "};", "int main()", "{", `  punkt a = {${x}, ${y}};`, "  punkt b = a;", `  b.x = b.x + ${k};`, '  cout << a.x << " " << b.x << " " << b.y;', "  return 0;", "}"]),
        `b ist eine Kopie von a. Nur b.x ändert sich: ${x + k}.`
      );
    },
    () => {
      const m = zufall(2, 9);
      const preis = waehle([1.5, 2.5, 0.5, 4.0, 1.25]);
      const name = waehle(["Kabel", "Stecker", "Switch", "Platine"]);
      return ausgabeFrage(
        prog(["iostream"], ["struct artikel", "{", "  char name[10];", "  int menge;", "  double preis;", "};", "int main()", "{", `  artikel a = {"${name}", ${m}, ${Number.isInteger(preis) ? preis.toFixed(1) : preis}};`, "  a.menge = a.menge + 1;", '  cout << a.name << " " << a.menge * a.preis;', "  return 0;", "}"]),
        `menge wird ${m + 1}, mal ${preis} ergibt ${(m + 1) * preis}.`
      );
    },
    () => {
      const w = verschiedene(3, 10, 99);
      return ausgabeFrage(
        prog(["iostream"], [
          "struct messung",
          "{",
          "  int nr;",
          "  int wert;",
          "};",
          "int main()",
          "{",
          `  messung m[3] = {{1, ${w[0]}}, {2, ${w[1]}}, {3, ${w[2]}}};`,
          "  int best = 0;",
          "  for (int i = 1; i < 3; i++)",
          "  {",
          "    if (m[i].wert > m[best].wert)",
          "      best = i;",
          "  }",
          '  cout << m[best].nr << " " << m[best].wert;',
          "  return 0;",
          "}",
        ]),
        `Gesucht ist die Messung mit dem größten Wert: ${Math.max(...w)}.`
      );
    },
    () => {
      const x = zufall(1, 9);
      const k = zufall(2, 9);
      return ausgabeFrage(
        prog(["iostream"], ["struct punkt", "{", "  int x;", "  int y;", "};", "void verschiebe(punkt p)", "{", `  p.x = p.x + ${k};`, '  cout << p.x << " ";', "}", "int main()", "{", `  punkt a = {${x}, 0};`, "  verschiebe(a);", "  cout << a.x;", "  return 0;", "}"]),
        `verschiebe bekommt eine Kopie der Struktur (call by value). a.x bleibt ${x}.`
      );
    },
    () => {
      const h = zufall(7, 15);
      const m = zufall(0, 40);
      const k = zufall(5, 15);
      return ausgabeFrage(
        prog(["iostream"], ["struct zeit", "{", "  int h;", "  int m;", "};", "struct termin", "{", "  char titel[8];", "  zeit beginn;", "};", "int main()", "{", `  termin t = {"Labor", {${h}, ${m}}};`, `  t.beginn.m = t.beginn.m + ${k};`, '  cout << t.titel << " " << t.beginn.h << " " << t.beginn.m;', "  return 0;", "}"]),
        `Verschachtelter Zugriff: t.beginn.m wird ${m} + ${k} = ${m + k}.`
      );
    },
  ],
  labyrinth: [
    () => {
      const a = zufall(1, 20);
      const k = zufall(2, 9);
      return ausgabeFrage(
        mainProg(
          ["iostream"],
          `  int a = ${a};
  int *p = &a;
  *p = *p + ${k};
  cout << a;`
        ),
        `p zeigt auf a. *p = *p + ${k} ändert also a: ${a + k}.`
      );
    },
    () => {
      const [a, b] = verschiedene(2, 1, 20);
      const k = zufall(30, 60);
      return ausgabeFrage(
        mainProg(
          ["iostream"],
          `  int a = ${a};
  int b = ${b};
  int *p = &a;
  p = &b;
  *p = ${k};
  cout << a << " " << b;`
        ),
        `p wird auf b umgestellt, bevor geschrieben wird. Nur b ändert sich.`
      );
    },
    () => {
      const [x, y] = verschiedene(2, 1, 30);
      return ausgabeFrage(
        prog(["iostream"], ["void tausche(int *a, int *b)", "{", "  int hilf = *a;", "  *a = *b;", "  *b = hilf;", "}", "int main()", "{", `  int x = ${x};`, `  int y = ${y};`, "  tausche(&x, &y);", '  cout << x << " " << y;', "  return 0;", "}"]),
        "tausche bekommt die Adressen und vertauscht die Inhalte direkt in main."
      );
    },
    () => {
      const a = zufall(2, 9);
      const m = zufall(2, 4);
      return ausgabeFrage(
        prog(["iostream"], ["void malZeiger(int *z)", "{", `  *z = *z * ${m};`, "}", "void malKopie(int w)", "{", `  w = w * ${m};`, "}", "int main()", "{", `  int a = ${a};`, "  malZeiger(&a);", "  malKopie(a);", "  cout << a;", "  return 0;", "}"]),
        `Nur malZeiger ändert a (call by reference): ${a} · ${m} = ${a * m}. malKopie arbeitet mit einer Kopie.`
      );
    },
    () => {
      const a = zufall(1, 20);
      const k = zufall(2, 9);
      return ausgabeFrage(
        prog(["iostream"], ["void addiere(int &r, int k)", "{", "  r = r + k;", "}", "int main()", "{", `  int a = ${a};`, `  addiere(a, ${k});`, `  addiere(a, ${k});`, "  cout << a;", "  return 0;", "}"]),
        `r ist eine Referenz – ein anderer Name für a. Zweimal + ${k}: ${a + 2 * k}.`
      );
    },
    () => {
      const w = verschiedene(5, 1, 9);
      const k = zufall(0, 3);
      return ausgabeFrage(
        mainProg(
          ["iostream"],
          `  int arr[5] = {${w.join(", ")}};
  int *p = arr;
  p = p + ${k};
  cout << *p << " " << p[1];`
        ),
        `p zeigt zuerst auf arr[0], nach + ${k} auf arr[${k}]. p[1] ist dann arr[${k + 1}].`
      );
    },
    () => {
      const s = zufall(50, 200);
      const x = zufall(5, 40);
      return ausgabeFrage(
        prog(["iostream"], ["struct konto", "{", "  int nr;", "  int stand;", "};", "int main()", "{", `  konto k = {7, ${s}};`, "  konto *pk = &k;", `  pk->stand = pk->stand - ${x};`, '  cout << k.nr << " " << k.stand;', "  return 0;", "}"]),
        `pk->stand ist dasselbe wie (*pk).stand – also k.stand: ${s} − ${x} = ${s - x}.`
      );
    },
  ],
  tresor: [
    () => {
      const w = Array.from({ length: zufall(3, 5) }, () => zufall(1, 30));
      const inhalt = w.join(" ");
      return ausgabeFrage(
        mainProg(
          ["iostream", "fstream"],
          `  ifstream ein("werte.txt");
  int zahl;
  int summe = 0;
  while (ein >> zahl)
  {
    summe = summe + zahl;
  }
  cout << summe;`
        ),
        `werte.txt enthält „${inhalt}“. >> liest Zahl für Zahl, bis nichts mehr kommt: Summe ${w.reduce((a, b) => a + b, 0)}.`,
        { "werte.txt": inhalt }
      );
    },
    () => {
      const a = waehle(WOERTER);
      const b = waehle(WOERTER).slice(0, zufall(2, 4));
      const inhalt = `${a}\n${b}`;
      return ausgabeFrage(
        mainProg(
          ["iostream", "fstream"],
          `  ifstream ein("text.txt");
  char c;
  int n = 0;
  while (ein.get(c))
  {
    n++;
  }
  cout << n;`
        ),
        `text.txt enthält „${a}“, einen Zeilenumbruch und „${b}“. get liest jedes Zeichen – auch den Zeilenumbruch: ${a.length} + 1 + ${b.length} = ${a.length + 1 + b.length}.`,
        { "text.txt": inhalt }
      );
    },
    () => {
      const zeilen = [waehle(WOERTER), waehle(WOERTER), waehle(WOERTER), waehle(WOERTER)];
      const k = zufall(1, 4);
      return ausgabeFrage(
        mainProg(
          ["iostream", "fstream", "string"],
          `  ifstream ein("liste.txt");
  string zeile;
  int nr = 0;
  while (getline(ein, zeile))
  {
    nr++;
    if (nr == ${k})
      cout << zeile << " ";
  }
  cout << nr;`
        ),
        `getline liest Zeile für Zeile. Zeile ${k} ist „${zeilen[k - 1]}“, insgesamt sind es 4 Zeilen.`,
        { "liste.txt": zeilen.join("\n") }
      );
    },
    () => {
      const n = zufall(3, 5);
      const k = zufall(2, 5);
      return dateiFrage(
        mainProg(
          ["iostream", "fstream"],
          `  ofstream aus("aus.txt");
  for (int i = 1; i <= ${n}; i++)
  {
    aus << i * ${k} << " ";
  }
  aus.close();`
        ),
        "aus.txt",
        `In die Datei werden ${n} Zahlen geschrieben: ${Array.from({ length: n }, (_, i) => (i + 1) * k).join(" ")}.`,
        {}
      );
    },
    () => {
      const alt = waehle(["A;", "Start;", "Log;"]);
      const n = zufall(2, 3);
      return dateiFrage(
        mainProg(
          ["iostream", "fstream"],
          `  fstream fs("log.txt", ios::out | ios::app);
  for (int i = 1; i <= ${n}; i++)
  {
    fs << i << ";";
  }
  fs.close();`
        ),
        "log.txt",
        `Mit ios::app bleibt „${alt}“ stehen, der neue Text wird hinten angehängt.`,
        { "log.txt": alt }
      );
    },
    () => {
      const alt = waehle(["alte Notiz", "Wichtig", "Passwort123"]);
      const neu = waehle(["neu", "leer", "x"]);
      return dateiFrage(
        mainProg(
          ["iostream", "fstream"],
          `  ofstream aus("notiz.txt");
  aus << "${neu}";
  aus.close();`
        ),
        "notiz.txt",
        `ofstream öffnet mit ios::out | ios::trunc: „${alt}“ wird gelöscht, nur „${neu}“ steht danach drin.`,
        { "notiz.txt": alt }
      );
    },
  ],
});

function neuePruefung(stufe) {
  const id = STUFEN[stufe].id;
  if (Math.random() < 0.25) {
    const q = waehle(PRUEF_MC[id]);
    return mc(q[0], q[1], q[2], null);
  }
  for (let versuch = 0; versuch < 20; versuch++) {
    const a = waehle(GENERATOREN[id])();
    if (a) {
      return a;
    }
  }
  const q = waehle(PRUEF_MC[id]);
  return mc(q[0], q[1], q[2], null);
}

// Antwort vergleichen: Leerraum egal, Komma wie Punkt
function antwortPasst(aufgabe, eingabe) {
  const norm = (s) => ausgabeNormal(String(s).replace(/,/g, "."));
  if (aufgabe.art === "zahl") {
    return Number(norm(eingabe)) === aufgabe.antwort && norm(eingabe) !== "";
  }
  return norm(eingabe) === norm(aufgabe.antwort);
}

if (typeof module !== "undefined") {
  module.exports = { STUFEN, RAETSEL, SERIE_ZIEL, neuePruefung, antwortPasst, GENERATOREN, PRUEF_MC };
}
