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
    rang: "Neuling",
    thema: "Variablen und Datentypen",
    untertitel: "Raum 1 · Eingangshalle: int, char und double",
    auftrag: "Das erste Schloss: Welche Werte landen in den Variablen? Achte auf die Datentypen – int rechnet ohne Komma, char ist eigentlich eine Zahl, und beim Umwandeln wird abgeschnitten.",
  },
  {
    id: "bibliothek",
    name: "Bibliothek",
    rang: "Spurensucher",
    thema: "Verzweigungen",
    untertitel: "Raum 2 · Bibliothek: if, else if und else",
    auftrag: "Hinter jedem Regal wartet eine Abzweigung. Prüfe jede Bedingung mit den aktuellen Werten: Welcher Zweig wird ausgeführt – und welcher nicht?",
  },
  {
    id: "uhren",
    name: "Uhrenzimmer",
    rang: "Rätsellöser",
    thema: "Schleifen",
    untertitel: "Raum 3 · Uhrenzimmer: for, while und do-while",
    auftrag: "Die Uhren ticken Runde für Runde. Führe einen Schreibtischtest: Schreibe nach jeder Runde die Werte auf – so findest du die Ausgabe sicher.",
  },
  {
    id: "schliessfach",
    name: "Schließfachraum",
    rang: "Schließfachprofi",
    thema: "Arrays",
    untertitel: "Raum 4 · Schließfachraum: Arrays und Index",
    auftrag: "Eine Reihe Schließfächer, nummeriert ab 0. Verfolge, welches Fach gerade geöffnet wird – und denk daran: Das letzte Fach hat die Nummer Länge − 1.",
  },
  {
    id: "spiegel",
    name: "Spiegelsaal",
    rang: "Schlossknacker",
    thema: "Funktionen und Geltungsbereich",
    untertitel: "Raum 5 · Spiegelsaal: Funktionen, lokale und globale Variablen",
    auftrag: "Im Spiegelsaal heißen manche Variablen gleich – sind aber verschiedene. Schau genau, in welchem Bereich (global, main, Funktion, Block) eine Variable gilt.",
  },
  {
    id: "kessel",
    name: "Kesselraum",
    rang: "Tresorknacker",
    thema: "Überlauf und Grenzen",
    untertitel: "Raum 6 · Kesselraum: Überlauf, Wertebereiche und Rundungsfehler",
    auftrag: "Hier steht der Tresor. Der Druck steigt, bis der Zeiger überschlägt: Was passiert, wenn ein Wert nicht mehr in seinen Datentyp passt?",
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
function ausgabeFrage(code, erklaerung) {
  const lauf = fuehreAus(code);
  if (lauf.fehler || /\?/.test(lauf.ausgabe)) {
    return null;
  }
  return { art: "text", frage: "Welchen Code zeigt das Schloss? Gib die komplette Ausgabe ein (Zeilenumbrüche als Leerzeichen).", antwort: ausgabeNormal(lauf.ausgabe), erklaerung, code };
}

function zahlFrage(code, frage, antwortFn, erklaerung) {
  const lauf = fuehreAus(code);
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
