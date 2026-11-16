-- =============================================================================
-- PLAYCO — "language on the court" for Bangkok (approved by Jachym, 16 Nov 2026).
--
-- HrajFotbal stored which languages a game is run in as a pair code and allowed exactly two: `en-cs` and `uk-ru`.
-- Bangkok games are run in English, Thai, or both.
--
-- 1. The catalogue gains `en`, `th` and `en-th`. The two old codes stay valid so history keeps its meaning; the
--    admin form no longer offers them.
-- 2. The column default becomes `en-th`.
-- 3. `set_game_language` is restated in place to accept the new catalogue (read the installed definition, replace
--    its one check, raise if the text is not what was expected). CREATE OR REPLACE keeps its grants.
-- 4. Existing `en-cs` games move to `en-th`: a Bangkok game was never run in Czech, and the card would otherwise show
--    a Czech flag. `uk-ru` rows are left alone.
--
-- The organiser contact only switches to Telegram for `uk-ru` (lib/games/language.ts), so every Bangkok game keeps
-- using WhatsApp. Idempotent; verified at the foot.
-- =============================================================================

alter table public.games drop constraint if exists games_language_catalog;
alter table public.games add constraint games_language_catalog check (
  language in ('en-cs', 'uk-ru', 'en', 'th', 'en-th')
);
alter table public.games alter column language set default 'en-th';

comment on column public.games.language is
  'Which languages this game is run in: en-th (English and Thai), en (English), th (Thai). The HrajFotbal codes '
  'en-cs and uk-ru remain valid for history. Drives the flags on the game card; uk-ru alone switches the organiser '
  'contact to Telegram.';

do $$
declare
  v_def text;
  v_old constant text := 'p_language not in (''en-cs'', ''uk-ru'')';
  v_new constant text := 'p_language not in (''en-cs'', ''uk-ru'', ''en'', ''th'', ''en-th'')';
begin
  select pg_get_functiondef('public.set_game_language(uuid, text)'::regprocedure) into v_def;
  if position(v_new in v_def) > 0 then
    raise notice 'court languages: set_game_language already accepts the Bangkok codes';
  elsif position(v_old in v_def) = 0 then
    raise exception 'court languages: set_game_language does not carry the expected check';
  else
    execute replace(v_def, v_old, v_new);
  end if;
end $$;

update public.games set language = 'en-th' where language = 'en-cs';

do $$
begin
  if (select pg_get_functiondef('public.set_game_language(uuid, text)'::regprocedure))
     not like '%''en-th''%' then
    raise exception 'court languages: set_game_language still refuses en-th';
  end if;
  if exists (select 1 from public.games where language = 'en-cs') then
    raise exception 'court languages: an en-cs game is left';
  end if;
  if (select column_default from information_schema.columns
       where table_schema = 'public' and table_name = 'games' and column_name = 'language') <> '''en-th''::text' then
    raise exception 'court languages: the default is not en-th';
  end if;
end $$;
