import { readFileSync, writeFileSync } from 'node:fs';
import { searchReferences, type ReferenceRegistry } from '../../../src/domain/references';
const entries = JSON.parse(readFileSync('outputs/pdf-escape-audit/reference-index.json', 'utf8'));
const registry = { entries, byId: Object.fromEntries(entries.map((entry: { id: string }) => [entry.id, entry])) } as ReferenceRegistry;
const rows = JSON.parse(readFileSync('docs/pdf-escape-audit/data/mythic-extra-rows.json', 'utf8'));
const queries = [...new Set<string>(rows.flatMap((row: { searchQueries: string[]; classification: string }) => row.classification === 'PDF_APPROPRIATE' ? [] : row.searchQueries))];
const results = queries.map(query => ({ query, results: searchReferences(registry, query, { limit: 5 }).map(entry => ({ id: entry.id, title: entry.title, available: entry.available, action: entry.action })) }));
writeFileSync('outputs/pdf-escape-audit/mythic-variation-search-results.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify({ queries: queries.length, noResults: results.filter(row => !row.results.length).length }));
