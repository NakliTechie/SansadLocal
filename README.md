# SansadSaar

> Browse, search, and summarise India's parliamentary record — privately, in your browser.

**[Live →](https://sansadsaar.naklitechie.com)** · **[User guide →](https://sansadsaar.naklitechie.com/guide/)**

No accounts. No keys required. No data leaves your device.

![SansadSaar main view](guide/img/01-overview.jpg)

## What it does

Three corpora live, more in the pipeline. Each lands as a chip in the top chrome; switch between them, search within each, summarise individual documents with on-device or BYOK AI.

| Macro group | Corpus | Live | Source |
|---|---|---|---|
| Oversight | **DRSC reports** — Departmentally Related Standing Committees, 24 of them, ~14,700 reports across LS14–18 | ✅ | sansad.in |
| Oversight | **CAG audit reports** — Comptroller and Auditor General audits across Union, State, and Local Bodies | ✅ | cag.gov.in |
| Legislation | **Bills** — every bill introduced in Indian Parliament, ~9,900 records 1952→2026 with full status timeline + per-stage PDFs (intro / LS-passed / RS-passed / both / errata / synopsis / committee report / gazette) | ✅ | sansad.in |
| Legislation | Law Commission reports | planned (v1.2) | lawcommissionofindia.nic.in |
| Floor | Speeches (Hansard) | planned (v1.1.b) | sansad.in |
| Floor | Questions (starred + unstarred) | planned (v1.1.c) | sansad.in |
| Oversight | Financial Committee reports (PAC / Estimates / Public Undertakings) | planned (v1.2) | sansad.in |
| Executive | Gazette notifications | planned (v1.2) | archive.org `gazetteofindia` |

For each live corpus:

- **Browse** — sortable, filterable list of every record. Filters adapt per corpus (committee + Lok Sabha for DRSC; gov-type + audit-type + sector for CAG; status + bill-type + category + house + year for Bills).
- **Search** — title scan is always-on. **Deep search** (per-corpus, opt-in) loads a sharded body-token index covering the full text of every record with extracted text, lets you find phrases anywhere in the corpus.
- **AI summary** — one click → plain-English structured briefing. Cached locally per record.
- **Ask** — chat with one record. Your question + the record text + your cached summary go to the AI of your choice. Per-record Q&A history persists across sessions.
- **Web search enrichment** (optional) — Tavily / Brave / SearXNG feed recent web context into Ask.
- **Export** — filtered metadata as CSV, generated summaries as Markdown.

## Why

Indian Parliament publishes immense documentary output — committee scrutiny of the executive, legislative bills, Comptroller-General audits, daily floor speeches, parliamentary questions, gazette notifications. All public. All poorly indexed. All rarely read. SansadSaar fixes the discovery layer (a single browsable, searchable, filter-able view across corpora); AI fixes the skim layer (plain-English summaries + chat); both happen on your machine.

DRSC committees are the institutional mechanism through which Parliament scrutinises the executive. CAG audits are the financial-accountability layer. Bills are how law is made. Each is its own corpus; SansadSaar puts them on the same surface.

## Privacy model

| What | Where it lives | Leaves the browser? |
|------|----------------|---------------------|
| API keys (if set) | `localStorage` | Only to the provider you picked |
| Generated AI summaries | IndexedDB (`summaries`) | No |
| Per-report chat threads | IndexedDB (`chats`) | No |
| Extracted PDF text | IndexedDB (`texts`) | No |
| Model weights | Cache Storage | One-time download from Hugging Face |
| Static report data | IndexedDB (`blobs`) | One-time fetch from GitHub Pages mirror |

No analytics, no accounts, no telemetry, no SansadSaar server (we don't have one). The page is a static `index.html`.

## AI options

Two modes, picked in **Settings**:

**Local AI** (default, free, no key) — runs entirely on your GPU via [Transformers.js](https://huggingface.co/docs/transformers.js) + WebGPU. Five models supported:

| Model | Download | Notes |
|-------|---------:|-------|
| Gemma 4 E2B | ~1.5 GB | Default. Good balance. |
| Gemma 4 E4B | ~4.9 GB | Stronger summaries. |
| Ternary Bonsai 1.7B | ~470 MB | Smallest. Quick first-run. |
| Ternary Bonsai 4B | ~1.1 GB | Sweet spot. |
| Ternary Bonsai 8B | ~2.2 GB | 64K context. |

**BYOK** — plug in your own key for Anthropic, OpenAI, Gemini, Groq, OpenRouter, Ollama, or any OpenAI-compatible endpoint. **Free tiers**: Gemini (15 RPM, 1M tokens/day), Groq (~30 RPM, fast), OpenRouter (`:free` models), Ollama (fully local). Costs of paid tiers documented in the [user guide](https://sansadsaar.naklitechie.com/guide/#costs).

## Architecture

| Layer        | Where it lives                                                                 |
| ------------ | ------------------------------------------------------------------------------ |
| Data scrape  | [`NakliTechie/parliamentwatch-data`](https://github.com/NakliTechie/parliamentwatch-data) — independent scrapers per corpus (DRSC every 4h, CAG daily + hourly backfill + weekly OCR, Bills daily + 4-hourly backfill). One scheduled GitHub Action per scraper; commits flow to the mirror repo. |
| Data hosting | Static assets served at `sansadsaar-data.naklitechie.com` with CORS. Each corpus's outputs live under `docs/<corpus>/`. Indices, search bundles, and body-token indices are sharded by sorted-key range for parallel app fetch. |
| App          | This repo — corpus-module pattern. `app/shell.js` (registry, AI worker, chip switcher, settings, JS API) + `app/corpora/<id>/index.js` per corpus. Single `index.html`, no build step. |
| AI inference | Transformers.js v4 on WebGPU, or any OpenAI- / Anthropic-compatible API. |

The two-repo split exists because the upstream sources (`sansad.in`, `cag.gov.in`) block cross-origin browser fetches. The mirror runs scraping server-side and re-publishes as static files; the browser app stays purely a presentation layer.

**Independence Principle.** Each corpus's scraper is its own subfolder + own GH Actions workflow + own concurrency group, no shared Python state. Each corpus's app module is its own file in `app/corpora/<id>/`, no imports across corpora. A broken scraper means one corpus's chip shows "stale" — never an app-wide outage.

## Credit

Built on top of [**ParliamentWatch**](https://github.com/pranaykotas/parliamentwatch) by **Pranay Kotasthane**. The scraping logic, committee API map, and the original idea are his — SansadSaar repackages it as a single HTML file with on-device AI. Full credit list in the in-app Help → Credits tab.

## Local dev

```bash
python3 -m http.server 8000
```

Pass `?data=URL` to override the data mirror (e.g. `?data=/parliamentwatch-data/docs/` against a sibling local checkout of the mirror repo).

## License

MIT — see [LICENSE](LICENSE).

---

Part of the [NakliTechie](https://naklitechie.github.io/) browser-native series.
