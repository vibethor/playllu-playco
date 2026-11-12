# UPSTREAM — what Playco took from HrajFotbal

Playco is a fork of the HrajFotbal app (`reneomuller/hrajfotbalek`). It shares no database, deploy or account with it.
This file is the only link between the two codebases: the commit we forked from and every fix ported since.

## Fork point

| | |
|---|---|
| Repository | `reneomuller/hrajfotbalek` |
| Commit | `a35c5efbcc5510ede29885378b65b96bc6128056` (11 Nov 2026, "games.spec: paired test games at midday") |
| Imported as | the first commit of this repo, unchanged |
| History | HrajFotbal's plans, rulings and logs are in `docs/upstream/` verbatim — read them for *why* the code is the way it is |

## Mechanical differences (scripted)

1. **CZK → THB in every name** — `node scripts/fork/rename-currency.mjs`. Columns (`price_czk` → `price_thb`), functions,
   metadata keys, TypeScript identifiers, display text. Names only: amounts and payment wording are changed by hand.

## Porting a fix from HrajFotbal

1. Find the upstream commit; note it in the table below before you start.
2. Copy the changed files (a new migration gets a Playco timestamp, never the upstream one).
3. Run `node scripts/fork/rename-currency.mjs <the copied files>`.
4. Re-apply Playco's Bangkok changes the fix touches (prices, payments, copy), then run every test.

## Ported fixes

| Upstream commit | What | Playco commit |
|---|---|---|
| — | — | — |
