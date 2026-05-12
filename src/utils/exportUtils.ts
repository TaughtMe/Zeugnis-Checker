import { StudentProfile } from '../types/student';

function groupByClass(endangered: StudentProfile[]) {
    const groups = new Map<string, StudentProfile[]>();
    for (const s of endangered) {
        const cls = s.className && s.className !== 'Unbekannt' ? s.className : 'Unbekannt';
        if (!groups.has(cls)) groups.set(cls, []);
        groups.get(cls)!.push(s);
    }
    const classNames = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b, 'de'));
    return { groups, classNames };
}

function getEndangered(students: StudentProfile[]) {
    const endangered = students.filter(s => s.resultStatus === 'danger');
    if (endangered.length === 0) {
        throw new Error('Keine gefährdeten Schüler für den Export gefunden.');
    }
    return endangered;
}

function buildFileSuffix(classNames: string[]): string {
    const isSingleClass = classNames.length === 1 && classNames[0] !== 'Unbekannt';
    return isSingleClass ? classNames[0] : 'Mehrklassen';
}

export const exportConferenceSummary = async (students: StudentProfile[]) => {
    const endangered = getEndangered(students);
    const { groups, classNames } = groupByClass(endangered);

    const dateStr = new Date().toLocaleDateString('de-DE').replace(/\./g, '-');
    const defaultFileName = `Konferenzliste_Gefährdung_${buildFileSuffix(classNames)}_${dateStr}.txt`;

    let out = `ZUSAMMENFASSUNG FÜR KLASSENKONFERENZ\n`;
    out += `Erstellt am: ${new Date().toLocaleString('de-DE')}\n`;
    out += `Klassen: ${classNames.join(', ')}\n`;
    out += `Anzahl gefährdeter Schüler: ${endangered.length}\n`;
    out += `==========================================\n\n`;

    for (const cls of classNames) {
        const list = groups.get(cls)!;
        out += `\n========== KLASSE ${cls} (${list.length} Schüler) ==========\n\n`;

        list.forEach((s, index) => {
            out += `${index + 1}. NAME: ${s.name}\n`;
            out += `   STATUS: GEFÄHRDET (Rot)\n`;
            if (s.results) {
                const failingGrades = s.results.subjects.filter(sub => sub.grade >= 5);
                if (failingGrades.length > 0) {
                    out += `   KRITISCHE FÄCHER:\n`;
                    failingGrades.forEach(sub => { out += `     - ${sub.name}: Note ${sub.grade}\n`; });
                }
                if (s.results.lrsHints.length > 0) {
                    out += `   HINWEISE (LRS/Notenschutz):\n`;
                    s.results.lrsHints.forEach(hint => { out += `     - ${hint}\n`; });
                }
            }
            out += `\n------------------------------------------\n\n`;
        });
    }

    const blob = new Blob([out], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
};

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export const exportConferenceAsPdf = async (students: StudentProfile[]) => {
    const endangered = getEndangered(students);
    const { groups, classNames } = groupByClass(endangered);

    const createdAt = new Date().toLocaleString('de-DE');

    const sections = classNames.map(cls => {
        const list = groups.get(cls)!;
        const rows = list.map((s, i) => {
            const failing = s.results ? s.results.subjects.filter(sub => sub.grade >= 5) : [];
            const failingHtml = failing.length > 0
                ? `<ul class="failing">${failing.map(f => `<li><strong>${escapeHtml(f.name)}:</strong> Note ${f.grade}</li>`).join('')}</ul>`
                : '<p class="empty">—</p>';
            const hintsHtml = s.results && s.results.lrsHints.length > 0
                ? `<div class="hints"><strong>Hinweise:</strong><ul>${s.results.lrsHints.map(h => `<li>${escapeHtml(h)}</li>`).join('')}</ul></div>`
                : '';
            return `
                <div class="student">
                    <h3>${i + 1}. ${escapeHtml(s.name)}</h3>
                    <div class="kritisch">
                        <span class="label">Kritische Fächer</span>
                        ${failingHtml}
                    </div>
                    ${hintsHtml}
                </div>
            `;
        }).join('');
        return `
            <section class="klasse">
                <h2>Klasse ${escapeHtml(cls)} <span class="muted">(${list.length} Schüler)</span></h2>
                ${rows}
            </section>
        `;
    }).join('');

    const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Konferenzliste – Gefährdung</title>
<style>
  @page { margin: 1.5cm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #111; max-width: 900px; margin: 0 auto; padding: 1rem; }
  h1 { font-size: 22px; margin-bottom: 0.25rem; }
  .meta { color: #555; font-size: 12px; border-bottom: 2px solid #111; padding-bottom: 0.75rem; margin-bottom: 1rem; }
  h2 { font-size: 16px; margin-top: 1.5rem; border-bottom: 1px solid #888; padding-bottom: 0.25rem; }
  .muted { color: #777; font-weight: normal; font-size: 13px; }
  .student { padding: 0.75rem 0; border-bottom: 1px dashed #ccc; page-break-inside: avoid; }
  .student h3 { font-size: 14px; margin: 0 0 0.5rem 0; color: #b91c1c; }
  .kritisch .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666; }
  .failing { margin: 0.25rem 0 0 1rem; padding: 0; }
  .failing li { font-size: 13px; }
  .hints { margin-top: 0.5rem; font-size: 12px; background: #fff7ed; border-left: 3px solid #f59e0b; padding: 0.5rem 0.75rem; }
  .hints ul { margin: 0.25rem 0 0 1rem; padding: 0; }
  .empty { color: #999; font-style: italic; font-size: 12px; margin: 0.25rem 0 0 0; }
  @media print { body { padding: 0; max-width: 100%; } .no-print { display: none; } }
</style>
</head>
<body>
  <h1>Konferenzliste – Versetzungsgefährdung</h1>
  <p class="meta">
    Erstellt am ${escapeHtml(createdAt)} · Klassen: ${escapeHtml(classNames.join(', '))} · ${endangered.length} Schüler gefährdet
  </p>
  ${sections}
  <script>
    window.addEventListener('load', () => { setTimeout(() => window.print(), 250); });
  </script>
</body>
</html>`;

    const w = window.open('', '_blank');
    if (!w) {
        throw new Error('Druckfenster konnte nicht geöffnet werden (Popup-Blocker?).');
    }
    w.document.open();
    w.document.write(html);
    w.document.close();

    return true;
};
