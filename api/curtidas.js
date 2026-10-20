// Curtidas do site: GET só diz se o botão deve aparecer (o total NÃO é público: fica na página de estatísticas);
// POST soma uma. Anônimo: só guarda o número (nenhum dado de quem curtiu).
import { SITE, configurado, pipeline } from './_redis.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ ativo: configurado });
  if (req.method !== 'POST') return res.status(405).end();
  if (!configurado) return res.status(204).end();
  try { await pipeline([['INCR', `${SITE}:curtidas`]]); return res.status(204).end(); } catch { return res.status(204).end(); }
}
