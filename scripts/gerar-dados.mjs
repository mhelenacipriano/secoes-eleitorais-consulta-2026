// Gera public/secoes.json a partir do CSV do projeto de análise.
// Uso: npm run dados -- caminho/para/secoes_v.csv
// Só entram os campos necessários para a consulta: não há votos nem dados de eleitores.
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

const arquivo = process.argv[2];
if (!arquivo) { console.error('Informe o caminho do CSV (secoes_v.csv).'); process.exit(1); }
const n = (x) => Number(x) || 0;
const rows = parse(fs.readFileSync(arquivo), { columns: true, skip_empty_lines: true });
// [uf, município, zona, seção, local inicial, local final, máscara das listas (bit 1 = lista 1 ... bit 4 = lista 4)]
const dados = rows.map((r) => [r.uf, r.municipio, n(r.zona), n(r.secao), r.local_inicial, r.local_final, [1, 2, 3, 4].reduce((m, k) => m | (n(r['v' + k]) === 1 ? 1 << (k - 1) : 0), 0)]);
fs.writeFileSync(new URL('../public/secoes.json', import.meta.url), JSON.stringify({ gerado: 'seções das 4 listas', colunas: ['uf', 'municipio', 'zona', 'secao', 'localInicial', 'localFinal', 'listas'], dados }));
console.log(`${dados.length} seções gravadas em public/secoes.json`);
