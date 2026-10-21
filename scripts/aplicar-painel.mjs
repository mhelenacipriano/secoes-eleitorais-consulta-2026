// Copia para public/secoes.json (meta.painel) a última conferência do painel do TSE feita pelo repositório da análise
// (server/data/painel.json de lá): quando conferimos e o que o painel informa de última/próxima atualização.
// Uso: node scripts/aplicar-painel.mjs [arquivo-painel.json | URL]   (padrão: o painel.json do repositório da análise)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origem = process.argv[2] || 'https://raw.githubusercontent.com/mhelenacipriano/secoes-eleitorais-analise/main/server/data/painel.json';
const destino = path.join(raiz, 'public/secoes.json');
const saida = (k, v) => { if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`); };

let painel;
try {
  painel = /^https?:/.test(origem) ? await (await fetch(origem)).json() : JSON.parse(fs.readFileSync(origem, 'utf8'));
} catch { console.log('Sem painel.json por enquanto: nada a fazer.'); saida('mudou', 'false'); process.exit(0); }
if (!painel || !painel.verificadoEm) { console.log('painel.json sem data de conferência: nada a fazer.'); saida('mudou', 'false'); process.exit(0); }

const json = JSON.parse(fs.readFileSync(destino, 'utf8'));
if (JSON.stringify(json.meta.painel) === JSON.stringify(painel)) { console.log('Painel já está atualizado.'); saida('mudou', 'false'); process.exit(0); }
json.meta.painel = painel;
fs.writeFileSync(destino, JSON.stringify(json));
console.log(`Painel atualizado: conferido em ${painel.verificadoEm}.`);
saida('mudou', 'true');
