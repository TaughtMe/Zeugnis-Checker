import { StudentProfile } from '../types/student';

export const exportConferenceSummary = async (students: StudentProfile[]) => {
    const endangered = students.filter(s => s.resultStatus === 'danger');

    if (endangered.length === 0) {
        throw new Error('Keine gefährdeten Schüler für den Export gefunden.');
    }

    // Group by class (fallback "Unbekannt")
    const groups = new Map<string, StudentProfile[]>();
    for (const s of endangered) {
        const cls = s.className && s.className !== 'Unbekannt' ? s.className : 'Unbekannt';
        if (!groups.has(cls)) groups.set(cls, []);
        groups.get(cls)!.push(s);
    }
    const classNames = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b, 'de'));

    const dateStr = new Date().toLocaleDateString('de-DE').replace(/\./g, '-');
    const isSingleClass = classNames.length === 1 && classNames[0] !== 'Unbekannt';
    const fileSuffix = isSingleClass ? classNames[0] : 'Mehrklassen';
    const defaultFileName = `Konferenzliste_Gefährdung_${fileSuffix}_${dateStr}.txt`;

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
                    failingGrades.forEach(sub => {
                        out += `     - ${sub.name}: Note ${sub.grade}\n`;
                    });
                }

                if (s.results.lrsHints.length > 0) {
                    out += `   HINWEISE (LRS/Notenschutz):\n`;
                    s.results.lrsHints.forEach(hint => {
                        out += `     - ${hint}\n`;
                    });
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
