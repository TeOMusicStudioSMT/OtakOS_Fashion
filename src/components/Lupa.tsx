/**
 * 🔍 LUPA — powiększa PRAWDZIWE zdjęcie.
 *
 * ⚠️ Dlaczego nowy komponent, skoro jest FabricWeaveZoom: tamten NIE POWIĘKSZA
 * OBRAZU. Rysuje proceduralnie wymyślony splot włókna na canvasie i pokazuje
 * w kółku wygenerowany wzór — razem z napisem „10µm", który niczego nie mierzy.
 * To dekoracja z szablonu AI Studio. Wygląd stamtąd bierzemy (okrągła soczewka,
 * obwódka w kolorze nastroju, celownik, licznik powiększenia), ale pod spodem
 * pokazujemy piksele Twojego kadru.
 *
 * ⚠️ Soczewka renderuje TEN SAM <img> z tym samym object-fit, tylko przeskalowany.
 * Prostszy sposób (background-size + background-position) rozjeżdża się przy
 * object-cover: tło skaluje się inaczej niż kadrowany obrazek i lupa pokazuje
 * fragment obok tego, na który patrzysz. Powiększenie, które kłamie o tym, co
 * powiększa, jest gorsze niż jego brak.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Crosshair, Maximize2, X, ZoomIn } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SREDNICA = 168;
const POWIEKSZENIA = [2, 3.5, 6];

interface LupaProps {
    src: string;
    alt: string;
    /** Klasy dla ramy obrazu (rozmiar, zaokrąglenie). */
    className?: string;
    /** Musi być identyczne z tym, jak obraz jest kadrowany — inaczej lupa kłamie. */
    dopasowanie?: 'cover' | 'contain';
    /** Bez tego zostaje sama lupa; z tym klik otwiera pełny podgląd. */
    pelnyPodglad?: boolean;
}

export const Lupa: React.FC<LupaProps> = ({
    src,
    alt,
    className = 'w-full h-full',
    dopasowanie = 'cover',
    pelnyPodglad = true,
}) => {
    const { themeConfig } = useTheme();
    const ramaRef = useRef<HTMLDivElement | null>(null);
    const [nad, setNad] = useState(false);
    const [pkt, setPkt] = useState({ x: 0, y: 0 });
    const [rozmiar, setRozmiar] = useState({ w: 0, h: 0 });
    const [zoom, setZoom] = useState(3.5);
    const [otwarty, setOtwarty] = useState(false);

    const zmierz = useCallback(() => {
        const r = ramaRef.current?.getBoundingClientRect();
        if (r) setRozmiar({ w: r.width, h: r.height });
    }, []);

    useEffect(() => {
        zmierz();
        const ro = new ResizeObserver(zmierz);
        if (ramaRef.current) ro.observe(ramaRef.current);
        return () => ro.disconnect();
    }, [zmierz]);

    const ruch = (klientX: number, klientY: number) => {
        const r = ramaRef.current?.getBoundingClientRect();
        if (!r) return;
        setPkt({
            x: Math.max(0, Math.min(klientX - r.left, r.width)),
            y: Math.max(0, Math.min(klientY - r.top, r.height)),
        });
    };

    /**
     * ⚠️ ŚREDNICA DOPASOWUJE SIĘ DO KAFELKA, nie odwrotnie.
     *
     * Pierwsza wersja miała sztywne 168 px i próg „kadr musi mieć 1,2× tyle".
     * Zmierzone na żywej galerii: kafelek ma 229×172 px, czyli próg wypadał
     * powyżej wysokości kafelka i lupa NIE POKAZYWAŁA SIĘ ANI RAZU — dokładnie
     * tam, gdzie miała działać. Teraz soczewka zajmuje 80% krótszego boku,
     * maksymalnie 168 px, i znika dopiero przy naprawdę drobnych miniaturach.
     */
    const bok = Math.min(rozmiar.w, rozmiar.h);
    const srednica = Math.round(Math.max(90, Math.min(SREDNICA, bok * 0.8)));
    const zaMalo = rozmiar.w < 110 || rozmiar.h < 110;

    // Soczewka trzyma się wewnątrz kadru, żeby nie uciekała poza krawędź.
    const lx = Math.max(srednica / 2, Math.min(pkt.x, rozmiar.w - srednica / 2));
    const ly = Math.max(srednica / 2, Math.min(pkt.y, rozmiar.h - srednica / 2));

    const soczewka = (szer: number, wys: number, x: number, y: number, powiekszenie: number, d: number) => (
        <div
            className="absolute pointer-events-none z-30 rounded-full overflow-hidden"
            style={{
                width: d,
                height: d,
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 26px rgba(0,0,0,.95), 0 0 0 2px ${themeConfig.hex}`,
            }}
        >
            <img
                src={src}
                alt=""
                aria-hidden
                style={{
                    position: 'absolute',
                    width: szer * powiekszenie,
                    height: wys * powiekszenie,
                    // ⚠️ maxWidth:none — preflight Tailwinda wymusza max-width:100% na <img>
                    // i bez tego soczewka pokazywałaby obraz w skali 1:1, czyli nic.
                    maxWidth: 'none',
                    objectFit: dopasowanie,
                    left: -(pkt.x * powiekszenie - d / 2),
                    top: -(pkt.y * powiekszenie - d / 2),
                }}
            />
            {/* Celownik — ta sama mowa co w kartach szablonu */}
            <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${d} ${d}`}>
                <circle cx={d / 2} cy={d / 2} r="3" fill="none" stroke={themeConfig.hex} strokeWidth="1" />
                <path
                    d={`M${d / 2 - 18} ${d / 2} h10 M${d / 2 + 8} ${d / 2} h10
                        M${d / 2} ${d / 2 - 18} v10 M${d / 2} ${d / 2 + 8} v10`}
                    stroke={themeConfig.hex}
                    strokeWidth="1"
                    opacity="0.8"
                />
            </svg>
            <span className="absolute bottom-2 left-3 text-[9px] font-mono font-bold text-white drop-shadow">
                {powiekszenie}×
            </span>
        </div>
    );

    return (
        <>
            <div
                ref={ramaRef}
                onMouseEnter={() => setNad(true)}
                onMouseLeave={() => setNad(false)}
                onMouseMove={(e) => ruch(e.clientX, e.clientY)}
                onTouchStart={(e) => { setNad(true); if (e.touches[0]) ruch(e.touches[0].clientX, e.touches[0].clientY); }}
                onTouchMove={(e) => { if (e.touches[0]) ruch(e.touches[0].clientX, e.touches[0].clientY); }}
                onTouchEnd={() => setNad(false)}
                onClick={() => pelnyPodglad && setOtwarty(true)}
                className={`relative overflow-hidden select-none ${pelnyPodglad ? 'cursor-zoom-in' : 'cursor-crosshair'} ${className}`}
            >
                <img src={src} alt={alt} loading="lazy" className="w-full h-full" style={{ objectFit: dopasowanie }} />

                {/* ⚠️ Przy małej miniaturze soczewka zasłoniłaby cały kadr — wtedy jej nie ma,
                    a zamiast niej zachęta do pełnego podglądu. */}
                {nad && !zaMalo && rozmiar.w > 0 && soczewka(rozmiar.w, rozmiar.h, lx, ly, zoom, srednica)}

                {nad && !zaMalo && (
                    <div className="absolute bottom-2 left-2 z-40 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-mono text-neutral-300 backdrop-blur-sm">
                        <Crosshair className="w-2.5 h-2.5" style={{ color: themeConfig.hex }} />
                        <span>X:{Math.round(pkt.x)} Y:{Math.round(pkt.y)}</span>
                    </div>
                )}

                {!nad && !zaMalo && (
                    <div aria-hidden className="absolute bottom-2 right-2 z-40 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-mono text-neutral-400">
                        <ZoomIn className="w-2.5 h-2.5" /> lupa
                    </div>
                )}

                {/*
                  ⚠️ OSOBNY PRZYCISK, NIE KLIK W KAFELEK.
                  Na kafelkach galerii klik prowadzi do kolejnej tafli (karta koncepcji),
                  więc pełny podgląd nie może przejmować całego obrazka. Bez tego przycisku
                  „powiększ, żeby zobaczyć z bliska" nadal byłoby niewykonalne — a to była
                  cała prośba. stopPropagation pilnuje, żeby jedno nie zjadało drugiego.
                */}
                <button
                    type="button"
                    title="Powiększ na pełny ekran"
                    onClick={(e) => { e.stopPropagation(); setOtwarty(true); }}
                    className="absolute top-2 right-2 z-40 rounded bg-black/70 p-1 text-neutral-300 opacity-80 transition-all hover:bg-black hover:text-white hover:opacity-100"
                >
                    <Maximize2 className="w-3 h-3" />
                </button>
            </div>

            {otwarty && <PelnyPodglad src={src} alt={alt} zoom={zoom} setZoom={setZoom} zamknij={() => setOtwarty(false)} />}
        </>
    );
};

/**
 * Pełny podgląd — to jest odpowiedź na „nie da się powiększyć, żeby zobaczyć z bliska".
 *
 * ⚠️ Obraz jest tu w object-contain, czyli CAŁY, bez kadrowania. Miniatura w galerii
 * jest przycięta (cover) i łatwo uwierzyć, że kadr tak właśnie wygląda.
 */
const PelnyPodglad: React.FC<{
    src: string; alt: string; zoom: number;
    setZoom: (z: number) => void; zamknij: () => void;
}> = ({ src, alt, zoom, setZoom, zamknij }) => {
    const { themeConfig } = useTheme();
    const ramaRef = useRef<HTMLDivElement | null>(null);
    const [nad, setNad] = useState(false);
    const [pkt, setPkt] = useState({ x: 0, y: 0 });
    const [rozmiar, setRozmiar] = useState({ w: 0, h: 0 });

    useEffect(() => {
        const naKlawisz = (e: KeyboardEvent) => { if (e.key === 'Escape') zamknij(); };
        window.addEventListener('keydown', naKlawisz);
        // Tło nie ma się przewijać pod otwartym podglądem.
        const bylo = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', naKlawisz);
            document.body.style.overflow = bylo;
        };
    }, [zamknij]);

    const zmierz = () => {
        const r = ramaRef.current?.getBoundingClientRect();
        if (r) setRozmiar({ w: r.width, h: r.height });
    };

    const ruch = (kx: number, ky: number) => {
        const r = ramaRef.current?.getBoundingClientRect();
        if (!r) return;
        setPkt({ x: Math.max(0, Math.min(kx - r.left, r.width)), y: Math.max(0, Math.min(ky - r.top, r.height)) });
    };

    const lx = Math.max(SREDNICA / 2, Math.min(pkt.x, rozmiar.w - SREDNICA / 2));
    const ly = Math.max(SREDNICA / 2, Math.min(pkt.y, rozmiar.h - SREDNICA / 2));

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-4 sm:p-8"
            onClick={zamknij}
        >
            <div className="mb-3 flex w-full max-w-5xl items-center justify-between gap-3">
                <span className="truncate text-xs font-mono text-neutral-300">{alt}</span>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-mono uppercase text-neutral-500">lupa:</span>
                    {POWIEKSZENIA.map((p) => (
                        <button
                            key={p}
                            onClick={() => setZoom(p)}
                            className="rounded px-1.5 py-0.5 text-[11px] font-mono transition-colors"
                            style={zoom === p
                                ? { backgroundColor: themeConfig.subtleHex, color: themeConfig.hex, border: `1px solid ${themeConfig.borderHex}` }
                                : { color: '#a3a3a3', border: '1px solid transparent' }}
                        >
                            {p}×
                        </button>
                    ))}
                    <button onClick={zamknij} className="ml-1 rounded p-1 text-neutral-400 transition-colors hover:text-white" title="Zamknij (Esc)">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div
                ref={ramaRef}
                onClick={(e) => e.stopPropagation()}
                onLoad={zmierz}
                onMouseEnter={() => { setNad(true); zmierz(); }}
                onMouseLeave={() => setNad(false)}
                onMouseMove={(e) => ruch(e.clientX, e.clientY)}
                onTouchStart={(e) => { setNad(true); zmierz(); if (e.touches[0]) ruch(e.touches[0].clientX, e.touches[0].clientY); }}
                onTouchMove={(e) => { if (e.touches[0]) ruch(e.touches[0].clientX, e.touches[0].clientY); }}
                className="relative max-h-[80vh] w-full max-w-5xl cursor-crosshair overflow-hidden rounded-lg"
            >
                <img src={src} alt={alt} onLoad={zmierz} className="max-h-[80vh] w-full object-contain" />

                {nad && rozmiar.w > 0 && (
                    <div
                        className="pointer-events-none absolute z-30 overflow-hidden rounded-full"
                        style={{
                            width: SREDNICA, height: SREDNICA, left: lx, top: ly,
                            transform: 'translate(-50%, -50%)',
                            boxShadow: `0 0 26px rgba(0,0,0,.95), 0 0 0 2px ${themeConfig.hex}`,
                        }}
                    >
                        <img
                            src={src} alt="" aria-hidden
                            style={{
                                position: 'absolute',
                                width: rozmiar.w * zoom, height: rozmiar.h * zoom,
                                maxWidth: 'none', objectFit: 'contain',
                                left: -(pkt.x * zoom - SREDNICA / 2),
                                top: -(pkt.y * zoom - SREDNICA / 2),
                            }}
                        />
                        <span className="absolute bottom-2 left-3 text-[9px] font-mono font-bold text-white drop-shadow">{zoom}×</span>
                    </div>
                )}
            </div>

            <p className="mt-3 text-[10px] font-mono text-neutral-500">
                Rusz myszą po obrazie, żeby użyć lupy · Esc albo klik w tło zamyka
            </p>
        </div>,
        document.body,
    );
};
