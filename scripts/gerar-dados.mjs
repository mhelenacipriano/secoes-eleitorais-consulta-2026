// Gera public/secoes.json a partir do CSV oficial da lista mais recente de seções alteradas
// (ISO-8859-1, separado por ";"). Uso: npm run dados -- dados-fonte/secoes_eleitorais_alteradas_2t-pais_2026_recent.csv
// Só entram os campos da consulta: não há votos nem dados pessoais (qt_eleitores é o total da seção).
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

const arquivo = process.argv[2];
if (!arquivo) { console.error('Informe o caminho do CSV.'); process.exit(1); }
const rows = parse(new TextDecoder('latin1').decode(fs.readFileSync(arquivo)), { columns: true, delimiter: ';', skip_empty_lines: true });
// [uf, município, zona, seção, onde votava, onde vai votar, eleitores da seção]
const dados = rows.map((r) => [r.sg_uf, r.nm_municipio, Number(r.nr_zona), Number(r.nr_secao), r.nm_local_votacao_inicial, r.nm_local_votacao_final, Number(r.qt_eleitores)]);
fs.writeFileSync(new URL('../public/secoes.json', import.meta.url), JSON.stringify({ gerado: 'lista mais recente', colunas: ['uf', 'municipio', 'zona', 'secao', 'ondeVotava', 'ondeVaiVotar', 'eleitores'], dados }));
console.log(`${dados.length} seções gravadas em public/secoes.json`);
