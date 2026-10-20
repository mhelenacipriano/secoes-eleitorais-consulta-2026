// Curtidas do site: GET devolve o total; POST soma uma. Anônimo: só guarda o número (nenhum dado de quem curtiu).
import { SITE, configurado, pipeline } from './_redis.js';

export default async function handler(req, res) {
  const chave = `${SITE}:curtidas`;
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    if (!configurado) return res.status(200).json({ total: null });
    try { const [t] = await pipeline([['GET', chave]]); return res.status(200).json({ total: Number(t || 0) }); } catch { return res.status(200).json({ total: null }); }
  }
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  if (!configurado) return res.status(204).end();
  try { const [t] = await pipeline([['INCR', chave]]); return res.status(200).json({ total: Number(t) }); } catch { return res.status(204).end(); }
}
