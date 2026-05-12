# KI Zeugnis Checker

Lokale, KI-gestützte Vorprüfung deutscher Schulzeugnisse — als
plattformunabhängige **Progressive Web App** (PWA). Läuft in jedem
modernen Browser auf Windows, macOS und Linux, ohne Installation und
ohne dass Zeugnis-Daten das Gerät verlassen.

> Diese Version ist die PWA-Migration der ursprünglichen Tauri-Desktop-App.
> Alle Tauri-/Rust-Abhängigkeiten wurden entfernt.

## Funktionen

- **PDF-Import** mehrerer Zeugnisse auf einmal (Split automatisch über
  „ZWISCHENZEUGNIS"/„JAHRESZEUGNIS"-Marker).
- **KI-Analyse** der Fließtexte via [LM Studio](https://lmstudio.ai/) —
  Notenextraktion, Zeitform-Check, LRS-Hinweise.
- **Versetzungs-Ampel** nach Bayerischer MSO-Logik (zwei × 5 oder ein × 6
  in vorrückungsrelevanten Fächern = Gefährdet).
- **Konferenz-Export** als .txt mit allen gefährdeten Schülern.
- **Whitelist** für ignorierte LRS-Hinweise (nur in-memory, siehe Datenschutz).

## Datenschutz / Sicherheits-Modell

| Schicht                    | Verhalten                                                      |
|----------------------------|----------------------------------------------------------------|
| Zeugnis-Daten              | Nur im RAM des Browser-Tabs; beim Schließen vollständig weg.   |
| `localStorage` / IndexedDB | Wird **nicht** verwendet.                                       |
| Festplatte                 | Keine automatische Speicherung; nur expliziter Export-Download. |
| Netzwerk                   | CSP erlaubt ausschließlich `http://localhost:1234` (LM Studio). |
| Service Worker             | Cached App-Shell. LM-Studio-Calls sind `NetworkOnly`.           |

Die Content-Security-Policy ist sowohl als `<meta>`-Tag in
[`index.html`](index.html) als auch als HTTP-Header
([`public/_headers`](public/_headers)) hinterlegt.

## Voraussetzungen

- **Node.js 20+** (für Entwicklung/Build)
- **LM Studio** mit geladenem Modell und gestartetem **Local Server**
  auf Port `1234`
- In LM Studio **„Enable CORS" / „Allow All Origins" aktivieren** —
  sonst blockt der Browser die Verbindung

## Schnellstart (lokal)

```bash
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # erzeugt statisches Build in ./dist
npm run preview    # lokale Vorschau des Builds
```

## Deployment

Das Verzeichnis `dist/` ist ein statisches Asset-Bundle und kann auf
beliebigen statischen Hosts deployt werden:

- **Cloudflare Pages** (empfohlen): Repo verbinden, Build-Command
  `npm run build`, Output-Verzeichnis `dist`. `public/_headers` setzt
  automatisch die CSP- und Sicherheits-Header.
- **GitHub Pages / Netlify / Vercel**: ebenfalls möglich; bei Netlify
  funktioniert `_headers` analog, bei anderen Hosts müssen die Header
  selbst konfiguriert werden.
- **Lokal per `file://`**: nicht empfohlen, da Service Worker und
  einige Web-APIs unter `file://` deaktiviert sind.

## Architektur

```
src/
  App.tsx               – Layout, PDF-Import, Export-Button
  components/
    Sidebar.tsx         – Schülerliste + LM-Studio-Status
    MainContent.tsx     – Detail-Ansicht eines Schülers
    SettingsModal.tsx   – Datenschutz-Hinweise
  services/
    aiService.ts        – fetch()-Calls an LM Studio
    whitelistService.ts – In-Memory-Whitelist
  store/
    useStudentStore.ts  – Zustand-Store
  utils/
    pdfProcessor.ts     – PDF-Text via pdfjs-dist
    msoLogic.ts         – Versetzungs-Logik (Bayern)
    exportUtils.ts      – Blob-Download für Konferenzliste
public/
  icons/                – PWA-Icons (128/256/512)
  _headers              – CSP-Header für Cloudflare Pages
```

## Technologie-Stack

- React 18 + TypeScript + Vite 5
- Tailwind CSS, lucide-react
- Zustand (State)
- pdfjs-dist (clientseitige PDF-Text-Extraktion)
- vite-plugin-pwa / Workbox (Service Worker, Manifest)

## Bekannte Einschränkungen

- Nur **Bayerische MSO-Versetzungslogik** ist hinterlegt; andere
  Bundesländer würden eigene Regeln in `msoLogic.ts` brauchen.
- Die Whitelist ist absichtlich nicht persistent — beim Tab-Schließen
  geht sie verloren. Das ist eine bewusste Datenschutz-Entscheidung.
- Mixed Content: Wenn die PWA über HTTPS ausgeliefert wird, erlaubt
  der Browser den HTTP-Call zu `localhost`/`127.0.0.1` als Ausnahme
  (Secure-Context-Regel). Andere HTTP-Hosts würden blockiert.

## Lizenz / Copyright

© Toby Bryson 2026
