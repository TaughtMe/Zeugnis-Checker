import { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';

const BANNER_KEY = 'zc_privacy_banner_seen';

export function PrivacyBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // sessionStorage: per-Tab. Beim Tab-Schließen erscheint der Banner
        // wieder — konsistent mit unserer "nichts persistent" Linie für Daten.
        // Der Flag selbst ist keine Nutzerinformation.
        try {
            const seen = sessionStorage.getItem(BANNER_KEY);
            if (!seen) setVisible(true);
        } catch {
            setVisible(true);
        }
    }, []);

    function dismiss() {
        try {
            sessionStorage.setItem(BANNER_KEY, '1');
        } catch {
            // ignore — banner just stays gone for this render
        }
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/10 animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
                <div className="p-6 sm:p-8">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-black text-white">Willkommen — kurz zum Datenschutz</h2>
                            <p className="text-xs text-slate-500 mt-1">Diese Hinweise erscheinen einmal pro Sitzung.</p>
                        </div>
                        <button onClick={dismiss} className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" title="Schließen">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <ul className="space-y-3 text-sm text-slate-300 leading-relaxed">
                        <li className="flex gap-3">
                            <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                            <span><strong className="text-white">Lokale Verarbeitung:</strong> Zeugnis-PDFs werden direkt im Browser gelesen und ausschließlich an dein lokales LM Studio (localhost:1234) gesendet.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                            <span><strong className="text-white">Keine Cloud:</strong> Eine strikte Content-Security-Policy blockiert jede ausgehende Verbindung außer zu localhost.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                            <span><strong className="text-white">Kein Speicher:</strong> Es wird weder in localStorage noch in IndexedDB geschrieben. Schließt du den Tab, sind alle Schülerdaten weg.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="text-amber-400 font-bold mt-0.5">!</span>
                            <span><strong className="text-white">Voraussetzung:</strong> In LM Studio muss <em>„Enable CORS"</em> aktiviert sein, bevor der Server startet.</span>
                        </li>
                    </ul>

                    <button
                        onClick={dismiss}
                        className="mt-6 w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                    >
                        Verstanden — los geht's
                    </button>
                </div>
            </div>
        </div>
    );
}
