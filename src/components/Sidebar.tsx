import React from 'react';
import { Users, FileText, Loader2 } from 'lucide-react';
import { useStudentStore } from '../store/useStudentStore';
import { StudentProfile } from '../types/student';

export const Sidebar: React.FC = () => {
    const { students, selectedStudentId, selectStudent, isAnalyzing, connectionStatus, loadWhitelist } = useStudentStore();

    React.useEffect(() => {
        loadWhitelist();
    }, [loadWhitelist]);

    const StatusTrafficLight: React.FC<{ status: StudentProfile['resultStatus'] | 'processing' | 'pending' }> = ({ status }) => {
        if (status === 'processing') return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
        if (status === 'pending' || !status) return <div className="w-3 h-3 rounded-full bg-slate-700" />;

        const config = {
            danger: { color: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]', label: 'Rot' },
            warning: { color: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]', label: 'Gelb' },
            clear: { color: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]', label: 'Grün' }
        };

        const active = config[status as keyof typeof config];

        return (
            <div className="flex gap-1 items-center">
                <div className={`w-2.5 h-2.5 rounded-full ${status === 'danger' ? active.color : 'bg-slate-800'}`} />
                <div className={`w-2.5 h-2.5 rounded-full ${status === 'warning' ? active.color : 'bg-slate-800'}`} />
                <div className={`w-2.5 h-2.5 rounded-full ${status === 'clear' ? active.color : 'bg-slate-800'}`} />
            </div>
        );
    };

    const getStatusText = (student: StudentProfile) => {
        if (student.status === 'processing') return 'Läuft...';
        if (student.status === 'pending') return 'Warten';

        switch (student.resultStatus) {
            case 'danger': return 'Gefährdet';
            case 'warning': return 'Prüfen';
            case 'clear': return 'O.K.';
            default: return 'Fertig';
        }
    };

    return (
        <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span>Schülerliste</span>
                </h2>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-slate-500">
                        {students.length} Profil{students.length !== 1 ? 'e' : ''} erkannt
                    </p>
                    {isAnalyzing && (
                        <div className="text-[10px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-bold animate-pulse">
                            ANALYSE...
                        </div>
                    )}
                </div>

                {isAnalyzing && (
                    <div className="mt-4">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-bold uppercase tracking-wider">
                            <span>Gesamtfortschritt</span>
                            <span>{Math.round((students.filter(s => s.status === 'completed').length / students.length) * 100)}%</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${(students.filter(s => s.status === 'completed').length / students.length) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {students.length === 0 ? (
                    <div className="text-center py-10 px-4">
                        <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">Noch keine Schüler importiert.</p>
                    </div>
                ) : (
                    students.map((student) => (
                        <button
                            key={student.id}
                            onClick={() => selectStudent(student.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 group ${selectedStudentId === student.id
                                ? 'bg-blue-600/10 border border-blue-500/50 text-white'
                                : 'hover:bg-slate-800 text-slate-400 border border-transparent'
                                }`}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate group-hover:text-white transition-colors">
                                    {student.name.startsWith('Unbekannter Schüler')
                                        ? (student.rawText.split('\n')[0].trim() || student.name)
                                        : student.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <StatusTrafficLight status={student.status === 'processing' ? 'processing' : student.resultStatus} />
                                    <span className={`text-[10px] uppercase tracking-wider font-semibold opacity-70 ${student.resultStatus === 'danger' ? 'text-rose-400' :
                                        student.resultStatus === 'warning' ? 'text-amber-400' : ''
                                        }`}>
                                        {getStatusText(student)}
                                    </span>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </nav>

            <div className="p-4 border-t border-slate-800 mt-auto">
                <div className="bg-slate-800/40 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">LM Studio</p>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                            connectionStatus === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'
                            }`}></div>
                        <p className="text-xs text-slate-300">
                            {connectionStatus === 'connected' ? 'Verbunden' :
                                connectionStatus === 'checking' ? 'Suche...' : 'Nicht gefunden'}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
};
