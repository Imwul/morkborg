# Local webfonts

The editorial Reference Desk uses local fonts distributed under the SIL Open Font License 1.1. Their license files are included here. No external font request is made at runtime.

| Font          | Role                                                                   | Files / license                                                                   | Official source                                                          |
| ------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Song Myung    | Korean display titles; 400                                             | `SongMyung-Regular.woff2`, `SongMyung-OFL.txt`                                    | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/songmyung)  |
| Hahmlet       | Korean body, translations, tables and controls; 100–900                | `Hahmlet-Variable.woff2`, `Hahmlet-OFL.txt`                                       | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/hahmlet)    |
| SUIT Variable | Latin body, tables and controls; 100–900                               | `SUIT-Variable.woff2`, `SUIT-OFL.txt`                                             | [sun-typeface/SUIT](https://github.com/sun-typeface/SUIT)                |
| Pirata One    | Latin reference names, results and wordmark; 400                       | `PirataOne-Regular.ttf`, `pirataone-OFL.txt`                                      | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/pirataone)  |
| Bodoni Moda   | Latin cover, rules and editorial headings; regular and italic, 400–900 | `BodoniModa-Variable.ttf`, `BodoniModa-Italic-Variable.ttf`, `bodonimoda-OFL.txt` | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/bodonimoda) |
| Space Mono    | Formulas, dice values and compact Latin labels; 700                    | `SpaceMono-Bold.ttf`, `spacemono-OFL.txt`                                         | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/spacemono)  |

Song Myung and Hahmlet follow the Korean title/body pairing observed on [Gloam](https://gloam-cyan.vercel.app), as requested. Their CSS faces use a Korean/CJK unicode range to preserve the existing Latin composition. Font synthesis is disabled so unavailable styles are not artificially generated.

## Korean font packaging

The official complete TTF files were losslessly packaged as WOFF2 with fontTools 4.65.0 and Brotli 1.2.0; no glyph subsetting. Verified identical cmap records, names, glyph order, outlines and horizontal metrics. Hahmlet retains its variable weight axis (100–900, default 400) and variation data. Only empty DSIG tables with zero signatures were omitted by the converter.

| Font       | Glyphs / cmap | WOFF2 bytes | SHA-256                                                            |
| ---------- | ------------- | ----------: | ------------------------------------------------------------------ |
| Song Myung | 2,617 / 2,615 |     315,976 | `161b506c208e55e1e7f7ed12885fbe773d80eb6f44e20989404d2f0cb51a9a31` |
| Hahmlet    | 3,998 / 3,607 |     697,656 | `c3f688f4fbe85e604f8a437e82e8ed6e9a489202538a55e985b8685d63802375` |

Earlier Barlow Condensed, Pretendard, Alegreya and Grenze Gotisch assets remain for compatibility with existing exports and older stylesheets. The active publication font tokens use the families above.
