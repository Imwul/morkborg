# Home and immediately readable Korean

Baseline: `f2c514454dad013ea4f131c849b2cd111a1e2809`.

The current 360, 1440 and 3440 px browser views were captured before editing (`outputs/home-bilingual/before-*.png`, private QA images excluded from Git).

| Surface | Primary | Secondary | Observed problem | Change |
| --- | --- | --- | --- | --- |
| Dungeon dossier | Generated English fragment | Adjacent Korean helper | All nine populated fixture fields have zero translations in reading mode. `Field` gates translation on `editing`, so reading Korean also opens an input. | Show existing translation immediately, with a small gap; keep edit and source separate. |
| Special Room | Source components | Korean under its corresponding component | Korean lives in a separate disclosure, disconnected from its English component. | Pair each component with its existing translation; no translation-only action. |
| Entry screen | Search | A complete index of existing destinations | Desk offers reference tools, but libraries require opening a campaign and discovering its navigation. There is no actual site home. | Search-first Home with a typographic index, one-click existing destinations and quiet optional records. |

Use the existing paper/ink typography and thin rules. No dashboard cards, new rules, source data, generators or campaign domains. Home navigation must not clear selected objects or edit their content. Campaign-specific entries must preserve the intended destination through campaign selection/creation. Short Korean stays readable, not pale or tiny. Verify manual edits never receive a stale original translation.
