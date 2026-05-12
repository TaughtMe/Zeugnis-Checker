import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export function UpdateNotification() {
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisterError(error) {
            console.error('Service Worker registration error:', error);
        },
    });

    if (!needRefresh) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[200] max-w-sm bg-slate-900 border border-blue-500/40 rounded-2xl shadow-2xl shadow-blue-500/10 backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <RefreshCw className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white">Update verfügbar</p>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                            Eine neue Version des Zeugnis-Checkers wurde geladen.
                            Bitte aktualisieren, um die neuen Funktionen zu nutzen.
                        </p>
                    </div>
                    <button
                        onClick={() => setNeedRefresh(false)}
                        className="shrink-0 p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Später"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                    <button
                        onClick={() => setNeedRefresh(false)}
                        className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Später
                    </button>
                    <button
                        onClick={() => updateServiceWorker(true)}
                        className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Jetzt aktualisieren
                    </button>
                </div>
            </div>
        </div>
    );
}
