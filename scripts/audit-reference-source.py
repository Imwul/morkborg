"""Compare canonical English to supplied PDF pages; publish metadata only, never source text.
Run after exporting the live registry to tmp/product-integrity/registry.json.
The JSON report distinguishes text-layer matches, visually inspected layouts and unresolved evidence.
"""
import argparse, hashlib, json, re, unicodedata
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--registry', default='tmp/product-integrity/registry.json')
parser.add_argument('--pdf-text-dir', default='tmp/product-integrity/pdf')
parser.add_argument('--output', default='docs/product-integrity/reference-source-coverage.json')
parser.add_argument('--manifest', default='src/data/oracles/sourceEvidence.json')
parser.add_argument('--source-root', action='append', default=[])
parser.add_argument('--reviewed-table', action='append', default=[], help='Only after personally repeating source and procedure review for this changed table.')
args = parser.parse_args()
registry = json.loads(Path(args.registry).read_text())
source_roots = [Path(root) for root in args.source_root] or [Path.home() / 'Downloads', Path.cwd().parent]
source_files = []
for book in registry['books']:
    matches = [candidate for root in source_roots for candidate in root.glob('*.pdf') if unicodedata.normalize('NFC', candidate.name) == unicodedata.normalize('NFC', book.get('fileName', ''))]
    source_files.append({'bookId': book['id'], 'title': book['title'], 'fileName': book.get('fileName'), 'suppliedPdfFound': len(matches) == 1, 'sha256': hashlib.sha256(matches[0].read_bytes()).hexdigest() if len(matches) == 1 else None})
text_dir = Path(args.pdf_text_dir)
pdfs = {p.stem: p.read_text().split('\f') for p in text_dir.glob('*.txt')}
cropped = json.loads((text_dir / 'cropped.json').read_text()) if (text_dir / 'cropped.json').exists() else {}
previous_evidence = json.loads(Path(args.manifest).read_text()) if Path(args.manifest).exists() else {}

def norm(text):
    return re.sub('[^a-z0-9]+', '', unicodedata.normalize('NFKD', text).lower())

def fingerprint(table):
    # This is a change detector, not authentication. PDF SHA256 hashes are separate evidence.
    excluded = {'ko', 'translation', 'translationKo', 'sourceStatus', 'generationClassification', 'datasetVersion', 'textTransformation'}
    def canonical(value):
        if isinstance(value, list): return [canonical(item) for item in value]
        if isinstance(value, dict): return {key: canonical(value[key]) for key in sorted(value) if key not in excluded}
        return value
    text = json.dumps([table['sourceBookId'], table['sourcePage'], table.get('printedPage'), table['dice'], [[e['id'], e['min'], e['max'], e['text'], canonical(e.get('metadata', {}))] for e in table['entries']]], ensure_ascii=False, separators=(',', ':'))
    value = 2166136261
    for unit in text.encode('utf-16-le'):
        value ^= unit
        value = (value * 16777619) & 0xffffffff
    return format(value, '08x')

# Rendered-page review in this pass. This records evidence, never substitute content.
visual_tables = {
    'depths.chaosPortents.action': 'All 100 numbered words read on rendered PDF 5 / printed 2; image-only source.',
    'depths.chaosPortents.subject': 'All 100 numbered words read on rendered PDF 5 / printed 2; image-only source.',
    'heretic.unheroicFeats': 'Remaining seven entries read on rendered PDFs 6–11 / printed 4–9; restored fi/ff/fl ligatures match the visible source.',
    'heretic.curses': 'Remaining six entries read on rendered PDF 36; font/column extraction omitted glyphs.',
    'sd.room.contents': 'Wrapped continuation lines interleave with the next numbered row in raw text; verified PDF 15 / printed 13.',
}
composed_tables = {
    'aitc.businesses': 'Source table heading and its independently laid-out body retained together; no connective prose.',
    'aitc.npc-encounters': 'Source encounter heading and body retained together; no connective prose.',
    'aitc.npc-damage': 'Source die value plus the source table heading damage.',
    'depths.enemyStats': 'Column labels plus the values from a single printed stat row; no invented statistics.',
    'feretory.blackSaltWindIntensity': 'Wind description, Test Toughness heading and DR column, separated with an em dash.',
}
composed_entries = {
    'core.armor:2-2': 'Source row light plus the Armor table heading.',
    'feretory.campsite:10-10': 'Source d6 dream instruction and next-day Omens instruction; dream subtable remains separate.',
    'aitc.notable-artefact-subject:3-3': 'Source effect plus the asterisk footnote per day.',
    'aitc.notable-artefact-subject:4-4': 'Source effect plus the asterisk footnote per day.',
    'aitc.notable-artefact-subject:6-6': 'Source effect plus the asterisk footnote per day.',
}
derived_entries = {'heretic.gravesLootBodies:5-5': 'Printed 10-foot quantity uses 10′ in the source; feet unit expanded without changing the numeric quantity.'}
visual_entries = {
    'feretory.desire:7-7': 'Detached Or a PC continuation belongs to source row 7, verified PDF 3.',
    'feretory.saltSuffering:7': 'Source caption and continuation are separately positioned on PDF 68.',
    'feretory.saltSuffering:11': 'Source margin note and old-salt madness branches are separately positioned on PDF 68.',
}
rows, manifest = [], {}
for table in registry['tables']:
    previous = previous_evidence.get(table['id'])
    changed_without_review = (not previous or previous['fingerprint'] != fingerprint(table)) and table['id'] not in args.reviewed_table
    pages = table['sourcePage'] if isinstance(table['sourcePage'], list) else [table['sourcePage']]
    source_sets = []
    for suffix in ['', '-raw']:
        source_sets.append('\n'.join(pdfs.get(table['sourceBookId'] + suffix, [])[p - 1] for p in pages if p and p <= len(pdfs.get(table['sourceBookId'] + suffix, []))))
    source_sets.extend(s for p in pages for s in cropped.get(table['sourceBookId'], {}).get(str(p), []))
    normalized = [norm(s) for s in source_sets]
    def matches(s): return bool(norm(s)) and any(norm(s) in source for source in normalized)
    counts = {'SOURCE_VERBATIM': 0, 'SOURCE_COMPOSED': 0, 'APP_DERIVED': 0, 'USER_AUTHORED': 0, 'UNSOURCED': 0}
    exact, inspected, partial = 0, 0, []
    composed, derived, exceptions = [], [], []
    for entry in table['entries']:
        classification = 'SOURCE_VERBATIM'
        status, reason = 'VERIFIED', 'English matches the supplied PDF text on the declared page after Unicode, case, whitespace and punctuation normalization.'
        exact_match = matches(entry['text'])
        if exact_match: exact += 1
        elif entry['id'] in derived_entries:
            classification = 'APP_DERIVED'; reason = derived_entries[entry['id']]; inspected += 1
        elif table['id'] in visual_tables:
            reason = visual_tables[table['id']]; inspected += 1
        elif entry['id'] in visual_entries:
            reason = visual_entries[entry['id']]; inspected += 1
        elif table['id'] in composed_tables:
            classification = 'SOURCE_COMPOSED'; reason = composed_tables[table['id']]; inspected += 1
        elif entry['id'] in composed_entries:
            classification = 'SOURCE_COMPOSED'; reason = composed_entries[entry['id']]; inspected += 1
        else:
            title = entry.get('metadata', {}).get('title')
            if isinstance(title, str) and entry['text'].startswith(title) and matches(title) and matches(entry['text'][len(title):]):
                classification = 'SOURCE_COMPOSED'; reason = 'Verified heading and body source cells displayed together.'; inspected += 1
            else:
                status = 'PARTIAL'; reason = 'Canonical source book/table/pages resolve; exact current English text is not independently confirmed by this pass.'
                if table['id'] == 'heretic.curseCure' and entry['min'] == 12:
                    reason = 'The actual rendered supplied page cuts off the final sentence after do not. Preserved, reference-only; no invented completion.'
                partial.append(entry['id'])
        # Composition is recorded even when linear extraction happens to join the same source cells.
        if table['id'] in composed_tables:
            classification = 'SOURCE_COMPOSED'; reason = composed_tables[table['id']]
        if entry['id'] in composed_entries:
            classification = 'SOURCE_COMPOSED'; reason = composed_entries[entry['id']]
        if classification == 'SOURCE_COMPOSED': composed.append(entry['id'])
        if classification == 'APP_DERIVED': derived.append(entry['id'])
        if changed_without_review:
            status = 'PARTIAL'; reason = 'Source dataset, page/range or inline mechanical metadata changed since the rendered-page audit. Repeat the human procedure review before attesting this table.'
            if entry['id'] not in partial: partial.append(entry['id'])
        if previous and entry['id'] in previous['partialEntryIds'] and table['id'] not in args.reviewed_table and status == 'VERIFIED':
            status = 'PARTIAL'; reason = 'Earlier partial evidence requires explicit repeated human source review; a second script run is not verification.'
            if entry['id'] not in partial: partial.append(entry['id'])
        if not exact_match or classification != 'SOURCE_VERBATIM' or status != 'VERIFIED':
            exceptions.append({'entryId': entry['id'], 'range': [entry['min'], entry['max']], 'status': status, 'classification': classification, 'reason': reason})
        counts[classification] += 1
    rows.append({
        'feature': 'Oracle Registry', 'field': 'entries[].text', 'tableId': table['id'], 'table': table['title'],
        'sourceBookId': table['sourceBookId'], 'pdfPages': pages, 'printedPage': table.get('printedPage'),
        'entryCount': len(table['entries']), 'classificationCounts': counts,
        'sourceStatus': 'PARTIAL' if partial else 'VERIFIED', 'exactTextMatches': exact, 'visuallyOrStructurallyVerified': inspected,
        'translationExists': any(isinstance(e.get('metadata', {}).get('ko'), str) for e in table['entries']),
        'translatedEntries': sum(isinstance(e.get('metadata', {}).get('ko'), str) for e in table['entries']),
        'fallbackExists': False, 'fallbackSourceBacked': None, 'rollable': table.get('rollable', True),
        'exceptions': exceptions,
    })
    manifest[table['id']] = {'fingerprint': fingerprint(table), 'partialEntryIds': partial, 'composedEntryIds': composed, 'derivedEntryIds': derived}
report = {'schemaVersion': 1, 'auditedAt': '2026-09-08', 'scope': 'All canonical Oracle table entry text, including nested source subtables. Registry source-ID resolution is distinct from independent verification of full source wording.', 'sourceFiles': source_files, 'tables': rows, 'totals': {'tables': len(rows), 'entries': sum(r['entryCount'] for r in rows), 'exactTextMatches': sum(r['exactTextMatches'] for r in rows), 'visuallyOrStructurallyVerified': sum(r['visuallyOrStructurallyVerified'] for r in rows), 'partialEntries': sum(len(m['partialEntryIds']) for m in manifest.values()), 'classificationCounts': {key: sum(r['classificationCounts'][key] for r in rows) for key in counts}}}
Path(args.output).write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
Path(args.manifest).write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':'))+'\n')
print(json.dumps(report['totals'], indent=2))
print('PARTIAL:', {key: val['partialEntryIds'] for key,val in manifest.items() if val['partialEntryIds']})
