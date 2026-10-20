// Estado compartilhável na query string (?uf=SP&m=...). Links antigos com os mesmos parâmetros no hash (#uf=SP) continuam valendo:
// são lidos como se fossem query e migrados para a query na primeira gravação.
const hashComParametros = () => /^#\??[^/]*=/.test(location.hash);

export const lerParams = () => {
  const p = new URLSearchParams(location.search);
  if (hashComParametros()) for (const [k, v] of new URLSearchParams(location.hash.replace(/^#\??/, ''))) if (!p.has(k)) p.set(k, v);
  return p;
};

/** Atualiza só as chaves informadas (valor vazio remove a chave) e preserva as demais; não cria entrada no histórico. */
export const gravarParams = (obj) => {
  const p = lerParams();
  for (const [k, v] of Object.entries(obj)) { if (v === '' || v == null) p.delete(k); else p.set(k, String(v)); }
  const qs = p.toString();
  const hash = hashComParametros() ? '' : location.hash;
  history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + hash);
};
