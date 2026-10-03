"""Rebuild the 2026-10-03 private source projections; never publish plaintext.
Run with pdfplumber available, then attest-rule-fidelity.ts and data:publish.
The source inventory pins each original PDF; this script checks its SHA256.
"""
import hashlib, json, re
from pathlib import Path
import pdfplumber

root = Path(__file__).resolve().parent.parent
bundle_path = root / 'outputs/morkborg-private-data.json'
bundle = json.loads(bundle_path.read_text())
pack = bundle['oracles']
by_id = {t['id']:t for t in pack['tables']}
inventory = {s['id']:s for s in json.loads((root/'docs/pdf-escape-audit/data/source-inventory.json').read_text())}
changed = []

def source_pdf(book):
    source = inventory[book]
    path = Path(source['path'])
    assert hashlib.sha256(path.read_bytes()).hexdigest() == source['sha256'], f'{book}: source PDF changed'
    return path

def names(table_id, titles):
    table = by_id[table_id]
    assert len(table['entries']) == len(titles)
    for entry, title in zip(table['entries'], titles):
        assert entry['text'].startswith(title), f'{table_id}: unexpected heading {entry["min"]}'
        entry.setdefault('metadata',{})['referenceName'] = title
    changed.append(table_id)

names('heretic.unheroicFeats', ['Assassin’s Deathblow','Battle-Hardened Deathspeaker','Beastly Scholar','Bloodied Knuckles','Blood Pact','Bloodthirsty Rage','Bone Crafter','Butcher','Calm Killer','Cat’s Eyes','Dual Wielder','Fateful Visions','Iron Stomach','First Strike','Gutsy Strike','Harbinger of Misery','Herbalist Healer','Horrific Growth','Hyper-Awareness','Immortal Memory','Inspired Storyteller','Leech','Likeable','Living Armor','Lucky','Mortal Draw','Negotiator','Outback Survivalist','Party Chef','Piper','Power Word','Predatory Sense','Reckless Attacker','Shield Breaker','Skinner','Vile Blood'])
names('reclvse.powers', ['Grace of the Stillborn Saint','Whispers Pass the Gate','Unmet Fate','Aegis of Sorrow','Hermetic Step','Consuming Glare','Enochian Syntax','The Last Candle','Flesh of the Forgotten','Blood of the Martyr','The Drowning Hymn','Stone Prayer','Litany of Leaden Hearts','The Unknotted Bond','Benediction of Rust','Canticle of the Final Meal','The Guilt of Kings','Sermon of the Closed Door','Prayer of Withering Bloom','Corpse Hear My Cry','Unflinching Gaze','The Mercy of Strangulation','Dirge of the Falling Tower','Twisted Tongue','Empty Thrones','Psalm of the Moon','Shared Scars','The Penance of Choking','Corrupt Tool','Oath of the Silent Vigil','Blessing of the Last Road','Hungry Earth','The Clemency of Flies','Drowned Man','Requiem for a Stone','Severed Hand'])
names('feretory.ochreTablets', ['Dream Theory','Total Matter Comprehension','Ping the Shared Subconscious','Logical Prognostication','Carno-Organic Speleophagy','Time-Locked Pneumotoxin','Induced Irrelevance','Structural Cryo- condensation (Freezing Moon)','Meta-Alchemy','Memetic Cognitive Palpitation'])

names('feretory.tenebrousReliquary', [e['text'].split(' by ')[0] for e in by_id['feretory.tenebrousReliquary']['entries']])

# Parse each of the two visual columns, never their interleaved page extraction.
relic_entries = []
with pdfplumber.open(source_pdf('reclvse')) as pdf:
    for page_no, gutter in [(37,236),(38,208.875)]:
        page = pdf.pages[page_no-1]
        for x0,x1 in [(0,gutter),(gutter,page.width)]:
            text = page.crop((x0,page.bbox[1],x1,page.bbox[3])).extract_text()
            headings = list(re.finditer(r'(?m)^(\d{1,2})\. (.+)$',text))
            for i,h in enumerate(headings):
                number = int(h[1]); title = h[2].strip()
                body = text[h.end():headings[i+1].start() if i+1<len(headings) else len(text)]
                body = re.sub(r'\n\d+\s*$','',body).strip()
                body = re.sub(r'\s+',' ',body)
                assert body and 1<=number<=12
                relic_entries.append({'id':f'reclvse.relics:{number}','min':number,'max':number,'text':f'{title}\n{body}','metadata':{'referenceName':title,'pdfPage':page_no,'printedPage':page_no}})
relic_entries.sort(key=lambda e:e['min'])
assert [e['min'] for e in relic_entries] == list(range(1,13))
relic_table = {'id':'reclvse.relics','sourceBookId':'reclvse','sourcePage':[37,38],'printedPage':'37–38','title':'Relics','category':'TREASURE','dice':'d12','tags':['reclvse','relic','treasure'],'sourceVerified':True,'sourceNote':'All twelve relic descriptions and costs preserved from separately inspected PDF columns.','entries':relic_entries}
by_id[relic_table['id']] = relic_table
changed.append(relic_table['id'])

# RCL classes are read-only. Their dice refer to RCL tables, never Core tables.
profiles = []
class_specs = [('defiler','Defiler',20),('venom','Venom',22),('brute','Brute',24),('vessel','Vessel',26),('beast','Beast',28),('fanatic','Fanatic',30)]
with pdfplumber.open(source_pdf('reclvse')) as pdf:
    for index,(key,title,page_no) in enumerate(class_specs,1):
        page = pdf.pages[page_no-1]
        # The source is already split into canonical specialty/starting/power tables.
        # Keep the fixed header and abilities, before the first rolling section.
        words = page.extract_words()
        start = next(w['top'] for w in words if w['text']=='ABILITIES')
        section_word = {'defiler':'SCHOOL','venom':'METHOD','brute':'PATH','vessel':'SOURCE','beast':'ASPECT','fanatic':'PRAYER'}[key]
        end = next(w['top'] for w in words if w['text']==section_word and w['top']>start)
        abilities = page.crop((0,start-1,page.width/2,end-1)).extract_text()
        assert 'ABILITIES' in abilities
        resources = {
            'defiler':'Silver 3d6 × 10s; HP Toughness + d6; Omens d2. Armor d2 (no heavy armor); weapon d4. Roll twice on the RCL Equipment Table.',
            'venom':'Silver 3d6 × 10s; HP Toughness + d4; Omens d2. Armor d2 (light only); weapon d6 (one-handed). Roll twice on the RCL Equipment Table.',
            'brute':'Silver 2d6 × 10s; HP Toughness + d10; Omens d3. Armor d4; weapon d20. Roll twice on the RCL Equipment Table.',
            'vessel':'Silver 2d6 × 10s; HP Toughness + d4; Omens d3. Armor d2 (light only); weapon d4 (often staff or dagger). Roll twice on the RCL Equipment Table.',
            'beast':'Silver 2d6 × 10s; HP Toughness + d8; Omens d2. Armor d4; weapon d10. Roll twice on the RCL Equipment Table.',
            'fanatic':'Silver 3d6 × 10s; HP Toughness + d8; Omens d2. Armor d6 (any armor); weapon d20 (may take one-handed and shield). Roll twice on the RCL Equipment Table.',
        }[key]
        blocks = [{'title':'Starting resources · RCL tables','text':resources}, {'title':'Abilities','text':abilities.strip()}]
        profiles.append({'id':f'reclvse.classRules:{key}','min':index,'max':index,'text':title,'metadata':{'referenceId':f'class:reclvse.{key}','referenceKind':'Class','referenceGroup':'RECLVSE classes','blocks':blocks,'pdfPage':page_no,'printedPage':page_no,'relatedIds':[f'oracle:reclvse.class.{key}.{s}' for s in ['specialty','starting','powers']]}})
by_id['reclvse.classRules'] = {'id':'reclvse.classRules','sourceBookId':'reclvse','sourcePage':[20,22,24,26,28,30],'title':'RECLVSE class rules','category':'OTHER','dice':'d6','rollable':False,'tags':['reclvse','class','batch-2'],'sourceVerified':True,'sourceNote':'Read-only class resources and fixed abilities; generation is not enabled. Independent source columns retained.','entries':profiles}
changed.append('reclvse.classRules')

# Exact SD selector bindings to inspected identities (BB pages differ from MB).
creatures = bundle['library']['creatures']
if not any(c.get('id')=='core-full.rotblack.nesting-death' for c in creatures):
    text = next(p['text'] for p in json.loads((root/'outputs/pdf-escape-audit/extracted/core-full.json').read_text())['pageText'] if p['pdfPage']==79)
    raw = text[text.index('Nesting Death'):text.index('Bazaar from a')]
    creatures.append({'id':'core-full.rotblack.nesting-death','book':'core-full','pdfPage':79,'printedPage':'III','name':'Nesting Death','hp':12,'morale':None,'moraleDisplay':'—','armor':'Thick carapace −d2','attack':'Bite','damage':'d4','specialAbility':'Wins initiative on 1–4. Bite: Toughness DR12 or tests DR+2 for one hour (freezing).','sourceText':raw,'sourceVerified':True,'presetEligible':True})

selector = bundle['library']['tables']['sd.stockCreatures']
source_names = {2:'Pale one',3:'Dusk Gnoum',4:'Bent',5:'Zukuma',6:'Arbint',7:'Mongrel',8:'Seth',9:'Guards with Sharpened Teeth',10:'Earthbound',11:'Prowler',12:'Nodh',13:'Wrat',14:'Lady Porcelain',15:'Nesting Death',16:'Lich',17:'Belze',18:'Aland',19:'Thinx',20:'Eulotha'}
for row in selector['entries']:
    number = row['meta']['range'][0]
    name = source_names.get(number)
    matches = [c for c in creatures if c.get('name')==name and c.get('book') in ['core','core-full']]
    if len(matches)==1:
        c=matches[0]
        source_id = c.get('id') or f"{c['pdfPage']}:{re.sub(r'[^a-z0-9]+','-',c['name'].lower()).strip('-')}"
        row['meta']['followUpReferenceIds'] = [f"creature:{c['book']}:{source_id}"]
    elif number==1:
        row['meta']['procedureNote'] = 'Choose the local Eat Prey Kill region and roll its d6 creature table.'
changed.append('sd.stockCreatures')

by_id['sd.building.material']['entries'][-1].setdefault('metadata',{})['followUpOracleIds']=['sd.material.quality','sd.material.composition']
changed.append('sd.building.material')

# The Weather Detail source explicitly annotates precipitation 3 with roll twice.
mist = next(row for row in by_id['reclvse.precipitation']['entries'] if row['min']==3)
mist['text'] = 'Mist (roll twice)'
mist['metadata']['ko'] = '안개(두 번 굴림)'
changed.append('reclvse.precipitation')

# Global conditions are guidance, not invented weighted result rows.
by_id['core.arcaneCatastrophes']['description'] = 'If the same catastrophe occurs again, black fire engulfs the caster: d6 damage every round until ashes remain. Water feeds this fire. Track repeats and HP on your sheet.'
by_id['feretory.ochreTablets']['description'] = 'Use as scrolls. Only Presence +3 or a Forlorn Philosopher may wield them. Any attack or defence fumble shatters one tablet. A tablet is a normal-sized item worth 100s. The source gives ten indexed entries, not a random die.'
for row in by_id['feretory.ochreTablets']['entries']:
    row['metadata']['usageGuidance'] = by_id['feretory.ochreTablets']['description']
translations_path = root/'outputs/rule-fidelity-translations.json'
if translations_path.exists():
    translations = json.loads(translations_path.read_text())
    for tid, table in by_id.items():
        for row in table['entries']:
            if row['id'] in translations: row.setdefault('metadata',{})['ko'] = translations[row['id']]
    for row in by_id['reclvse.classRules']['entries']:
        row['metadata']['ko'] = row['text'] # Preserve English class proper names.
        key = row['id'].split(':')[-1]
        for block, ko in zip(row['metadata']['blocks'], translations['_classBlocks'][key], strict=True):
            block['translation'] = {'ko':ko}
            bundle['library']['notes']['translations'][block['text']] = ko
    bundle['library']['notes']['translations'].update(translations['_creatureTranslations'])
pack['tables'] = list(by_id.values())
bundle_path.write_text(json.dumps(bundle,ensure_ascii=False,separators=(',',':'))+'\n')
(root/'public/rules/library.json').write_text(json.dumps(bundle['library'],ensure_ascii=False,separators=(',',':'))+'\n')
(root/'public/rules/oracles.json').write_text(json.dumps(pack,ensure_ascii=False,separators=(',',':'))+'\n')
(root/'outputs/rule-fidelity-changed-tables.json').write_text(json.dumps(changed))
print(f'Updated {len(changed)} private projections; no plaintext published.')
