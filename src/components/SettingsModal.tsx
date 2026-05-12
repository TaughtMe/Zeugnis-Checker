import { X, Calculator } from "lucide-react";
import { useStudentStore } from "../store/useStudentStore";
import { useMemo } from "react";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { students, excludedFromAverage, toggleSubjectInAverage } = useStudentStore();

    const allSubjects = useMemo(() => {
        const set = new Set<string>();
        students.forEach(s => (s.results?.subjects || []).forEach(sub => set.add(sub.name)));
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'de'));
    }, [students]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                    <h2 className="text-xl font-bold text-white">Einstellungen & Info</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                            <Calculator className="w-4 h-4" />
                            Fächer für Durchschnittsberechnung
                        </h3>
                        {allSubjects.length === 0 ? (
                            <p className="text-sm text-slate-500 italic">
                                Noch keine Fächer erkannt. Erst nach erfolgreicher Analyse erscheinen hier die Fächer zum Auswählen.
                            </p>
                        ) : (
                            <>
                                <p className="text-xs text-slate-400">
                                    Standardmäßig sind nicht vorrückungsrelevante Fächer (z.B. Sport) abgewählt.
                                    Häkchen entfernen, um ein Fach aus dem Durchschnitt auszuschließen.
                                </p>
                                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-4 rounded-xl border border-slate-800/50 max-h-64 overflow-y-auto custom-scrollbar">
                                    {allSubjects.map(subj => {
                                        const isIncluded = !excludedFromAverage.includes(subj);
                                        return (
                                            <label key={subj} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-900 rounded cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={isIncluded}
                                                    onChange={() => toggleSubjectInAverage(subj)}
                                                    className="w-4 h-4 accent-blue-500"
                                                />
                                                <span className={`text-sm ${isIncluded ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                                                    {subj}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-slate-500">
                                    {allSubjects.length - excludedFromAverage.filter(s => allSubjects.includes(s)).length} von {allSubjects.length} Fächern aktiv im Auswahl-Durchschnitt.
                                </p>
                            </>
                        )}
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-800">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Nutzungshinweise</h3>
                        <p className="text-slate-300 leading-relaxed text-sm">
                            Diese PWA ist vorgesehen mit <span className="text-blue-400 font-medium">Lokalen KI Modellen von LM Studio</span> (http://localhost:1234) betrieben zu werden.
                        </p>
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <p className="text-emerald-200 text-sm leading-relaxed">
                                <strong>Datenschutz by Design:</strong> Alle Zeugnis-Daten verbleiben ausschließlich
                                im Arbeitsspeicher dieses Browser-Tabs. Beim Schließen werden sie automatisch verworfen.
                                Es findet keine Speicherung in localStorage, IndexedDB oder auf der Festplatte statt.
                                Eine strenge Content-Security-Policy erlaubt ausgehende Verbindungen ausschließlich
                                an localhost:1234 (LM Studio).
                            </p>
                        </div>
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <p className="text-amber-200 text-sm leading-relaxed">
                                <strong>Hinweis:</strong> Cloud-API-Lösungen sind nicht datenschutzkonform.
                                Der Nutzer ist dafür verantwortlich, ein datenschutzkonformes lokales KI-Modell zu verwenden.
                            </p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-800">
                        <div className="flex justify-between items-center text-xs text-slate-500">
                            <span>Version 1.1.0 (PWA)</span>
                            <span>&copy; Toby Bryson 2026</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-900/50 flex justify-end border-t border-slate-800 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/20"
                    >
                        Verstanden
                    </button>
                </div>
            </div>
        </div>
    );
}
