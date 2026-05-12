import React from 'react';
import { Users, FileText, Loader2, ArrowUpDown, AlertTriangle, Trash2, X, Filter } from 'lucide-react';
import { useStudentStore } from '../store/useStudentStore';
import { StudentProfile } from '../types/student';

type SortMode = 'upload' | 'firstName' | 'lastName';
type FilterMode = 'all' | 'danger' | 'warning' | 'clear' | 'error';

function getFirstName(fullName: string): string {
    return fullName.trim().split(/\s+/)[0] || '';
}

function getLastName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1] : parts[0] || '';
}

export const Sidebar: React.FC = () => {
    const { students, selectedStudentId, selectStudent, isAnalyzing, connectionStatus, loadWhitelist, removeStudent, clearAll } = useStudentStore();
    const [sortMode, setSortMode] = React.useState<SortMode>('upload');
    const [filterMode, setFilterMode] = React.useState<FilterMode>('all');
    const [confirmClear, setConfirmClear] = React.useState(false);

    React.useEffect(() => {
        loadWhitelist();
    }, [loadWhitelist]);

    const visibleStudents = React.useMemo(() => {
        let arr = [...students];

        if (filterMode === 'danger') arr = arr.filter(s => s.resultStatus === 'danger');
        else if (filterMode === 'warning') arr = arr.filter(s => s.resultStatus === 'warning');
        else if (filterMode === 'clear') arr = arr.filter(s => s.resultStatus === 'clear');
        else if (filterMode === 'error') arr = arr.filter(s => s.status === 'error');

        if (sortMode === 'firstName') {
            arr.sort((a, b) => getFirstName(a.name).localeCompare(getFirstName(b.name), 'de'));
        } else if (sortMode === 'lastName') {
            arr.sort((a, b) => getLastName(a.name).localeCompare(getLastName(b.name), 'de'));
        } else {
            arr.sort((a, b) => a.uploadOrder - b.uploadOrder);
        }
        return arr;
    }, [students, sortMode, filterMode]);

    // Keyboard navigation: Arrow Up/Down through the visible list
    React.useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (visibleStudents.length === 0) return;
            const target = e.target as HTMLElement | null;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) return;

            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            e.preventDefault();

            const currentIdx = visibleStudents.findIndex(s => s.id === selectedStudentId);
            let nextIdx: number;
            if (currentIdx === -1) {
                nextIdx = 0;
            } else if (e.key === 'ArrowDown') {
                nextIdx = (currentIdx + 1) % visibleStudents.length;
            } else {
                nextIdx = (currentIdx - 1 + visibleStudents.length) % visibleStudents.length;
            }
            selectStudent(visibleStudents[nextIdx].id);
        }

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [visibleStudents, selectedStudentId, selectStudent]);

    const stats = React.useMemo(() => {
        const completed = students.filter(s => s.status === 'completed').length;
        const danger = students.filter(s => s.resultStatus === 'danger').length;
        const warning = students.filter(s => s.resultStatus === 'warning').length;
        const clear = students.filter(s => s.resultStatus === 'clear').length;
        const errors = students.filter(s => s.status === 'error').length;
        return { completed, danger, warning, clear, errors };
    }, [students]);

    const StatusTrafficLight: React.FC<{ status: StudentProfile['resultStatus'] | 'processing' | 'pending' | 'error' }> = ({ status }) => {
        if (status === 'processing') return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
        if (status === 'error') return <AlertTriangle className="w-4 h-4 text-rose-400" />;
        if (status === 'pending' || !status) return <div className="w-3 h-3 rounded-full bg-slate-700" />;

        const config = {
            danger: { color: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' },
            warning: { color: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' },
            clear: { color: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' }
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
        if (student.status === 'error') return 'Fehler';
        if (student.status === 'pending') return 'Warten';

        switch (student.resultStatus) {
            case 'danger': return 'Gefährdet';
            case 'warning': return 'Prüfen';
            case 'clear': return 'O.K.';
            default: return 'Fertig';
        }
    };

    const FilterChip: React.FC<{ mode: FilterMode; label: string; count: number; color: string; }> = ({ mode, label, count, color }) => (
        <button
            onClick={() => setFilterMode(filterMode === mode ? 'all' : mode)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${filterMode === mode ? `${color} ring-1 ring-current` : 'bg-slate-800/50 text-slate-500 hover:text-slate-300'}`}
        >
            <span>{label}</span>
            <span className="opacity-70">{count}</span>
        </button>
    );

    return (
        <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col">
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-400" />
                        <span>Schülerliste</span>
                    </h2>
                    {students.length > 0 && (
                        confirmClear ? (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => { clearAll(); setConfirmClear(false); }}
                                    className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded uppercase tracking-wider"
                                >
                                    Sicher
                                </button>
                                <button
                                    onClick={() => setConfirmClear(false)}
                                    className="p-1 text-slate-500 hover:text-white"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmClear(true)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Alle Schüler löschen"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )
                    )}
                </div>
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
                            <span>{Math.round((stats.completed / students.length) * 100)}%</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${(stats.completed / students.length) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {stats.completed > 0 && (
                    <div className="mt-4">
                        <label className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">
                            <Filter className="w-3 h-3" />
                            Filter
                        </label>
                        <div className="flex flex-wrap gap-1">
                            <FilterChip mode="danger" label="Rot" count={stats.danger} color="bg-rose-500/15 text-rose-400" />
                            <FilterChip mode="warning" label="Gelb" count={stats.warning} color="bg-amber-500/15 text-amber-400" />
                            <FilterChip mode="clear" label="Grün" count={stats.clear} color="bg-emerald-500/15 text-emerald-400" />
                            {stats.errors > 0 && <FilterChip mode="error" label="Fehler" count={stats.errors} color="bg-slate-500/20 text-slate-300" />}
                        </div>
                    </div>
                )}

                {students.length > 0 && (
                    <div className="mt-4">
                        <label className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">
                            <ArrowUpDown className="w-3 h-3" />
                            Sortierung
                        </label>
                        <select
                            value={sortMode}
                            onChange={(e) => setSortMode(e.target.value as SortMode)}
                            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-blue-500"
                        >
                            <option value="upload">Upload-Reihenfolge</option>
                            <option value="firstName">Vorname (A-Z)</option>
                            <option value="lastName">Nachname (A-Z)</option>
                        </select>
                    </div>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {students.length === 0 ? (
                    <div className="text-center py-10 px-4">
                        <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">Noch keine Schüler importiert.</p>
                    </div>
                ) : visibleStudents.length === 0 ? (
                    <div className="text-center py-10 px-4">
                        <p className="text-sm text-slate-500">Keine Profile im Filter.</p>
                    </div>
                ) : (
                    visibleStudents.map((student) => (
                        <div
                            key={student.id}
                            className={`group relative w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 cursor-pointer ${selectedStudentId === student.id
                                ? 'bg-blue-600/10 border border-blue-500/50 text-white'
                                : 'hover:bg-slate-800 text-slate-400 border border-transparent'
                                }`}
                            onClick={() => selectStudent(student.id)}
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate group-hover:text-white transition-colors pr-6">
                                    {student.name.startsWith('Unbekannter Schüler')
                                        ? (student.rawText.split('\n')[0].trim() || student.name)
                                        : student.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <StatusTrafficLight status={student.status === 'processing' ? 'processing' : student.status === 'error' ? 'error' : student.resultStatus} />
                                    <span className={`text-[10px] uppercase tracking-wider font-semibold opacity-70 ${student.resultStatus === 'danger' || student.status === 'error' ? 'text-rose-400' :
                                        student.resultStatus === 'warning' ? 'text-amber-400' : ''
                                        }`}>
                                        {getStatusText(student)}
                                    </span>
                                    {student.className && student.className !== 'Unbekannt' && (
                                        <span className="ml-auto text-[10px] text-slate-500 font-mono">
                                            {student.className}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); removeStudent(student.id); }}
                                className="absolute top-2 right-2 p-1 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded opacity-0 group-hover:opacity-100 transition-all"
                                title="Schüler entfernen"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
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
                <p className="text-[9px] text-slate-600 mt-2 text-center">↑↓ Tasten zum Navigieren</p>
            </div>
        </aside>
    );
};
