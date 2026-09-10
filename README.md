# 👗 OtakOS Fashion — katalog główny

Katalog materiału dla **działu mody** Katedry OtakOS. Na razie to nie aplikacja,
tylko **magazyn z indeksem** — dach nad materiałem, który już istnieje, żeby nie
leżał luzem w projekcie filmowym, do którego nie pasuje.

## Co tu leży

```
OtakOs_Fashion/
├── README.md                        ← ten plik
├── katalog.json                     ← indeks: plik → tytuł, opis, wymiary, data
└── katalog/
    └── sollet-kadry-2026-09-09/     ← 62 klatki (61 × 960×544, 1 × 704×480)
```

`katalog.json` trzyma przy każdej pozycji **tytuł i opis karty**, z której powstała
— nie samą nazwę pliku. Dzięki temu wiadomo, co jest na obrazie, bez otwierania
sześćdziesięciu dwóch plików.

## Skąd się wziął ten materiał

Powstał jako **klatki kluczowe do serialu SOLLET** — etap KADR, silnik Wan 2.2
TI2V-5B w ComfyUI, jedna klatka na kadr (`length: 1`), 20–26 s na sztukę.

⚠️ **Nie jest to materiał odrzucony jako zły.** Rozjechał się wymiar: SOLLET jedzie
do końca w 704×480, a te klatki wyszły w 960×544. Sklejka plików o różnych wymiarach
nie idzie bezstratnie, więc do tamtego filmu nie wrócą. Jako materiał sam w sobie są
w porządku — i to w wyższej rozdzielczości niż reszta projektu.

Jedna pozycja odstaje (704×480) — to klatka z testu potoku, zostawiona dla kompletu
i opisana w indeksie.

## Czego tu NIE MA i o czym warto wiedzieć

- **Nie ma kodu.** Kiedy dział mody zacznie budować aplikację, jej miejsce jest tutaj,
  obok `katalog/` — tak jak `TeO_Genesis`, `TeO_Story_V2` i `TeO_Music_V2` stoją obok
  siebie w `ToO APP/`.
- **Nie ma opisu ubioru per klatka.** Opisy w `katalog.json` pochodzą z kart
  produkcyjnych i mówią o scenie, nie o stroju. Gdy przyjdzie na to pora, opisy
  ubioru potrafi napisać **Oko** (`services/Oko.js` w TeO_Genesis, model `qwen3.5:9b`)
  — patrzy na obraz i pisze, co widzi, około 25–30 s na sztukę.
- **Nie ma niczego wpiętego w most.** Żadna trasa `/api/*` tego katalogu jeszcze nie
  obsługuje. To świadome: dopóki nie wiadomo, czym ma być OtakOS Fashion, trasa
  byłaby zgadywaniem.

## Skąd i dokąd

Karty produkcyjne, z których powstały te klatki, **wróciły na etap KADR** w projekcie
SOLLET — zostaną policzone ponownie w 704×480, zgodnie z decyzją o wymiarze tamtego
serialu. Ten katalog niczego SOLLET nie zabiera.
