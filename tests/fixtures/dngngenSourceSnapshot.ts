/** Invented source-map-like fixture, containing no original source vocabulary. */
export function syntheticDngngenSnapshot() {
  const pools = ['A','B','C','D'].map(role => `export const Table${role} = {id: '${role}', results: [${[
    `description('${role}-ONE')`,
    `descriptionWithValues('${role}-INT', () => ({count: random(2, 5)}))`,
    `descriptionWithValues('${role}-SUM', () => ({count: random(1, 6) + random(1, 6) + 2}))`,
    `descriptionWithValues('${role}-SAMPLE', () => ({label: sample(['TEST-RED', 'TEST-BLUE'])!}))`,
  ].join(',')}]};`).join('\n');
  const module = `import random from 'lodash/fp/random';\nimport sample from 'lodash/fp/sample';\n${pools}\nexport const TableAB = {id:'AB',results:[...TableA.results,...TableB.results]};\nexport const TableCD = {id:'CD',results:[...TableC.results,...TableD.results]};`;
  const englishMessages: Record<string, unknown> = {};
  for (const role of ['A','B','C','D']) {
    englishMessages[`room.details.${role}-ONE`] = `${role} TEST BASE`;
    englishMessages[`room.details.${role}-INT`] = 'COUNT {count} {count, select, 2{PAIR} other{GROUP}}';
    englishMessages[`room.details.${role}-SUM`] = 'SUM {count}';
    englishMessages[`room.details.${role}-SAMPLE`] = [
      {type:'message',id:'TEST-PREFIX'}, {type:'value', name:'label', format:'message'},
    ];
  }
  englishMessages['TEST-PREFIX'] = 'PREFIX ';
  englishMessages['TEST-RED'] = 'RED TEST';
  englishMessages['TEST-BLUE'] = 'BLUE TEST';
  englishMessages['UNUSED'] = 'UNUSED MUST NOT ENTER PACK';
  return {
    format:'reference-desk.dngngen-source-snapshot', version:1, sourceVersion:'1.0.0', synthetic:true,
    sourceMap:JSON.stringify({version:3,file:'synthetic.js',sources:['roll/Room/tables/index.tsx'],sourcesContent:[module]}),
    englishMessages,
  };
}
