from pathlib import Path
import hashlib,json,unicodedata
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'outputs/pdf-escape-audit/extracted';OUT.mkdir(parents=True,exist_ok=True)
roots=[ROOT.parent,Path('/Users/imwul/Downloads')]
names={
'core':'MÖRK BORG BARE BONES EDITION.pdf',
'core-full':'Mörk_Borg_English.pdf',
'feretory':'MRK_BORG_CULT_FERETORY.pdf',
'heretic':'MÖRK_BORG_CULT_HERETIC.pdf',
'sd':'Solitary Defilement Rules.pdf',
'depths':'Solitary Depths Compressed.pdf',
'reclvse':'Reclvse_A_Solo_Engine_for_Mörk_Borg.pdf',
'mythic':'Mythic_Game_Master_Emulator_Second_Edition.pdf',
'aitc':'Alone in the Crowd.pdf',
'mb-cheatsheet':'MB_Cheatsheet.pdf',
'dark-fort':'DARK_FORT.pdf',
'dark-fort-sheet':'DARK_FORT_SHEET.pdf',
'feretory-sv':'MBC_FERETORY_Svenska_texter.pdf',
'death-ziggurat-map':'The-Death-Ziggurat_Player-map.pdf',
}
inventory=[]
for id,name in names.items():
 paths=[p for r in roots for p in r.glob('*.pdf') if unicodedata.normalize('NFC',p.name)==name]
 if not paths:
  print(id,'MISSING');continue
 p=paths[0];doc=PdfReader(p)
 pages=[{'pdfPage':i+1,'text':page.extract_text() or ''} for i,page in enumerate(doc.pages)]
 info={'id':id,'fileName':p.name,'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'pages':len(pages),'lowTextPages':[x['pdfPage'] for x in pages if len(x['text'].strip())<60]}
 (OUT/(id+'.json')).write_text(json.dumps({**info,'pageText':pages},ensure_ascii=False,indent=2))
 (OUT/(id+'.txt')).write_text('\n\n'.join(f"=== PDF {x['pdfPage']} ===\n{x['text']}" for x in pages))
 inventory.append(info);print(id,len(pages),'pages','lowtext',info['lowTextPages'],flush=True)
(ROOT/'docs/pdf-escape-audit/data/source-inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2))
