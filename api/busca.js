// Registro anônimo das consultas (campos do formulário "Encontre a sua seção"). Não guarda IP nem identificador de quem buscou.
// Duas estruturas, ambas com teto de tamanho: as últimas buscas (lista) e a contagem por combinação (ranking).
import { SITE, configurado, pipeline } from './_redis.js';

export const MAX_RECENTES = 5000;   // últimas buscas guardadas
export const MAX_RANKING = 2000;    // combinações distintas guardadas no ranking

const so = (v, re, max) => { const s = String(v ?? '').trim(); return s.length <= max && re.test(s) ? s : null; };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  if (!configurado) return res.status(204).end();
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).end();
  const uf = so(b.uf, /^([A-Z]{2})?$/, 2);
  const mun = so(b.mun, /^[\p{L}0-9 '’.\-]*$/u, 60);
  const zona = so(b.zona, /^\d{0,5}$/, 5);
  const secao = so(b.secao, /^\d{0,5}$/, 5);
  const n = Number.isInteger(b.n) && b.n >= 0 && b.n < 1e6 ? b.n : null;
  if (uf === null || mun === null || zona === null || secao === null || n === null || !(uf || mun || zona || secao)) return res.status(400).end();

  const chave = [uf, mun, zona, secao].join('|');
  const reg = JSON.stringify({ t: Date.now(), uf, mun, zona, secao, n });
  try {
    await pipeline([
      ['LPUSH', `${SITE}:buscas`, reg],
      ['LTRIM', `${SITE}:buscas`, 0, MAX_RECENTES - 1],
      ['ZINCRBY', `${SITE}:buscas:rank`, 1, chave],
      ['ZREMRANGEBYRANK', `${SITE}:buscas:rank`, 0, -(MAX_RANKING + 1)],
      ...(n === 0 ? [['ZINCRBY', `${SITE}:buscas:vazias`, 1, chave], ['ZREMRANGEBYRANK', `${SITE}:buscas:vazias`, 0, -(MAX_RANKING + 1)]] : []),
    ]);
  } catch { /* o registro é opcional: falhar não atrapalha quem consulta */ }
  return res.status(204).end();
}
