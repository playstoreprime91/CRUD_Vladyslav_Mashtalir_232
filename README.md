# Encja CRUD — frontend only (Supabase) — A + B

Zawiera proste SPA (HTML, CSS, script.js) które implementuje CRUD nad encją `entities` korzystając z Supabase (Postgres + auto REST + JS client).

## Co jest w repo
- `index.html` — główny plik (UI). W nim do uzupełnienia: SUPABASE_URL i SUPABASE_ANON_KEY w `script.js`.
- `script.js` — logika: listowanie, tworzenie, edycja, usuwanie; walidacja prosta po stronie klienta.
- `styles.css` — proste style.
- `migration.sql` — migracja SQL (zawarta poniżej) i ALTER dla etapu B.
- `README.md` — to co czytasz.

## Model encji (wymagania A i B)
Finalna tabela `entities` (po A + B) ma pola:
- `id` — serial PRIMARY KEY
- `title` — text NOT NULL  (A)
- `amount` — numeric NOT NULL  (A)
- `description` — text NULL  (A)
- `created_at` — timestamptz DEFAULT now()  (A)
- `status` — text NULL  (B)   -- dodane w etapie B
- `due_date` — date NULL  (B)  -- dodane w etapie B

## Migracja SQL (użyj w SQL editorze Supabase lub w narzędziu migracji)
-- migration A (initial)
```sql
CREATE TABLE public.entities (
  id serial PRIMARY KEY,
  title text NOT NULL,
  amount numeric NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

-- migration B (dodanie 2 pól)
```sql
ALTER TABLE public.entities
  ADD COLUMN status text,
  ADD COLUMN due_date date;
```

## Jak uruchomić (lokalnie / w labie)
1. Załóż projekt w Supabase (https://app.supabase.com).
2. W zakładce SQL wykonaj migrację A SQL (wyżej). Możesz od razu wykonać też ALTER B albo w osobnym kroku.
3. W zakładce `Settings → API` skopiuj `URL` (twoj_project.supabase.co) i anon public key (ANON KEY).
4. Otwórz `script.js` i zamień wartości `SUPABASE_URL` i `SUPABASE_ANON_KEY`.
   - **Uwaga:** anon key pozwala na publiczne odczyty/zapisy w zależności od RLS. Dla testów w labie możesz wyłączyć RLS albo dodać reguły.
5. Otwórz `index.html` w przeglądarce (możesz też użyć prostego serwera `python -m http.server`).

## Endpoints (Supabase REST / PostgREST)
Supabase exposeuje REST dla tabeli `entities`:
- GET `/rest/v1/entities` — lista (obsługa filtrów via query)
- GET `/rest/v1/entities?id=eq.1` — pojedynczy (lub użyj `.single()` w JS)
- POST `/rest/v1/entities` — tworzenie (JSON body)
- PATCH `/rest/v1/entities?id=eq.1` — aktualizacja
- DELETE `/rest/v1/entities?id=eq.1` — usuwanie

W praktyce `script.js` korzysta z oficjalnego klienta JS (`@supabase/supabase-js`).

## Walidacja i kody HTTP
- Walidacja podstawowa po stronie klienta: `title` wymagany, `amount` musi być liczbą.
- Supabase (backend) zwraca standardowe kody HTTP z PostgREST (200/201/204/4xx w razie błędów). W razie potrzeby w README projektu możesz dodać dodatkową warstwę backendową.

## Acceptacja (co zrobić, by spełnić kryteria)
- Umieść pliki `index.html`, `script.js`, `styles.css`, `README.md` w katalogu projektu.
- Utwórz PR opisujący co zrobiłeś:
  - W sekcji A: opisz model i migrację A.
  - W sekcji B: opisz dodatkowe pola (`status`, `due_date`) oraz migration B (ALTER).
  - Instrukcję testowania: jak uzupełnić SUPABASE_URL/KEY, jak uruchomić i szybki smoke-test.
  - Dodaj zrzut ekranu UI (wykonać lokalnie i dodać obraz).
- Krótki smoke-test: dodaj encję, edytuj, usuń, sprawdź listę partnera — upewnij się, że nie psujesz ich danych (testuj na swoim projekcie Supabase).

## Dodatkowe uwagi bezpieczeństwa
- Nie publikuj anon key w publicznych repo bez RLS i ograniczeń. Dla labu przyjmij, że repo jest prywatne lub użyj tymczasowego projektu Supabase.

---

Dalsze instrukcje lub generowanie GIF/obrazka z UI mogę zrobić jeśli chcesz — ale zgodnie z Twoim wymaganiem zostawiam prostą paczkę plików (HTML/JS/CSS/README/migration).
