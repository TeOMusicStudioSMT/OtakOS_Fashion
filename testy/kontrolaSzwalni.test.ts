// 🧵 QC szwalni na sztucznych makietach: korpus + dwa rękawy na jasnoszarym tle, torba z uchwytem.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { maskaUbioru, obszarStrefy, dopasuj, odcisk, poza, pngZDpi, kadrGrafiki, type Obraz } from '../kontrolaSzwalni.ts';

/** Kadr 200×200: tło (215,216,218), prostokąty materiału w podanej barwie. */
function kadr(prostokaty: [number, number, number, number, [number, number, number]][]): Obraz {
    const w = 200, h = 200, px = new Uint8Array(w * h * 3);
    for (let j = 0; j < w * h; j++) px.set([215, 216, 218], j * 3);
    for (const [x0, y0, x1, y1, c] of prostokaty) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) px.set(c, (y * w + x) * 3);
    return { w, h, px, kanaly: 3 };
}
const KREM: [number, number, number] = [229, 227, 216], CZARNY: [number, number, number] = [20, 20, 22];
// kurtka: czarny korpus 60–140 (y 30–180), kremowe rękawy od barku w dół (y 55–170), przylegają do korpusu
const kurtka = () => kadr([[60, 30, 140, 180, CZARNY], [30, 55, 60, 170, KREM], [140, 55, 170, 170, KREM]]);
const pelny = (n = 10) => odcisk({ w: n, h: n, px: new Uint8Array(n * n * 4).fill(255), kanaly: 4 });

test('maska: kremowy rękaw na szarym tle to materiał (barwa ciepła vs chłodna)', () => {
    const m = maskaUbioru(kurtka());
    assert.equal(m.m[100 * 200 + 45], 1, 'kremowy rękaw');
    assert.equal(m.m[100 * 200 + 10], 0, 'tło');
    assert.equal(m.m[100 * 200 + 100], 1, 'korpus');
});

test('rękaw: naszywka wystająca w tło wraca na rękaw, nie ucieka na korpus; ≤ 60% przekroju', () => {
    const m = maskaUbioru(kurtka()), dozw = obszarStrefy(m, 'kurtka', 'rekaw-p-1', true);
    const o = pelny(), start = { x: 0.15, y: 0.5, w: 0.12 };   // środek x=30 px = krawędź rękawu, szer. 24 px > 60% z 30
    assert.ok(poza(dozw, o, start, 1) > 0);
    const q = dopasuj(dozw, m, o, 1, 'rekaw-p-1', start);
    assert.notEqual(q.zmiana, 'nie-miesci');
    assert.ok(q.po.w <= 0.6 * (30 / 200) + 1e-9, `szerokość ${q.po.w}`);
    assert.ok((q.po.x + q.po.w / 2) * 200 <= 60, 'nie wchodzi na korpus');
    assert.equal(poza(dozw, o, q.po, 1), 0);
});

test('plecy: grafika w korpusie, nad dolnym ściągaczem, bez rękawów', () => {
    const m = maskaUbioru(kurtka()), dozw = obszarStrefy(m, 'kurtka', 'tyl');
    const q = dopasuj(dozw, m, pelny(), 1, 'tyl', { x: 0.5, y: 0.6, w: 0.7 });
    assert.equal(q.zmiana, 'zmniejszona');
    const px0 = (q.po.x - q.po.w / 2) * 200, px1 = (q.po.x + q.po.w / 2) * 200, dol = (q.po.y + q.po.w / 2) * 200;
    assert.ok(px0 >= 60 && px1 <= 140, `boki ${px0}–${px1}`);
    assert.ok(dol <= 30 + 0.84 * 150 + 1, `dół ${dol}`);
});

test('torba: emblemat z uchwytu schodzi na korpus', () => {
    // uchwyt 120–130 × 20–80, korpus 40–160 × 80–190
    const m = maskaUbioru(kadr([[120, 20, 130, 80, CZARNY], [40, 80, 160, 190, CZARNY]])), dozw = obszarStrefy(m, 'torba', 'przod');
    const q = dopasuj(dozw, m, pelny(), 1, 'przod', { x: 0.625, y: 0.3, w: 0.1 });
    assert.notEqual(q.zmiana, 'nie-miesci');
    assert.ok((q.po.y - q.po.w / 2) * 200 >= 80, 'nad korpusem nic');
});

test('kadr grafiki i PNG z pHYs 300 DPI', () => {
    const a = new Uint8Array(10 * 10 * 4); for (let y = 2; y < 6; y++) for (let x = 3; x < 9; x++) a[(y * 10 + x) * 4 + 3] = 255;
    assert.deepEqual(kadrGrafiki({ w: 10, h: 10, px: a, kanaly: 4 }), { x0: 0.3, y0: 0.2, x1: 0.9, y1: 0.6 });
    // najmniejszy PNG 1×1
    const png = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082', 'hex');
    const z = pngZDpi(png, 300), i = z.indexOf('pHYs');
    assert.ok(i > 0); assert.equal(z.readUInt32BE(i + 4), 11811); assert.equal(z[i + 12], 1);
});
