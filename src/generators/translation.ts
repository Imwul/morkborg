import { getRules, type RuleEntry } from '../storage/rulesStore';
import { getOraclePack } from '../storage/oracleStore';

// Translations travel with the user's private rules bundle, never a network service.
const vocabulary: Record<string, string> = {
  Waterskin: '물통',
  Classless: '직업 없음',
  'No armor': '방어구 없음',
  None: '없음',
  'Light armor': '경갑',
  'Medium armor': '중형 방어구',
  'Heavy armor': '중갑',
  'sacred scroll': '신성한 두루마리',
  'unclean scroll': '부정한 두루마리',
  'Innate Power': '타고난 권능',
  Attack: '공격',
  Defence: '방어',
  Defense: '방어',
  Damage: '피해',
  Agility: '민첩',
  Presence: '지각',
  Strength: '근력',
  Toughness: '체력',
  Morale: '사기',
  Powers: '권능',
  Bite: '물기',
  Shield: '방패',
  Lockpicks: '자물쇠 따개',
  'Portable laboratory': '휴대용 실험실',
  'A pet monkey': '애완 원숭이',
  'Fanged Deserter': '송곳니 달린 탈영병',
  'Gutterborn Scum': '빈민굴의 부랑자',
  'Esoteric Hermit': '비전의 은둔자',
  'Wretched Royalty': '몰락한 왕족',
  'Heretical Priest': '이단 사제',
  'Occult Herbmaster': '신비한 약초술사',
  'Cursed Skinwalker': '저주받은 변신자',
  'Pale One': '창백한 자',
  'Dead God’s Prophet': '죽은 신의 예언자',
  'Forlorn Philosopher': '버림받은 철학자',
  'Sacrilegious Songbird': '불경한 노래꾼',
  'Shedding Vicar': '허물을 벗는 사제',
  'Rusted hand hook': '녹슨 손 갈고리',
  'Skull — best friend': '가장 친한 친구인 해골',
  'Unnamed Character': '이름 없는 캐릭터',
  Unnamed: '이름 없음',
  copy: '복제본',
  'creature(s)': '마리',
  Zweihänder: '양손대검',
  Galgenbeck: 'Galgenbeck',
  'Jila Migle': 'Jila Migle',
  Sarkash: 'Sarkash',
  'Graven-Tosk': 'Graven-Tosk',
  Grift: 'Grift',
  Sigfúm: 'Sigfúm',
  Kergüs: 'Kergüs',
  Anthelia: 'Anthelia',
  Wästland: 'Wästland',
  Fathu: 'Fathu',
  'The Valley of the Unfortunate Undead':
    'The Valley of the Unfortunate Undead',
  'Valley of the Unfortunate Undead': 'Valley of the Unfortunate Undead',
};
type Trie = { next: Map<string, Trie>; ko?: string; original?: string };
let root: Trie = { next: new Map() },
  exact = new Map<string, string>();
let previousRules: unknown, previousOracles: unknown;
const normalize = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim();
export function polishKoreanTranslation(text: string): string {
  if (!/[가-힣]/.test(text)) return text;
  return text.replace(
    /\b(Strength|Agility|Presence|Toughness|Morale|Powers|Attack|Defence|Defense|Damage)\b/gi,
    (word) =>
      vocabulary[
        Object.keys(vocabulary).find(
          (key) => key.toLowerCase() === word.toLowerCase(),
        )!
      ] ?? word,
  );
}
function refresh() {
  const rules = getRules(),
    oracle = getOraclePack();
  if (rules === previousRules && oracle === previousOracles) return;
  previousRules = rules;
  previousOracles = oracle;
  root = { next: new Map() };
  exact = new Map();
  const translations = rules?.notes.translations;
  const entries: [string, string][] = Object.entries(vocabulary);
  const addRuleEntries = (rows: RuleEntry[]) => {
    for (const row of rows) {
      if (typeof row.meta.ko === 'string')
        entries.push([row.text, row.meta.ko]);
      if (row.followup) addRuleEntries(row.followup);
    }
  };
  for (const table of Object.values(rules?.tables ?? {}))
    addRuleEntries(table.entries);
  for (const t of oracle?.tables ?? [])
    for (const e of t.entries)
      if (typeof e.metadata?.ko === 'string')
        entries.push([e.text, e.metadata.ko]);
  if (
    translations &&
    typeof translations === 'object' &&
    !Array.isArray(translations)
  )
    for (const [en, ko] of Object.entries(translations))
      if (typeof ko === 'string') entries.push([en, ko]);
  // Explicit UI vocabulary wins over a word's unrelated meaning in another table.
  entries.push(...Object.entries(vocabulary));
  for (const [en, ko] of entries) {
    const key = normalize(en).toLocaleLowerCase();
    if (!key) continue;
    exact.set(key, ko);
    let node = root;
    for (const ch of key) {
      if (!node.next.has(ch)) node.next.set(ch, { next: new Map() });
      node = node.next.get(ch)!;
    }
    node.ko = ko;
    node.original = en;
  }
}
const letter = (ch: string | undefined) => !!ch && /[\p{L}\p{N}]/u.test(ch);
export function translateGeneratedText(input: string): string {
  if (
    !input ||
    !/[A-Za-zÀ-ž]/.test(input) ||
    /[가-힣]/.test(input) ||
    /^[\d\s+d−–-]+$/.test(input)
  )
    return '';
  refresh();
  const text = normalize(input);
  const direct = exact.get(text.toLocaleLowerCase());
  if (direct !== undefined) return polishKoreanTranslation(direct);
  const food = /^(\d+) days of food$/i.exec(text);
  if (food) return `${food[1]}일치 식량`;
  const torch = /^(\d+) torches$/i.exec(text);
  if (torch) return `횃불 ${torch[1]}개`;
  const oil = /^lantern with oil for (\d+) hours$/i.exec(text);
  if (oil) return `등불과 ${oil[1]}시간분 기름`;
  const med =
    /^medicine chest (\d+) uses \(stops bleeding\/infection and heals d6 HP\)$/i.exec(
      text,
    );
  if (med) return `약상자 ${med[1]}회분 (출혈·감염을 멈추고 HP d6 회복)`;
  const poison =
    /^a bottle of red poison (\d+) doses \(Toughness DR12 or d10 damage\)$/i.exec(
      text,
    );
  if (poison) return `붉은 독약 ${poison[1]}회분 (체력 DR12 실패 시 d10 피해)`;
  const elixir =
    /^1 life elixir (\d+) doses \(heals d6 HP and removes infection\)$/i.exec(
      text,
    );
  if (elixir) return `생명 영약 1병, ${elixir[1]}회분 (HP d6 회복, 감염 제거)`;
  const decoctions = /^Decoctions: (\d+) doses total · 24h$/i.exec(text);
  if (decoctions) return `탕약: 총 ${decoctions[1]}회분 · 24시간`;
  // Longest complete source phrase first: compound room names, regional features,
  // monster A/B/C descriptions and attached spell effects keep their boundaries.
  const lower = text.toLocaleLowerCase();
  let output = '',
    unmatched = '',
    changed = false;
  for (let i = 0; i < text.length;) {
    let node = root,
      best: { end: number; ko: string } | undefined;
    if (!letter(text[i - 1]))
      for (let j = i; j < lower.length; j++) {
        const child = node.next.get(lower[j]);
        if (!child) break;
        node = child;
        if (node.ko !== undefined && !letter(text[j + 1]))
          best = { end: j + 1, ko: node.ko };
      }
    if (best) {
      output += best.ko;
      changed ||= best.ko !== text.slice(i, best.end);
      i = best.end;
    } else {
      output += text[i];
      unmatched += text[i];
      i++;
    }
  }
  output = output
    .replace(/^The\s+(?=[가-힣])/, '')
    .replace(/\b(\d+) arrows\b/gi, '화살 $1개')
    .replace(/\b(\d+) bolts\b/gi, '쇠뇌살 $1개')
    .replace(/\bcreature\(s\)/gi, '마리')
    .replace(/\b(\d+) doses total\b/gi, '총 $1회분')
    .replace(/\bDecoctions:/gi, '탕약:')
    .replace(/\b24h\b/g, '24시간');
  // A few matched words are not a sentence translation. Only grammatical
  // source fragments and explicit game notation may form a composite result.
  const unknown = unmatched
    .replace(/^The\s+/i, '')
    .replace(/\b\d+\s+(?:arrows|bolts|doses total)\b/gi, '')
    .replace(/\b(?:HP|DR\s*\d*|[dD]\d+|24h)\b/g, '');
  if (/[\p{L}]/u.test(unknown)) return '';
  return (changed || output !== text) && /[가-힣]/.test(output)
    ? polishKoreanTranslation(output)
    : '';
}
