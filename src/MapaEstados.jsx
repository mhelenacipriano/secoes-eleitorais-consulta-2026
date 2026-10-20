import { useMemo } from 'react';
import { nomeEstado } from './estados.js';

// Mapa em grade (cada estado é um quadrado, na posição aproximada do mapa): todos têm o mesmo tamanho, então os estados pequenos
// não somem. [coluna, linha]
const POS = {
  RR: [2, 0], AP: [3, 0],
  AM: [1, 1], PA: [2, 1], MA: [3, 1], PI: [4, 1], CE: [5, 1], RN: [6, 1],
  AC: [0, 2], RO: [1, 2], MT: [2, 2], TO: [3, 2], BA: [4, 2], PE: [5, 2], PB: [6, 2],
  MS: [2, 3], GO: [3, 3], DF: [4, 3], SE: [5, 3], AL: [6, 3],
  SP: [3, 4], MG: [4, 4], ES: [5, 4],
  PR: [3, 5], RJ: [4, 5],
  SC: [3, 6], RS: [3, 7],
};
const NIVEIS = 5;

/** Mapa clicável: a cor (e o número) mostram quantas seções com local alterado há em cada estado; clicar escolhe o estado. */
export default function MapaEstados({ dados, uf, onEscolher }) {
  const { contagem, max } = useMemo(() => {
    const c = {};
    for (const l of dados.linhas) c[l.uf] = (c[l.uf] || 0) + 1;
    return { contagem: c, max: Math.max(1, ...Object.values(c)) };
  }, [dados]);
  const nivel = (n) => (n === 0 ? 0 : Math.min(NIVEIS, 1 + Math.floor((Math.sqrt(n / max) * NIVEIS) - 1e-9)));
  const ufs = Object.keys(POS);
  return (
    <section className="mapa-sec" aria-labelledby="titulo-mapa">
      <div className="consulta-cab">
        <h2 id="titulo-mapa">Seções alteradas por estado</h2>
        <p>Clique num estado para ver as seções dele. Quanto mais escuro, mais seções com local de votação alterado na lista mais recente.</p>
      </div>
      <div className="mapa-corpo">
        <ul className="mapa" role="list" aria-label="Mapa de estados">
          {ufs.map((u) => {
            const n = contagem[u] || 0, [x, y] = POS[u], sel = uf === u;
            return (
              <li key={u}>
                <button type="button" className={`uf n${nivel(n)}${sel ? ' sel' : ''}`} aria-pressed={sel} disabled={n === 0} style={{ gridColumn: x + 1, gridRow: y + 1 }}
                  aria-label={`${nomeEstado(u)}: ${n} ${n === 1 ? 'seção alterada' : 'seções alteradas'}${sel ? ' (selecionado)' : ''}`} title={`${nomeEstado(u)} · ${n}`}
                  onClick={() => onEscolher(sel ? '' : u)}>
                  <b>{u}</b><span>{n}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mapa-leg" aria-hidden="true"><span>menos</span><i className="n1" /><i className="n2" /><i className="n3" /><i className="n4" /><i className="n5" /><span>mais seções</span></div>
      </div>
    </section>
  );
}
