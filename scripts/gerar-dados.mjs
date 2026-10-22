// Gera public/secoes.json (a lista mais recente do TSE, só com os campos da consulta) e mantém o histórico das listas.
//
// Uso: node scripts/gerar-dados.mjs <link .csv.zip | arquivo .zip | arquivo .csv> [--publicada-em 2026-10-20T15:27:55-03:00]
//  (ou: npm run dados -- <...>)
//
//  - Baixa (se for link) e descompacta o arquivo oficial (ISO-8859-1, separado por ";"). Não há votos nem dados pessoais (qt_eleitores é o total da seção).
//  - A data de publicação vem do link do CDN (…/20261020_152755/…); sem ela, use --publicada-em.
//  - Se a lista for igual à que já está no site (mesmas seções e locais), não muda nada e avisa "Sem mudança".
//  - Senão: grava o JSON (com meta = quando foi publicada/baixada, e historico = uma linha por lista) e guarda o CSV em dados-fonte/.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opc = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const origem = args.find((a) => !a.startsWith('--') && a !== opc('--publicada-em') && a !== opc('--fonte'));
const fonte = opc('--fonte');   // texto para o manifesto quando a origem é um arquivo local
const ns = (t) => String(t || '').replace(/\s+/g, ' ').trim();   // o painel junta espaços repetidos: compara sem essa diferença
const falha = (m) => { console.error('ERRO:', m); process.exit(1); };
if (!origem) falha('Informe o link ou o arquivo da lista (veja o cabeçalho do script).');
const saida = (k, v) => { if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${k}<<EOF\n${v}\nEOF\n`); };

let bytes;
if (/^https?:\/\//.test(origem)) {
  const r = await fetch(origem, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) falha(`o download respondeu ${r.status}.`);
  bytes = Buffer.from(await r.arrayBuffer());
} else bytes = fs.readFileSync(origem);
if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
  const tmp = path.join(raiz, '.tmp-lista.zip'); fs.writeFileSync(tmp, bytes);
  try { bytes = execFileSync('unzip', ['-p', tmp], { maxBuffer: 64 * 1024 * 1024 }); } catch { falha('não consegui descompactar o zip (o programa "unzip" está instalado?).'); } finally { fs.rmSync(tmp, { force: true }); }
}

let publicada = opc('--publicada-em');
const m = /(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/.exec(origem);
if (!publicada && m) publicada = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}-03:00`;
if (!publicada) falha('não consegui descobrir a data de publicação: use --publicada-em AAAA-MM-DDTHH:MM:SS-03:00.');
const pub = new Date(publicada);
if (Number.isNaN(pub.getTime())) falha(`data de publicação inválida: ${publicada}`);

const todas = parse(new TextDecoder('latin1').decode(bytes), { columns: true, delimiter: ';', skip_empty_lines: true });
// Desde 22/10 o TSE publica TODAS as seções do país e deixa o local final em branco nas que não mudaram: só entram as que têm local final diferente do inicial.
const rows = todas.filter((r) => ns(r.nm_local_votacao_final) !== '' && ns(r.nm_local_votacao_final) !== ns(r.nm_local_votacao_inicial));
if (rows.length !== todas.length) {
  console.log(`Arquivo com todas as seções: ${todas.length} linhas, ${rows.length} com local alterado (as demais são ignoradas).`);
  const esc = (v) => (/[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const cab = Object.keys(todas[0]);
  bytes = Buffer.from([cab.join(';'), ...rows.map((r) => cab.map((c) => esc(r[c] ?? '')).join(';'))].join('\r\n') + '\r\n', 'latin1');   // o que fica guardado em dados-fonte/ é só o recorte
}
for (const c of ['sg_uf', 'nm_municipio', 'nr_zona', 'nm_local_votacao_inicial', 'nr_secao', 'nm_local_votacao_final', 'qt_eleitores']) if (!(todas[0] && c in todas[0])) falha(`coluna ausente no arquivo: ${c}. O formato mudou?`);
// [uf, município, zona, seção, onde votava, onde vai votar, eleitores da seção]
const dados = rows.map((r) => [r.sg_uf, r.nm_municipio, Number(r.nr_zona), Number(r.nr_secao), r.nm_local_votacao_inicial, r.nm_local_votacao_final, Number(r.qt_eleitores)]);
if (new Set(dados.map((d) => d.slice(0, 4).join('|'))).size !== dados.length) falha('há seções repetidas no arquivo.');
if (dados.length < 100) falha(`só ${dados.length} seções: arquivo incompleto?`);

const destino = path.join(raiz, 'public/secoes.json');
const atual = fs.existsSync(destino) ? JSON.parse(fs.readFileSync(destino, 'utf8')) : null;
if (atual) {
  if (dados.length < atual.dados.length * 0.4 || dados.length > atual.dados.length * 2.5) falha(`${dados.length} seções contra ${atual.dados.length} na lista atual: variação grande demais, confira o arquivo.`);
  const norm = (d) => JSON.stringify(d.map((l) => l.map((c) => (typeof c === 'string' ? ns(c) : c))));
  if (norm(atual.dados) === norm(dados)) { console.log('Sem mudança: a lista é igual à que já está no site.'); saida('mudou', 'false'); process.exit(0); }
}

const p = Object.fromEntries(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(pub).map((x) => [x.type, x.value]));
const rotulo = `${p.day}/${p.month} · ${p.hour}h${p.minute === '00' ? '' : p.minute}`;
const agora = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), publicadaIso = pub.toISOString().replace(/\.\d{3}Z$/, 'Z');
const historico = [...((atual && atual.historico) || []).filter((h) => h.publicadaEm !== publicadaIso), { rotulo, secoes: dados.length, publicadaEm: publicadaIso }];
const meta = { rotulo, publicadaEm: publicadaIso, baixadaEm: agora, secoes: dados.length, arquivo: /^https?:/.test(origem) ? origem : (fonte || path.basename(origem)) };
fs.writeFileSync(destino, JSON.stringify({ gerado: 'lista mais recente', colunas: ['uf', 'municipio', 'zona', 'secao', 'ondeVotava', 'ondeVaiVotar', 'eleitores'], meta, historico, dados }));
for (const f of fs.readdirSync(path.join(raiz, 'dados-fonte'))) if (f.endsWith('.csv')) fs.rmSync(path.join(raiz, 'dados-fonte', f));   // guarda só a lista atual
fs.writeFileSync(path.join(raiz, 'dados-fonte', `lista_${p.year}${p.month}${p.day}_${p.hour}${p.minute}${p.second}.csv`), bytes);
console.log(`${dados.length} seções gravadas em public/secoes.json (lista de ${rotulo}).`);
saida('mudou', 'true'); saida('resumo', `lista de ${rotulo}: ${dados.length} seções`);
