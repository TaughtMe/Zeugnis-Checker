import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Sidebar } from "./components/Sidebar";
import { MainContent } from "./components/MainContent";
import { useStudentStore } from "./store/useStudentStore";
import { processRawPdfText } from "./utils/pdfProcessor";
import { FileUp, AlertCircle, CheckCircle2, Wand2, FileText } from "lucide-react";
import { exportConferenceSummary } from "./utils/exportUtils";

function App() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importCount, setImportCount] = useState<number | null>(null);

    const {
        students,
        isAnalyzing,
        connectionStatus,
        setStudents,
        startBatchAnalysis,
        checkConnection
    } = useStudentStore();

    async function handleExport() {
        try {
            await exportConferenceSummary(students);
        } catch (err) {
            setError(String(err));
        }
    }

    // Heartbeat check on mount and every 30 seconds
    useEffect(() => {
        checkConnection();
        const interval = setInterval(checkConnection, 30000);
        return () => clearInterval(interval);
    }, [checkConnection]);

    async function handleOpenPdf() {
        try {
            setLoading(true);
            setError(null);
            setImportCount(null);

            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'PDF',
                    extensions: ['pdf']
                }]
            });

            if (selected && typeof selected === 'string') {
                const extractedText = await invoke<string>("read_pdf_text", { path: selected });
                const studentProfiles = processRawPdfText(extractedText);
                setStudents(studentProfiles);
                setImportCount(studentProfiles.length);
            }
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden">
            {/* Sidebar Section */}
            <Sidebar />

            {/* Main Content Wall */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                            KI Zeugnis Checker
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {importCount !== null && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-500">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {importCount} Schüler-Profile erfolgreich erkannt
                            </div>
                        )}

                        {students.length > 0 && (
                            <button
                                onClick={startBatchAnalysis}
                                disabled={isAnalyzing || connectionStatus !== 'connected'}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all transform active:scale-95 shadow-lg ${isAnalyzing
                                    ? 'bg-amber-600/20 text-amber-500 cursor-not-allowed border border-amber-500/20'
                                    : connectionStatus === 'connected'
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                    }`}
                            >
                                {isAnalyzing ? (
                                    <><div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /> Analyse läuft...</>
                                ) : (
                                    <><Wand2 className="w-4 h-4" /> Analyse starten</>
                                )}
                            </button>
                        )}

                        {students.length > 0 && students.every(s => s.status === 'completed') && (
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-lg text-sm font-bold transition-all transform active:scale-95 shadow-lg shadow-rose-500/20"
                            >
                                <FileText className="w-4 h-4" />
                                Export für Klassenkonferenz
                            </button>
                        )}

                        <button
                            onClick={handleOpenPdf}
                            disabled={loading || isAnalyzing}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-lg text-sm font-bold transition-all transform active:scale-95 shadow-lg shadow-blue-500/20"
                        >
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importiere...</>
                            ) : (
                                <><FileUp className="w-4 h-4" /> PDF Importieren</>
                            )}
                        </button>
                    </div>
                </header>

                <main className="flex-1 flex min-h-0 relative">
                    {error && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3 shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-200">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span className="text-sm font-medium">{error}</span>
                            <button
                                onClick={() => setError(null)}
                                className="ml-4 hover:text-white transition-colors p-1"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <MainContent />
                </main>
            </div>
        </div>
    );
}

export default App;

