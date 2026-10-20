// Gera public/municipios.json (UF -> nomes de todos os municípios do Brasil) a partir da API de localidades do IBGE.
// Uso: node scripts/gerar-municipios.mjs
import { writeFileSync } from 'node:fs';
const r = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
if (!r.ok) throw new Error('IBGE respondeu ' + r.status);
const lista = await r.json(), por = {};
for (const m of lista) { const uf = m.microrregiao?.mesorregiao?.UF?.sigla || m['regiao-imediata']?.['regiao-intermediaria']?.UF?.sigla; (por[uf] ||= []).push(m.nome); }
for (const k of Object.keys(por)) por[k].sort((a, b) => a.localeCompare(b, 'pt-BR'));
writeFileSync(new URL('../public/municipios.json', import.meta.url), JSON.stringify(por));
console.log(Object.keys(por).length, 'estados,', lista.length, 'municípios');
