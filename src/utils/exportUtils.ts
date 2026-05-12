import { StudentProfile } from '../types/student';

export const exportConferenceSummary = async (students: StudentProfile[]) => {
    const endangeredStudents = students.filter(s => s.resultStatus === 'danger');

    if (endangeredStudents.length === 0) {
        throw new Error('Keine gefährdeten Schüler für den Export gefunden.');
    }

    const classMatch = students[0].rawText.match(/(?:Klasse|Kl\.):?\s*([0-9A-Z]{2,4})/i);
    const className = classMatch ? classMatch[1].trim() : 'Klasse';
    const dateStr = new Date().toLocaleDateString('de-DE').replace(/\./g, '-');
    const defaultFileName = `Konferenzliste_Gefährdung_${className}_${dateStr}.txt`;

    let summary = `ZUSAMMENFASSUNG FÜR KLASSENKONFERENZ\n`;
    summary += `Klasse: ${className}\n`;
    summary += `Erstellt am: ${new Date().toLocaleString('de-DE')}\n`;
    summary += `Anzahl gefährdeter Schüler: ${endangeredStudents.length}\n`;
    summary += `==========================================\n\n`;

    endangeredStudents.forEach((s, index) => {
        summary += `${index + 1}. NAME: ${s.name}\n`;
        summary += `   STATUS: GEFÄHRDET (Rot)\n`;

        if (s.results) {
            const failingGrades = s.results.subjects.filter(sub => sub.grade >= 5);
            summary += `   KRITISCHE FÄCHER:\n`;
            failingGrades.forEach(sub => {
                summary += `     - ${sub.name}: Note ${sub.grade}\n`;
            });

            if (s.results.lrsHints.length > 0) {
                summary += `   HINWEISE (LRS/Notenschutz):\n`;
                s.results.lrsHints.forEach(hint => {
                    summary += `     - ${hint}\n`;
                });
            }
        }
        summary += `\n------------------------------------------\n\n`;
    });

    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' });
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
