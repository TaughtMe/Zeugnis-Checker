import React from 'react';
import { useStudentStore } from '../store/useStudentStore';
import { FileText, Wand2, AlertCircle, Edit2, Check, X, Info } from 'lucide-react';
import { isPromotionRelevant } from '../utils/msoLogic';

export const MainContent: React.FC = () => {
    const { students, selectedStudentId, addToWhitelist, whitelist, updateStudentName } = useStudentStore();
    const selectedStudent = students.find(s => s.id === selectedStudentId);
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [editedName, setEditedName] = React.useState('');

    React.useEffect(() => {
        if (selectedStudent) {
            setEditedName(selectedStudent.name);
            setIsEditingName(false);
        }
    }, [selectedStudentId]);

    const handleSaveName = () => {
        if (selectedStudent && editedName.trim()) {
            updateStudentName(selectedStudent.id, editedName.trim());
            setIsEditingName(false);
        }
    };

    const handleIgnore = async (hint: string) => {
        const term = hint.split(' ')[0].replace(/[,.]/g, '');
        await addToWhitelist(term);
    };

    const isIgnored = (hint: string) => {
        return whitelist.some(w => hint.toLowerCase().includes(w.toLowerCase()));
    };

    if (!selectedStudent) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 bg-slate-950 p-8">
                <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-slate-800">
                    <Wand2 className="w-10 h-10 text-blue-500/50" />
                </div>
                <h3 className="text-2xl font-black text-white mb-8">Willkommen beim KI Zeugnis Checker</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold mb-4 border border-blue-500/20">1</div>
                        <h4 className="text-slate-200 font-bold mb-2">Modell starten</h4>
                        <p className="text-sm">LM Studio Modell laden & Server (Local Server) starten.</p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold mb-4 border border-emerald-500/20">2</div>
                        <h4 className="text-slate-200 font-bold mb-2">PDF Import</h4>
                        <p className="text-sm">Zeugnis-PDF per Button oben oder Drag & Drop reinziehen.</p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold mb-4 border border-amber-500/20">3</div>
                        <h4 className="text-slate-200 font-bold mb-2">Analyse</h4>
                        <p className="text-sm">Analyse starten und Ampeln in der Schülerliste prüfen.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-slate-950 custom-scrollbar">
            <div className="max-w-5xl mx-auto p-8">
                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-bold uppercase tracking-wider">
                            Analyse Detail
                        </span>
                    </div>

                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                            <input
                                title="Schülername"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                className="bg-slate-900 border border-blue-500 text-white text-4xl font-black p-1 rounded-lg outline-none focus:ring-2 ring-blue-500/50"
                                autoFocus
                            />
                            <button onClick={handleSaveName} className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors">
                                <Check className="w-6 h-6" />
                            </button>
                            <button onClick={() => setIsEditingName(false)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    ) : (
                        <h1 className="text-4xl font-black text-white flex items-center gap-4 group">
                            {selectedStudent.name}
                            <button
                                onClick={() => setIsEditingName(true)}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-lg transition-all text-slate-500 hover:text-white"
                            >
                                <Edit2 className="w-5 h-5" />
                            </button>
                        </h1>
                    )}

                    {selectedStudent.resultStatus && (
                        <div className={`mt-4 flex flex-col gap-1 p-4 rounded-2xl border animate-in slide-in-from-left-2 duration-300 ${selectedStudent.resultStatus === 'danger' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                            selectedStudent.resultStatus === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}>
                            {selectedStudent.resultStatus === 'danger' ? <AlertCircle className="w-5 h-5" /> :
                                selectedStudent.resultStatus === 'warning' ? <AlertCircle className="w-5 h-5" /> :
                                    <Info className="w-5 h-5" />}
                            <span className="text-sm font-bold uppercase tracking-wider">
                                Status: {selectedStudent.resultStatus === 'danger' ? 'Gefährdet' : selectedStudent.resultStatus === 'warning' ? 'Prüfung erforderlich' : 'Klar'}
                            </span>
                            {selectedStudent.statusReason && (
                                <p className="text-sm opacity-90 pl-7">{selectedStudent.statusReason}</p>
                            )}
                        </div>
                    )}
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-400" />
                                Rohtext aus dem Zeugnis
                            </h2>
                            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/50">
                                <pre className="whitespace-pre-wrap text-sm text-slate-400 font-mono leading-relaxed">
                                    {selectedStudent.rawText}
                                </pre>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                            <h2 className="text-lg font-bold text-white mb-4">Analyse-Ergebnisse</h2>

                            {selectedStudent.status === 'completed' && selectedStudent.results ? (
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fächer & Noten</h3>
                                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold">
                                                {(selectedStudent.results.subjects || []).length} Fächer
                                            </span>
                                        </div>
                                        <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800/50">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-900/50 border-b border-slate-800/50">
                                                    <tr>
                                                        <th className="text-left py-2 px-3 text-slate-500 font-semibold">Fach</th>
                                                        <th className="text-right py-2 px-3 text-slate-500 font-semibold w-16">Note</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/30">
                                                    {(selectedStudent.results.subjects || []).map((s: { name: string; grade: number }, i: number) => {
                                                        const isRelevant = isPromotionRelevant(s.name);
                                                        return (
                                                            <tr key={i} className="hover:bg-slate-900/30 transition-colors">
                                                                <td className="py-2 px-3 text-slate-300 flex items-center gap-2">
                                                                    {s.name}
                                                                    {!isRelevant && (
                                                                        <span title="Nicht vorrückungsrelevant" className="text-[10px] bg-slate-800 text-slate-500 px-1 border border-slate-700 rounded font-bold cursor-help">§</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2 px-3 text-right">
                                                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs ${s.grade <= 2 ? 'bg-emerald-500/10 text-emerald-400' :
                                                                        s.grade <= 4 ? 'bg-amber-500/10 text-amber-400' :
                                                                            'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                                                                        }`}>
                                                                        {s.grade}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Zeitform</h3>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${selectedStudent.results.tense === 'Bunt gemischt'
                                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                            {selectedStudent.results.tense}
                                        </span>
                                    </div>

                                    {(selectedStudent.results.lrsHints || []).filter(h => !isIgnored(h)).length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">LRS-Hinweise</h3>
                                            <div className="space-y-2">
                                                {(selectedStudent.results.lrsHints || []).filter(h => !isIgnored(h)).map((hint, i) => (
                                                    <div key={i} className="group relative p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-xs text-blue-200/80 leading-relaxed transition-all hover:bg-blue-500/10">
                                                        <div className="flex items-start gap-2">
                                                            <span className="shrink-0 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold uppercase">LRS</span>
                                                            <p className="flex-1">{hint}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleIgnore(hint)}
                                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-bold transition-all"
                                                        >
                                                            Ignorieren
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-500 italic">
                                    {selectedStudent.status === 'pending' ? (
                                        <p>Warte auf Start der Analyse...</p>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p>KI analysiert das Zeugnis...</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};
