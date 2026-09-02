# Local webfonts

- [Grenze Gotisch](https://github.com/Omnibus-Type/Grenze-Gotisch), variable weight 100–900: English display titles and the MÖRK BORG wordmark. Blackletter capitals and restrained lowercase details provide the medieval character.
- [Alegreya](https://github.com/google/fonts/tree/main/ofl/alegreya), variable weight 400–900, normal and italic: English prose and compact record titles.
- [Pretendard Variable](https://github.com/orioncactus/pretendard), weight 100–900, v1.3.9: Hangul, controls, labels and numeric readouts.
- Barlow Condensed Black is retained as a previous local asset, but no longer selected by the stylesheet.

Official, unmodified font files are served locally; there are no external font requests at runtime. Their SIL Open Font Licenses are included alongside the files. Alegreya's FONTLOG is also included.

The new Latin fonts' Unicode cmap was checked for MÖRK BORG, Kergüs, Wästland, Sigfúm, Hervör, ö ä ü ú Ä Ö Ü, combining diaeresis U+0308 and combining acute U+0301. All are present in both families and Alegreya Italic. Hangul falls back to Pretendard rather than being synthesized from a Latin display face.
