// Números do contador, só para quem tem a senha (variável STATS_TOKEN, enviada em "Authorization: Bearer ...").
import { createHash, timingSafeEqual } from 'node:crypto';
import { SITE, configurado, diaSP, janelaOnlineMs, pipeline } from './_redis.js';

const hash = (s) => createHash('sha256').update(String(s)).digest();

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const senha = process.env.STATS_TOKEN;
  if (!senha || !configurado) return res.status(503).json({ erro: 'Contador não configurado: defina STATS_TOKEN e conecte um banco Redis (Upstash) ao projeto.' });
  const enviada = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!timingSafeEqual(hash(enviada), hash(senha))) return res.status(401).json({ erro: 'Senha incorreta.' });

  const agora = Date.now();
  const dias = Array.from({ length: 7 }, (_, i) => diaSP(new Date(agora - i * 86_400_000)));
  try {
    const [total, porDia, , online, curtidas, recentes, rank, vazias, nBuscas] = await pipeline([
      ['GET', `${SITE}:total`],
      ['MGET', ...dias.map((d) => `${SITE}:dia:${d}`)],
      ['ZREMRANGEBYSCORE', `${SITE}:online`, '-inf', agora - janelaOnlineMs],
      ['ZCARD', `${SITE}:online`],
      ['GET', `${SITE}:curtidas`],
      ['LRANGE', `${SITE}:buscas`, 0, 49],
      ['ZREVRANGE', `${SITE}:buscas:rank`, 0, 19, 'WITHSCORES'],
      ['ZREVRANGE', `${SITE}:buscas:vazias`, 0, 9, 'WITHSCORES'],
      ['LLEN', `${SITE}:buscas`],
    ]);
    const lerRanking = (a) => { const out = []; for (let i = 0; i + 1 < (a || []).length; i += 2) { const [uf, mun, zona, secao] = String(a[i]).split('|'); out.push({ uf, mun, zona, secao, vezes: Number(a[i + 1]) }); } return out; };
    const ultimasBuscas = (recentes || []).map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
    const ultimos7 = dias.map((dia, i) => ({ dia, visitas: Number(porDia[i] || 0) }));
    return res.status(200).json({ site: SITE, online: Number(online || 0), hoje: ultimos7[0].visitas, total: Number(total || 0), curtidas: Number(curtidas || 0), buscas: { guardadas: Number(nBuscas || 0), recentes: ultimasBuscas, maisBuscadas: lerRanking(rank), semResultado: lerRanking(vazias) }, ultimos7, atualizadoEm: new Date(agora).toISOString() });
  } catch (e) {
    return res.status(502).json({ erro: 'Não foi possível ler o contador.' });
  }
}
