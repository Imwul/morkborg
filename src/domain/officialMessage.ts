/** Enough of the official catalogs' ICU to render a result. Not a general FormatJS. */
const categories = ['zero', 'one', 'two', 'few', 'many', 'other'] as const;

export function formatOfficialMessage(
  template: string,
  values: Record<string, string | number> = {},
): string {
  try {
    return clean(read(template, 0, template.length, values, false).text);
  } catch {
    throw new Error('message-syntax');
  }
}

function clean(value: string): string {
  return value
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*hr\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/\s*(?:p|div|h[1-6]|tr)\s*>/gi, '\n')
    .replace(/<\s*li\b[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ');
}

function read(
  template: string,
  start: number,
  end: number,
  values: Record<string, string | number>,
  plural: boolean,
): { text: string; index: number } {
  let text = '';
  let index = start;
  while (index < end) {
    const ch = template[index];
    if (ch === "'") {
      const quoted = readQuote(template, index, end);
      text += quoted.text;
      index = quoted.index;
      continue;
    }
    if (ch === '{') {
      const placeholder = readPlaceholder(template, index, end, values);
      text += placeholder.text;
      index = placeholder.index;
      continue;
    }
    if (ch === '#' && plural) {
      text += String(values['#'] ?? '');
      index += 1;
      continue;
    }
    text += ch;
    index += 1;
  }
  return { text, index };
}

/** A quote starts only when it escapes syntax. Ordinary apostrophes stay literal. */
function readQuote(
  template: string,
  start: number,
  end: number,
): { text: string; index: number } {
  const next = template[start + 1];
  if (next === "'") return { text: "'", index: start + 2 };
  if (next !== '{' && next !== '}' && next !== '#')
    return { text: "'", index: start + 1 };
  let text = '';
  let index = start + 1;
  while (index < end) {
    if (template[index] === "'" && template[index + 1] === "'") {
      text += "'";
      index += 2;
      continue;
    }
    if (template[index] === "'") return { text, index: index + 1 };
    text += template[index];
    index += 1;
  }
  throw new Error('message-syntax');
}

function readPlaceholder(
  template: string,
  start: number,
  end: number,
  values: Record<string, string | number>,
): { text: string; index: number } {
  let index = start + 1;
  while (template[index] === ' ') index += 1;
  const nameStart = index;
  while (index < end && /[A-Za-z0-9_.]/.test(template[index])) index += 1;
  const name = template.slice(nameStart, index);
  if (!name) throw new Error('message-syntax');
  while (template[index] === ' ') index += 1;
  if (template[index] === '}')
    return { text: String(values[name] ?? ''), index: index + 1 };
  if (template[index] !== ',') throw new Error('message-syntax');
  index += 1;
  while (template[index] === ' ') index += 1;
  const typeStart = index;
  while (index < end && /[A-Za-z]/.test(template[index])) index += 1;
  const type = template.slice(typeStart, index);
  while (template[index] === ' ') index += 1;
  if (template[index] !== ',') throw new Error('message-syntax');
  index += 1;
  const scoped =
    type === 'plural' ? { ...values, '#': values[name] ?? '' } : values;
  const options: Record<string, string> = {};
  while (index < end && template[index] !== '}') {
    while (template[index] === ' ') index += 1;
    const keyStart = index;
    while (index < end && template[index] !== ' ' && template[index] !== '{')
      index += 1;
    const key = template.slice(keyStart, index);
    while (template[index] === ' ') index += 1;
    if (!key || template[index] !== '{') throw new Error('message-syntax');
    const body = readBalanced(
      template,
      index,
      end,
      scoped,
      type === 'plural',
    );
    options[key] = body.text;
    index = body.index;
    while (template[index] === ' ') index += 1;
  }
  if (template[index] !== '}') throw new Error('message-syntax');
  const value = values[name];
  const selected =
    type === 'plural'
      ? pluralOption(options, Number(value))
      : type === 'select'
        ? (options[String(value)] ?? options.other ?? '')
        : null;
  if (selected === null) throw new Error('message-syntax');
  return { text: selected, index: index + 1 };
}

function readBalanced(
  template: string,
  open: number,
  end: number,
  values: Record<string, string | number>,
  plural: boolean,
): { text: string; index: number } {
  let depth = 1;
  let index = open + 1;
  const bodyStart = index;
  while (index < end && depth > 0) {
    if (template[index] === '{') depth += 1;
    else if (template[index] === '}') depth -= 1;
    if (depth > 0) index += 1;
  }
  if (depth !== 0) throw new Error('message-syntax');
  const rendered = read(template, bodyStart, index, values, plural);
  return { text: rendered.text, index: index + 1 };
}

function pluralOption(options: Record<string, string>, value: number): string {
  const exact = options[`=${value}`];
  if (exact !== undefined) return exact;
  const cardinal =
    value === 0
      ? 'zero'
      : value === 1
        ? 'one'
        : value === 2
          ? 'two'
          : 'other';
  for (const key of [cardinal, 'other'] as const) {
    if (options[key] !== undefined) return options[key];
  }
  if (!categories.some((key) => options[key] !== undefined))
    throw new Error('message-syntax');
  return options.other ?? '';
}
