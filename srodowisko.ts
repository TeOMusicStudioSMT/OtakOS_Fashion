/**
 * 🌱 Środowisko — JEDYNE zadanie tego modułu: wczytać `.env`, ZANIM obudzi się jakikolwiek inny.
 *
 * Dlaczego osobny plik: importy modułów wykonują się w kolejności, w jakiej stoją, i WSZYSTKIE
 * przed pierwszą instrukcją pliku. `dotenv.config()` wywołane w środku `server.ts` działo się
 * więc PO tym, jak `teoshop.ts` policzył już swoje stałe z `process.env` — i podglądy sklepowe
 * cicho lądowały w katalogu zapasowym studia zamiast w repozytorium portalu (2026-11-19).
 *
 * `server.ts` importuje ten moduł jako PIERWSZY. Nie dopisuj tu niczego poza wczytaniem `.env`.
 */
import dotenv from 'dotenv';

dotenv.config();
