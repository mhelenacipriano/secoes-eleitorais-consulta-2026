// Gera public/secoes.json a partir do CSV do projeto de análise.
// Uso: npm run dados -- caminho/para/secoes_v.csv
// Só entram as seções da lista mais recente (coluna v4: lista de 438 seções) e os campos necessários
// para a consulta: não há votos nem dados de eleitores.
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

const arquivo = process.argv[2];
if (!arquivo) { console.error('Informe o caminho do CSV (secoes_v.csv).'); process.exit(1); }
const n = (x) => Number(x) || 0;
const rows = parse(fs.readFileSync(arquivo), { columns: true, skip_empty_lines: true });
// [uf, município, zona, seção, local inicial, local final]
const dados = rows.filter((r) => n(r.v4) === 1).map((r) => [r.uf, r.municipio, n(r.zona), n(r.secao), r.local_inicial, r.local_final]);
fs.writeFileSync(new URL('../public/secoes.json', import.meta.url), JSON.stringify({ gerado: 'lista mais recente (438 seções)', colunas: ['uf', 'municipio', 'zona', 'secao', 'localInicial', 'localFinal'], dados }));
console.log(`${dados.length} seções gravadas em public/secoes.json`);
