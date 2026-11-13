# Tresorknacker · Ein Escape-Room für C++

Im Keller des Laborservers liegt ein Tresor mit dem Root-Passwort. Der Weg dorthin führt durch elf Räume, und jede Tür hat ein **Code-Schloss**. Den Code findet man nicht durch Raten: Er ist **die Ausgabe eines kurzen C++-Programms**, das an der Wand steht. Wer das Programm im Kopf oder mit einem Schreibtischtest richtig durchspielt, öffnet die Tür.

Die Schüler schreiben keinen Code. Sie sagen voraus, was ein Programm ausgibt, und steppen es dann Zeile für Zeile durch. Dabei sehen sie den Speicher mit allen Variablen nach Gültigkeitsbereich, den Schreibtischtest und die Konsole. Bei jeder Stolperfalle erscheint ein Hinweis, z. B. Ganzzahldivision, char als Zahl, Überlauf, verdeckte Variable oder fehlender Startwert.

Elf Freigabestufen vom *Neuling* bis zum *Tresorknacker*. Die Räume folgen der Reihenfolge des Skripts „Einführung in C++“.

Erstellt für den Unterricht an der Jakob-Preh-Schule ([bsnes.de](https://www.bsnes.de)), Fachschule für Elektrotechnik, Fach Informationstechnik (ITec), 1. Schuljahr (Lerngebiet Programmierung in C++). Gedacht als Training vor den Schulaufgaben.

**Live-Version:** [Hier direkt anschauen](https://flowthetensor.github.io/LS-Tresorknacker/)

---

## Der Escape-Room

| Im Escape-Room | In C++ |
|---|---|
| Code-Schloss | die komplette Ausgabe des Programms (Leerraum zählt als ein Leerzeichen) |
| Programm an der Wand | Quelltext, aktuelle Zeile markiert |
| Speicher | alle Variablen, gruppiert nach Gültigkeitsbereich: global, lokal in main(), lokal in einer Funktion |
| gestrichelte Karte | Variable in einem inneren Block (z. B. das `i` im Kopf einer for-Schleife) |
| Spiegelrahmen | Variablen einer aufgerufenen Funktion: eigene Kopien, die beim Verlassen gelöscht werden |
| Schließfächer mit Nummern | Array, Index ab 0 |
| Förderband der Lagerhalle | vector, der wachsen und schrumpfen kann |
| Karteikarte | Strukturvariable (struct) mit ihren Komponenten |
| roter Pfeil (Wegweiser) | Zeiger: zeigt auf die Variable, deren Adresse er speichert |
| grüne Karte „Datei …“ | Datei mit Inhalt und Lesemarke (rot hinterlegt) |
| Schreibtischtest | Variablentafel: In welcher Zeile ändert sich welche Variable, was wird ausgegeben? |
| Konsole | Bildschirmausgabe, neue Zeichen gelb |
| Hinweiszettel | Stolperfallen des aktuellen Schritts |

## Die elf Räume

| Raum | Thema (Skript) | Freigabe als | Rätsel zum Üben |
|---|---|---|---|
| 1 Eingangshalle | Variablen und Datentypen (S. 7–16) | Neuling | Ganzzahldivision · Zeichen sind Zahlen · Abgeschnitten, nicht gerundet · Fehler: Tauschen ohne Zwischenspeicher · Richtig tauschen |
| 2 Bibliothek | Verzweigungen (S. 20–25) | Spurensucher | IHK-Notenschlüssel · Und, oder · Größte von drei Zahlen · Einzelne ifs statt else if · Fehler: = statt == |
| 3 Uhrenzimmer | Schleifen (S. 26–32) | Rätsellöser | Summe 1 bis 5 · Countdown mit while · do-while · break und continue · Verschachtelte Schleifen · Fehler: Summe ohne Startwert |
| 4 Schließfachraum | Arrays (S. 33–36) | Schließfachprofi | Regal füllen · Maximum suchen · Rückwärts ausgeben · Mittelwert mit double · Fehler: i <= 5 |
| 5 Lagerhalle | vector (S. 40) | Lagerist | Beispiel aus dem Skript · push_back · insert und erase · vector mit Startwerten · Fehler: Index statt push_back · Fehler: size() − 1 bei leerem vector |
| 6 Spiegelsaal | Funktionen, Geltungsbereich (S. 41–45) | Schlossknacker | Lokal und global (Skript S. 45) · Nur eine Kopie · Rückgabewert · Variable im Block · Fehler: i nach der Schleife |
| 7 Funkraum | Zeichenketten (S. 50) | Funker | Karl-Heinz (Skript) · Zeichen für Zeichen · Zeichen zählen bis '\0' · strcpy · string statt char-Array · Fehler: '\0' vergessen · Fehler: = statt strcpy · Fehler: strcpy zu lang |
| 8 Archiv | struct (S. 51) | Archivar | Adresse (Skript) · Verschachtelt: schueler · Eine Kopie der Karteikarte · Längster Film (Array von structs) · Struktur an eine Funktion |
| 9 Labyrinth | Zeiger (S. 52–54, 68) | Pfadfinder | Adresse und Inhalt · Zwei Wegweiser, ein Ziel · Adresse ausgeben · call by reference (Skript S. 54) · Tauschen mit Zeigern · Zeiger auf struct: -> · Zeiger durch ein Array · Fehler: Zeiger ohne Ziel · Fehler: Nullzeiger |
| 10 Kesselraum | Überlauf und Grenzen (S. 8–9, Gleitpunktzahlen) | Kesselmeister | char läuft über · char als Schleifenzähler · int an der Grenze · 0.1 + 0.2 · Groß und klein (ASCII) |
| 11 Tresorraum | Dateiarbeit mit C++-Datenströmen (S. 58) | Tresorknacker | Datei kopieren (Skript) · Zahlen aus einer Datei summieren · Das Passwort in Zeile 3 (getline) · Anhängen mit ios::app · Tippfehler im Dateinamen · ofstream löscht den Inhalt |

Datentypen sind char, int und double wie im Skript, dazu ab Raum 5 vector, char-Arrays, string, struct, Zeiger und Dateiströme.

### Typische Fehler als eigene Rätsel

| Rätsel | Was passiert |
|---|---|
| Tauschen ohne Zwischenspeicher | `a = b; b = a;` gibt zweimal denselben Wert aus |
| = statt == | `if (x = 5)` weist zu und ist immer wahr |
| Summe ohne Startwert | Ausgabe `???`, weil die lokale Variable keinen Startwert hat |
| i <= 5 | Zugriff auf `regal[5]`: Das Programm bricht mit „Zugriff außerhalb des Arrays“ ab |
| i nach der Schleife | `i` ist nach der for-Schleife nicht mehr bekannt (Gültigkeitsbereich) |
| Index statt push_back | `v[0] = 5;` bei leerem vector: Zugriff außerhalb |
| size() − 1 bei leerem vector | `v.size() - 1` ist unsigned: 0 − 1 wird 4294967295, die Schleife läuft los |
| '\0' vergessen | cout liest über das char-Array hinaus |
| = statt strcpy | `vorname = "Karl";` geht bei char-Arrays nicht |
| strcpy zu lang | strcpy schreibt über das Ende des Arrays hinaus |
| Zeiger ohne Ziel / Nullzeiger | `*p` ohne gültige Adresse lässt das Programm abstürzen |

### Kesselraum: Überlauf

| Programm | Ergebnis | Erklärung |
|---|---|---|
| `char druck = 120; druck = druck + 10;` | −126 | 130 passt nicht in char (−128 … 127): 130 − 256 = −126 |
| `for (char c = 125; c > 0; c++) runden++;` | 3 Runden | 125, 126, 127, dann springt c auf −128 |
| `int x = 2147483647; x = x + 1;` | −2147483648 | größter int-Wert überschritten |
| `0.1 + 0.2 == 0.3` | falsch | Zehntel lassen sich im Binärsystem nicht exakt speichern (Bezug zu den Gleitpunktzahlen) |
| `0.5 + 0.25 == 0.75` | wahr | Halbe und Viertel sind exakt darstellbar |

### Neue Räume im Überblick

- **Lagerhalle (vector):**
  - Der Speicher zeigt den vector als Reihe mit `size()`.
  - Bei `push_back`, `pop_back`, `insert(v.begin()+k, x)`, `erase(...)` und `clear()` sieht man, wie Elemente nachrücken.
  - Die for-each-Schleife `for (int x : v)` ist auch dabei.
- **Funkraum (Zeichenketten):**
  - char-Arrays erscheinen Zeichen für Zeichen, das Endezeichen `'\0'` ist blau markiert.
  - `cout`, `strlen` und `strcpy` werten bis zum `'\0'` aus.
  - Fehlt das `'\0'` oder ist das Ziel zu klein, bricht das Programm mit Erklärung ab.
  - Die string-Klasse kommt nur kurz vor, weil sie in Raum 11 gebraucht wird.
- **Archiv (struct):**
  - Strukturvariablen erscheinen als Karteikarten mit ihren Komponenten, auch verschachtelt und als Array von structs.
  - Beim Zuweisen und bei der Übergabe an Funktionen wird kopiert.
- **Labyrinth (Zeiger):**
  - Jede Variable zeigt ihre (simulierte) Adresse.
  - Zeiger erscheinen als roter Pfeil zu ihrem Ziel.
  - Behandelt werden `&` (Adresse von) und `*` (Inhalt der Adresse) sowie call by reference mit Zeiger und mit Referenz (`int &z`).
  - Dazu kommen `->` bei structs und Zeiger durch ein Array.
  - Die Adressen sind wie im Skript im 32-Bit-Stil, auf einem echten Rechner sind sie bei jedem Start anders.
- **Tresorraum (Dateiarbeit):**
  - Zum Rätsel gehören Dateien mit Inhalt, angezeigt als grüne Karten mit Lesemarke.
  - Unterstützt werden `fstream`, `ifstream`, `ofstream` mit `ios::in | ios::out | ios::app | ios::trunc`, dazu `get(c)`, `>>`, `getline`, `<<`, `open`, `close` und `is_open`.
  - Prüfungsfragen fragen auch nach dem Inhalt einer Datei nach dem Programm.

## Rätsel lösen und Freigabeprüfung

**Rätsel lösen** (Kopfzeile links):
1. Rätsel wählen.
2. Optional eine **Vorhersage** eintippen.
3. Dann Schritt für Schritt durchgehen. Am Ende springt die Tür auf, und der Rätselbericht vergleicht die Vorhersage mit der echten Ausgabe.

**Freigabeprüfung** (Kopfzeile rechts): Ein zufällig erzeugtes Programm erscheint, der Speicher bleibt verborgen. Die Schüler tippen den Code für das Schloss ein, also die komplette Ausgabe, oder beantworten eine Zahl- bzw. Multiple-Choice-Frage.
- **5 geknackte Schlösser in Folge** ergeben das Prüfsiegel. Ein Fehler setzt die Serie zurück, ebenso „Andere Frage“.
- Nach jeder Antwort folgt eine Erklärung, und „Ablauf zeigen“ spielt das Programm mit Speicher und Schreibtischtest durch.
- Die richtige Antwort berechnet der eingebaute Interpreter. Mehrere Leerzeichen und Zeilenumbrüche zählen als ein Leerzeichen, ein Komma gilt wie ein Punkt.
- Die Prüfsiegel werden im Browser gespeichert (localStorage). „zurücksetzen“ im Feld *Freigaben* löscht sie.

Beispiele für Prüfungsaufgaben (alle mit Zufallswerten):

| Raum | Aufgaben |
|---|---|
| 1 | `a / b` und `a / 2.0` mit int und double · `x * m + c` und `%` · `char z; cout << z << z + 1` · Code eines Zeichens · double nach int · Tauschfehler |
| 2 | IHK-Notenschlüssel · `&&` und `\|\|` · Maximum von drei Zahlen · getrennte ifs · verschachteltes if |
| 3 | Summe von a bis b · for mit Schrittweite · Anzahl der Ausgaben einer while-Schleife · do-while · verschachtelte Zählschleifen · break und continue |
| 4 | Element eines gefüllten Arrays · Summe · Maximum · rückwärts · laufende Summe · Mittelwert mit double |
| 5 | push_back und pop_back mit size() · insert und erase an zufälliger Position · vector(n, w) mit for-each · Quadratzahlen anhängen |
| 6 | global und lokal · Wertparameter · Rückgabewert · verdeckte Variable im Block · lokale Variable gleichen Namens in Funktion und main · globaler Zähler |
| 7 | Zeichen an Position k und strlen · Buchstaben zählen bis '\0' · strcpy und Zeichen ersetzen · '\0' kürzt den Text · string mit push_back |
| 8 | Kopie einer Struktur · Rechnen mit Komponenten · größter Messwert im Array von structs · Struktur als Wertparameter · verschachtelte Strukturen |
| 9 | Ändern über *p · Zeiger umstellen · Tauschen mit Zeigern · Zeiger- gegen Wertparameter · Referenzparameter · Zeiger durch ein Array · Zeiger auf struct mit -> |
| 10 | char-Überlauf nach oben und unten · char als Schleifenzähler · int-Grenze · Gleitpunktvergleich exakt oder nicht · Groß-/Kleinbuchstaben über ASCII |
| 11 | Zahlen aus Datei summieren · Zeichen zählen mit get (auch den Zeilenumbruch) · k-te Zeile mit getline · Was steht in der Datei? (Schreiben, ios::app, ofstream löscht) |

## Bedienung

| Aktion | Wirkung |
|---|---|
| Raum-Leiste (Reiter 1–11) | Raum wechseln, ✓ = Prüfsiegel vorhanden |
| Rätsel | Programm wählen |
| Vorhersage | eigene Lösung vor dem Durchsteppen eintragen (optional) |
| „Schritt“ oder **→** | nächster Schritt |
| „Automatisch“ oder **Leertaste** | ablaufen lassen / anhalten |
| „Neustart“ oder **R** | Programm von vorn |
| Tempo | langsam, mittel, schnell |

## Ideen für den Unterricht

- **Vorhersagen vor dem Steppen:** Erst schreibt jeder seine Vorhersage auf, dann wird am Beamer durchgesteppt. Wer hat das Schloss geknackt?
- **Schreibtischtest auf Papier:** Die Schüler führen die Variablentafel selbst und vergleichen dann mit der Tafel in der Simulation, so wie sie es auch in der Schulaufgabe brauchen.
- **Fehler-Rätsel zuerst zeigen:** Bei „Summe ohne Startwert“ oder „i <= 5“ vorher fragen, was passiert. Danach selbst in der eigenen Entwicklungsumgebung ausprobieren: Dort kommt oft eine zufällige Zahl heraus, oder es passiert gar nichts Sichtbares.
- **Spiegelsaal mit dem Skript:** Das Beispiel „Lokal und global“ ist das aus dem Skript (S. 45). Erst auf dem Arbeitsblatt bearbeiten, dann in der Simulation kontrollieren.
- **Kesselraum und Gleitpunktzahlen:** Warum ist 0.5 + 0.25 == 0.75 wahr, 0.1 + 0.2 == 0.3 aber nicht? Das passt direkt zum Thema Gleitpunktzahlen nach IEEE 754 und zum Bit-Bahnhof.
- **Prüfungstraining:** In der Stunde vor der Schulaufgabe die passenden Räume in der Freigabeprüfung durchlaufen lassen. Wer alle 11 Siegel hat, hat den Tresor geknackt.
- **Zeiger zeichnen:** Im Labyrinth zuerst die Speichertabelle aus dem Skript (S. 53) auf Papier füllen, dann mit den Adressen und Pfeilen in der Simulation vergleichen.
- **Dateiarbeit im Labor:** Die Rätsel aus dem Tresorraum mit echten Dateien in der eigenen Entwicklungsumgebung nachbauen – im 2. Schuljahr schreibt der Raspberry Pi so Messwerte der Modellanlage in Dateien.
- **Ausblick 2. Schuljahr:** Der char-Überlauf ist derselbe Effekt wie bei 8-Bit-Registern in der Mikrocontrollertechnik.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Seite, bindet Schriften, p5.js und die Skripte ein |
| `style.css` | Gestaltung im Corporate Design der Schule |
| `tracer.js` | kleiner C++-Interpreter: Zerlegen, Parser, Ausführung mit Schritten, Speicherbild, Schreibtischtest und Hinweisen – reines JavaScript, ohne p5 |
| `stufen.js` | Räume, Rätsel zum Üben, Prüfungsgeneratoren und Multiple-Choice-Fragen |
| `ui.js` | Knöpfe, Auswahllisten, Eingabefelder |
| `sketch.js` | Ablauf, Zeichnen: Quelltext, Code-Schloss mit Tür, Speicher, Schreibtischtest, Konsole, Rätselbericht |
| `assets/logo-jps.png` | Logo der Jakob-Preh-Schule |
| `libraries/p5.min.js` | p5.js (lokal, damit die Seite auch offline läuft) |

### Ein eigenes Rätsel ergänzen

In `stufen.js` bei einem Raum in `RAETSEL` einen Eintrag anlegen. `cpp(...)` setzt `#include`, `using namespace std;` und `int main()` drumherum:

```js
{
  titel: "Mein Rätsel",
  code: cpp(`  int x = 3;
  for (int i = 0; i < 4; i++)
  {
    x = x * 2;
  }
  cout << x;`),
},
```

Programme mit eigenen Funktionen, structs oder globalen Variablen schreibt man mit `prog([...includes], [...zeilen])` als vollständigen Text (siehe Spiegelsaal, Archiv). Dateien für ein Rätsel gibt man mit `dateien: { "input.txt": "Inhalt" }` an. Der Interpreter versteht:
- `int`, `char`, `double`, `bool`, `unsigned int`, `const`
- Arrays mit bis zu 24 Elementen, auch char-Arrays als C-Strings
- `vector<…>`, `string`, `struct`
- Zeiger (`*`, `&`, `->`, `NULL`), Referenzparameter, Array-Parameter (`int feld[]`)
- `if`/`else`, `while`, `do-while`, `for`, for-each, `break`, `continue`
- Funktionen mit `return`
- `cout`, `fstream`/`ifstream`/`ofstream`
- `strlen` und `strcpy`
- Typumwandlung mit `(int)` bzw. `int(...)`

Eingaben mit `cin` gibt es bewusst nicht, jedes Rätsel hat genau eine Lösung.

## Lokal starten

Am einfachsten in VS Code mit der Erweiterung **Live Server**: Rechtsklick auf `index.html` → „Open with Live Server“.

## Technische Hinweise

- Läuft mit **p5.js 1.x** (lokal mitgeliefert) und **p5.js 2.x**. Dafür verzichtet der Code bewusst auf Funktionen, die sich zwischen den Versionen geändert haben (z. B. `preload`, `loadFont`).
- Die Schriften (Quicksand, Inter, JetBrains Mono) kommen von Google Fonts. Ohne Internet weicht die Seite automatisch auf Systemschriften aus.
- Alle Schleifen haben geschweifte Klammern: Der p5-Web-Editor baut in Schleifen eine Endlosschleifen-Sicherung ein, die bei Schleifen ohne Klammern fehlschlägt.
- Jedes Programm wird vorab komplett vom Interpreter in `tracer.js` ausgeführt, höchstens 600 Schritte, danach „Endlosschleife“. Die Anzeige blättert nur durch diese Schritte.
- Alle Rätsel und eine Stichprobe von über 800 erzeugten Prüfungsprogrammen aus allen elf Räumen wurden mit g++ gegengeprüft. Ausgaben und Dateiinhalte stimmen überein (ausgenommen das Rätsel „Adresse ausgeben“, weil echte Adressen bei jedem Start anders sind).
- Bewusste Vereinfachungen:
  - Ein int-Überlauf ist in C++ eigentlich undefiniertes Verhalten. Gezeigt wird das übliche Verhalten der Compiler: Der Wert springt auf die andere Seite.
  - Uninitialisierte lokale Variablen erscheinen als `?` und werden als `???` ausgegeben.
  - Ein Zugriff außerhalb eines Arrays bricht das Programm ab, ebenso eine Ausgabe ohne '\0' und ein Zeiger ohne gültiges Ziel. Ein echtes Programm läuft dabei oft unbemerkt weiter oder gibt Unsinn aus.
  - Adressen sind simuliert (32 Bit wie im Skript, Zeiger 4 Byte). Dynamischer Speicher (new/delete) kommt nicht vor.
  - Fehler, die eigentlich schon der Compiler meldet (z. B. eine unbekannte Variable), zeigt die Simulation erst beim Erreichen der Zeile.
- Fehler in `draw()` werden abgefangen und als Hinweis angezeigt, statt das Programm einzufrieren.
