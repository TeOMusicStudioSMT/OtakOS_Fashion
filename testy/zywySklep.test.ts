// 🔄 Żywa paczka sklepu: postać z opisu motywu, tylko „gotowe”, najnowsza wersja fasonu+koloru idzie do sklepu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zywePostacie, imieKolekcji, CENNIK_0G, type Kolekcja } from '../kolekcje';

const k = (id: string, motyw: string, ubior: string, kiedy: string, stan: 'gotowa' | 'szkic' = 'gotowa', kolor = 'czarny') =>
    ({ id, obraz: 'm', opisMotywu: motyw, ubior, kolor, uklad: 'plakat', tekst: { tytul: id }, strefy: {}, stan, kiedy }) as Kolekcja;
const BOROWIK = 'Mini-TeOgochi „Borowik”: Malutki stwork z korzonka', KORALIK = 'Mini-TeOgochi „Koralik”: Mały stadek';

test('imię postaci z opisu motywu, wielka litera', () => {
    assert.equal(imieKolekcji({ opisMotywu: BOROWIK }), 'Borowik');
    assert.equal(imieKolekcji({ opisMotywu: 'Mini-TeOgochi "KORALIK": x' }), 'Koralik');
});

test('żywe postacie: szkice poza sklepem, z dwóch wersji fasonu najnowsza, inny kolor = osobny produkt', () => {
    const p = zywePostacie([
        k('k-1', BOROWIK, 'kurtka', '2026-11-05T10:00:00Z'), k('k-2', BOROWIK, 'kurtka', '2026-11-06T10:00:00Z'),
        k('k-3', BOROWIK, 'kurtka', '2026-11-06T11:00:00Z', 'gotowa', 'bialy'), k('k-4', BOROWIK, 'bluza', '2026-11-07T10:00:00Z', 'szkic'),
        k('k-5', KORALIK, 'kurtka', '2026-11-07T09:00:00Z'),
    ]);
    assert.deepEqual(p.map((x) => x.imie), ['Borowik', 'Koralik']);
    assert.deepEqual(p[0].aktualne.map((x) => x.id).sort(), ['k-2', 'k-3']);
    assert.deepEqual(p[0].starsze.map((x) => x.id), ['k-1']);
    assert.equal(p[1].katalog, 'koralik');
    assert.equal(CENNIK_0G.kurtka, 119);
});
