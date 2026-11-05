/**
 * 👕 NADRUKI — motywy Teterhii i Mini-TeOgochi z Pracowni obrazów Katedry na bluzach, koszulkach i torbach.
 * Serwer: nadruki.ts (makieta FLUX raz na ubiór i kolor, motyw nakładany ffmpegiem, sprawdzony PSNR-em).
 * ⚠️ Plik druku = motyw 1024 px powiększony do 4096 px — nie prawdziwe 300 DPI; makieta = rysunek, nie zdjęcie produktu.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Shirt, Loader2, Trash2, Download, AlertTriangle } from 'lucide-react';
import { Kolekcja360 } from './Kolekcja360';

const MOST = 'http://127.0.0.1:3001';
interface Motyw { id: string; opis: string; galaz: string | null; plik: string }
interface Nadruk { id: string; obraz: string; opisMotywu: string; ubior: string; kolor: string; podglad: string; druk: string; kiedy: string }
interface Ubior { nazwa: string; x: number; y: number; skala: number }

async function api<T>(adres: string, init?: RequestInit): Promise<T> {
    const r = await fetch(adres, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((d as { error?: string }).error ?? `HTTP ${r.status}`);
    return d as T;
}

const GALEZIE: Record<string, string> = { 'mini-teogochi': '🐾 Mini-TeOgochi', postacie: '🧝 Postacie', stwory: '👾 Stwory', wierzchowce: '🐎 Wierzchowce', rekwizyty: '🗝️ Rekwizyty', ekwipunek: '⚔️ Ekwipunek' };

export function Nadruki() {
    const { themeConfig } = useTheme();
    const [motywy, setMotywy] = useState<Motyw[]>([]);
    const [nadruki, setNadruki] = useState<Nadruk[]>([]);
    const [ubiory, setUbiory] = useState<Record<string, Ubior>>({});
    const [kolory, setKolory] = useState<Record<string, string>>({});
    const [galaz, setGalaz] = useState('mini-teogochi');
    const [wybrany, setWybrany] = useState<string | null>(null);
    const [ubior, setUbior] = useState('koszulka');
    const [kolor, setKolor] = useState('czarny');
    const [skala, setSkala] = useState(0.3);
    const [y, setY] = useState(0.42);
    const [tlo, setTlo] = useState<'wytnij' | 'zostaw'>('wytnij');
    const [zajety, setZajety] = useState(false);
    const [blad, setBlad] = useState('');

    const odswiez = useCallback(async () => {
        try { const d = await api<{ nadruki: Nadruk[]; ubiory: Record<string, Ubior>; kolory: Record<string, string> }>('/api/nadruki'); setNadruki(d.nadruki); setUbiory(d.ubiory); setKolory(d.kolory); } catch (e) { setBlad(String((e as Error).message)); }
        try { setMotywy((await api<{ motywy: Motyw[] }>('/api/nadruki/motywy')).motywy); } catch (e) { setBlad(String((e as Error).message)); }
    }, []);
    useEffect(() => { void odswiez(); }, [odswiez]);
    useEffect(() => { const u = ubiory[ubior]; if (u) { setSkala(u.skala); setY(u.y); } }, [ubior, ubiory]);

    const nadrukuj = async () => {
        if (!wybrany) return;
        setZajety(true); setBlad('');
        try {
            const d = await api<{ nadruk: Nadruk }>('/api/nadruki', { method: 'POST', body: JSON.stringify({ obraz: wybrany, ubior, kolor, skala, y, tlo }) });
            setNadruki((l) => [d.nadruk, ...l]);
        } catch (e) { setBlad(String((e as Error).message)); } finally { setZajety(false); }
    };
    const usun = async (id: string) => {
        try { await api(`/api/nadruki/${id}`, { method: 'DELETE' }); setNadruki((l) => l.filter((n) => n.id !== id)); } catch (e) { setBlad(String((e as Error).message)); }
    };

    const widoczne = motywy.filter((m) => m.galaz === galaz);
    return (
        <div className="space-y-6 p-4">
            <div>
                <h2 className="text-xl font-bold" style={{ color: themeConfig.hex }}><Shirt className="mr-2 inline h-5 w-5" />Nadruki — Teterhia i Mini-TeOgochi na ubraniach</h2>
                <p className="mt-1 text-xs opacity-60">Motywy z Pracowni obrazów Katedry. Pierwsza makieta ubioru w danym kolorze rysuje się FLUX-em (1–7 min), potem jest z pamięci. Plik druku to motyw powiększony do 4096 px — sprawdź ostrość przed zamówieniem.</p>
            </div>
            {blad && <p className="flex items-center gap-2 text-sm text-red-400"><AlertTriangle className="h-4 w-4" />{blad}</p>}

            <div className="flex flex-wrap gap-2">
                {Object.entries(GALEZIE).map(([id, n]) => (
                    <button key={id} onClick={() => setGalaz(id)} className={`rounded-full border px-3 py-1 text-xs ${galaz === id ? 'opacity-100' : 'opacity-50'}`} style={{ borderColor: themeConfig.hex }}>{n} ({motywy.filter((m) => m.galaz === id).length})</button>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                {widoczne.map((m) => (
                    <button key={m.id} onClick={() => setWybrany(m.id)} title={m.opis} className="overflow-hidden rounded-lg border-2" style={{ borderColor: wybrany === m.id ? themeConfig.hex : 'transparent' }}>
                        <img src={`${MOST}${m.plik}`} alt={m.opis.slice(0, 60)} loading="lazy" className="aspect-square w-full object-cover" />
                    </button>
                ))}
                {!widoczne.length && <p className="col-span-full text-xs opacity-50">W tej gałęzi Pracowni nie ma jeszcze obrazów — narysuj je w Game Studio → Obrazy.</p>}
            </div>

            <div className="flex flex-wrap items-end gap-3 rounded-xl border p-3" style={{ borderColor: themeConfig.borderHex }}>
                <label className="text-xs">Ubiór<br /><select value={ubior} onChange={(e) => setUbior(e.target.value)} className="rounded bg-black/40 px-2 py-1">{Object.keys(ubiory).map((id) => <option key={id} value={id}>{ubiory[id].nazwa}</option>)}</select></label>
                <label className="text-xs">Kolor<br /><select value={kolor} onChange={(e) => setKolor(e.target.value)} className="rounded bg-black/40 px-2 py-1">{Object.keys(kolory).map((k) => <option key={k} value={k}>{k}</option>)}</select></label>
                <label className="text-xs">Wielkość {Math.round(skala * 100)}%<br /><input type="range" min={0.08} max={0.7} step={0.01} value={skala} onChange={(e) => setSkala(Number(e.target.value))} /></label>
                <label className="text-xs">Wysokość {Math.round(y * 100)}%<br /><input type="range" min={0.15} max={0.85} step={0.01} value={y} onChange={(e) => setY(Number(e.target.value))} /></label>
                <label className="text-xs">Tło motywu<br /><select value={tlo} onChange={(e) => setTlo(e.target.value as 'wytnij' | 'zostaw')} className="rounded bg-black/40 px-2 py-1"><option value="wytnij">wytnij białe</option><option value="zostaw">zostaw</option></select></label>
                <button onClick={() => void nadrukuj()} disabled={!wybrany || zajety} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40" style={{ borderColor: themeConfig.hex, color: themeConfig.hex }}>
                    {zajety ? <><Loader2 className="mr-1 inline h-4 w-4 animate-spin" />nadrukowuję… (pierwsza makieta do 7 min)</> : '👕 Nadrukuj'}
                </button>
            </div>

            <Kolekcja360 motyw={motywy.find((m) => m.id === wybrany) ?? null} ubiory={ubiory} kolory={kolory} />

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {nadruki.map((n) => (
                    <div key={n.id} className="rounded-xl border p-2 text-xs" style={{ borderColor: themeConfig.borderHex }}>
                        <img src={n.podglad} alt={n.opisMotywu.slice(0, 60)} className="w-full rounded" />
                        <p className="mt-1 opacity-70">{ubiory[n.ubior]?.nazwa ?? n.ubior} · {n.kolor}</p>
                        <p className="line-clamp-2 opacity-50" title={n.opisMotywu}>{n.opisMotywu}</p>
                        <div className="mt-1 flex gap-2">
                            <a href={n.druk} download className="flex items-center gap-1 underline"><Download className="h-3 w-3" />plik druku</a>
                            <button onClick={() => void usun(n.id)} className="ml-auto opacity-60"><Trash2 className="h-3 w-3" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
