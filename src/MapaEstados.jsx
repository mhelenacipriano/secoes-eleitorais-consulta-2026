import { useMemo, useState } from 'react';
import { nomeEstado } from './estados.js';
import { ESTADOS, VIEWBOX } from './mapaBrasil.js';

const NIVEIS = 5;
// estados pequenos do litoral: o rótulo vai para o mar, ligado ao estado por uma linha; no DF (dentro de GO) só o número
const FORA_NE = ['RN', 'PB', 'PE', 'AL', 'SE'], FORA_SE = ['ES', 'RJ'], X_NE = 436, X_SE = 372, ESPACO = 11;
const empilha = (lista, x, ys) => { // distribui os rótulos na vertical sem sobreposição, mantendo a ordem do litoral (de cima para baixo)
  const ord = [...lista].sort((a, b) => ESTADOS[a].cy - ESTADOS[b].cy); let y = -1e9; const out = {};
  for (const u of ord) { y = Math.max(ESTADOS[u].cy, y + ESPACO); out[u] = { x, y }; }
  return out;
};
const FORA = { ...empilha(FORA_NE, X_NE), ...empilha(FORA_SE, X_SE) };
const PEQUENOS = new Set(['DF']);
const CAIXA = [VIEWBOX[0], VIEWBOX[1], VIEWBOX[2] + 50, VIEWBOX[3]];

/** Mapa do Brasil clicável: o tom de vermelho e o número mostram quantas seções com local alterado há em cada estado; clicar escolhe o estado. */
export default function MapaEstados({ dados, uf, onEscolher }) {
  const [foco, setFoco] = useState('');
  const { contagem, max } = useMemo(() => {
    const c = {};
    for (const l of dados.linhas) c[l.uf] = (c[l.uf] || 0) + 1;
    return { contagem: c, max: Math.max(1, ...Object.values(c)) };
  }, [dados]);
  const nivel = (n) => (n === 0 ? 0 : Math.min(NIVEIS, 1 + Math.floor((Math.sqrt(n / max) * NIVEIS) - 1e-9)));
  const ufs = Object.keys(ESTADOS).sort((a, b) => (a === uf) - (b === uf)); // o selecionado por último: o contorno fica por cima dos vizinhos
  const mostrado = foco || uf;
  const leitura = mostrado ? `${nomeEstado(mostrado)} (${mostrado}): ${contagem[mostrado] || 0} ${(contagem[mostrado] || 0) === 1 ? 'seção alterada' : 'seções alteradas'}${mostrado === uf ? ' · selecionado' : ''}` : 'Passe o mouse ou toque num estado para ver o total.';
  const escolher = (u) => { if (!(contagem[u] > 0)) return; onEscolher(uf === u ? '' : u); };
  return (
    <section className="mapa-sec" aria-labelledby="titulo-mapa">
      <div className="consulta-cab">
        <h2 id="titulo-mapa">Seções alteradas por estado</h2>
        <p>Clique num estado para ver as seções dele. Quanto mais escuro, mais seções com local de votação alterado na lista mais recente.</p>
      </div>
      <div className="mapa-corpo">
        <svg className="mapa" viewBox={CAIXA.join(' ')} role="group" aria-label="Mapa do Brasil por estado">
          {ufs.map((u) => {
            const n = contagem[u] || 0, e = ESTADOS[u], sel = uf === u;
            return (
              <g key={u} className={`uf n${nivel(n)}${sel ? ' sel' : ''}`} role="button" tabIndex={n > 0 ? 0 : -1} aria-disabled={n === 0} aria-pressed={sel}
                aria-label={`${nomeEstado(u)}: ${n} ${n === 1 ? 'seção alterada' : 'seções alteradas'}${sel ? ' (selecionado)' : ''}`}
                onClick={() => escolher(u)} onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); escolher(u); } }}
                onMouseEnter={() => setFoco(u)} onMouseLeave={() => setFoco('')} onFocus={() => setFoco(u)} onBlur={() => setFoco('')}>
                <path d={e.d} />
                {FORA[u] ? (
                  <>
                    <line className="lig" x1={e.cx} y1={e.cy} x2={FORA[u].x - 2} y2={FORA[u].y} />
                    <circle className="pt" cx={e.cx} cy={e.cy} r="1.6" />
                    <text className="ext" x={FORA[u].x} y={FORA[u].y} dy=".35em" aria-hidden="true"><tspan className="sig">{u}</tspan> {n}</text>
                  </>
                ) : (
                  <text x={e.cx} y={e.cy} textAnchor="middle" aria-hidden="true">
                    {PEQUENOS.has(u) ? <tspan x={e.cx} dy=".35em">{n}</tspan> : <><tspan x={e.cx} dy="-.15em" className="sig">{u}</tspan><tspan x={e.cx} dy="1.05em">{n}</tspan></>}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        <p className="mapa-leitura" aria-live="polite">{leitura}</p>
        <div className="mapa-leg" aria-hidden="true"><span>menos</span><i className="n1" /><i className="n2" /><i className="n3" /><i className="n4" /><i className="n5" /><span>mais seções</span></div>
      </div>
    </section>
  );
}
