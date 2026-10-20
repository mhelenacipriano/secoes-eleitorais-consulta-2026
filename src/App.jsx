import { useEffect, useMemo, useState } from 'react';
import { ANALISE_URL, LISTAS } from './config.js';
import { procurar, useDados } from './busca.js';
import ThemeToggle from './ThemeToggle.jsx';
import ShareButton from './ShareButton.jsx';

const lerHash = () => {
  const p = new URLSearchParams(location.hash.replace(/^#\??/, ''));
  return { uf: p.get('uf') || '', municipio: p.get('m') || '', zona: p.get('z') || '', secao: p.get('s') || '' };
};
const gravarHash = (f) => {
  const p = new URLSearchParams();
  if (f.uf) p.set('uf', f.uf);
  if (f.municipio) p.set('m', f.municipio);
  if (f.zona) p.set('z', f.zona);
  if (f.secao) p.set('s', f.secao);
  history.replaceState(null, '', p.toString() ? '#' + p.toString() : location.pathname + location.search);
};
const naoNum = (v) => v !== '' && !/^\d+$/.test(v);
const completo = (f) => f.uf && f.municipio.trim() && Number(f.zona) > 0 && Number(f.secao) > 0;

function situacao(mask) {
  const noUltimo = (mask & 8) !== 0;
  const nomes = LISTAS.filter((l) => mask & (1 << (l.id - 1))).map((l) => l.nome);
  if (noUltimo) return `Esta seção consta na lista de 438 seções, a última analisada (data não informada). Aparece em: ${nomes.join(', ')}.`;
  return `Esta seção constou em ${nomes.join(', ')}, mas não consta na lista de 438 seções, a última analisada.`;
}

const OFICIAL = 'Confirme o seu local de votação nos canais oficiais da Justiça Eleitoral (o TRE do seu estado ou o aplicativo e-Título) antes de ir votar.';
const AVISO = `Constar em uma lista não significa, por si só, que o seu local de votação foi alterado: as listas foram revisadas várias vezes e podem conter registros corrigidos ou reclassificados. ${OFICIAL}`;

function Resultado({ r, f, outra }) {
  if (r.tipo === 'achou') {
    const s = r.secao, igual = s.localInicial === s.localFinal;
    return (
      <section className="resultado achou" aria-live="polite" tabIndex={-1} id="resultado">
        <p className="selo">Consta nas listas analisadas</p>
        <h2>{s.municipio} · {s.uf} — zona {s.zona}, seção {s.secao}</h2>
        <ul className="listas" aria-label="Listas em que a seção aparece">
          {LISTAS.map((l) => {
            const tem = (s.listas & (1 << (l.id - 1))) !== 0;
            return <li key={l.id} className={tem ? 'sim' : 'nao'}><span aria-hidden="true">{tem ? '✓' : '—'}</span> {l.nome}{l.obs && <small> ({l.obs})</small>}<span className="sr"> — {tem ? 'consta' : 'não consta'}</span></li>;
          })}
        </ul>
        <p>{situacao(s.listas)}</p>
        <dl className="locais">
          <div><dt>Local inicial</dt><dd>{s.localInicial}</dd></div>
          <div><dt>Local final</dt><dd>{s.localFinal}{igual && <small> — igual ao local inicial nos registros</small>}</dd></div>
        </dl>
        <p className="aviso">{AVISO}</p>
        <div className="res-acoes"><ShareButton className="btn" titulo="Sua seção eleitoral mudou?" texto="Consulte se a sua seção consta nas listas de locais de votação alterados.">Compartilhar esta consulta</ShareButton><button type="button" className="btn" onClick={outra}>Consultar outra seção</button></div>
      </section>
    );
  }
  return (
    <section className="resultado nao-achou" aria-live="polite" tabIndex={-1} id="resultado">
      <p className="selo neutro">Não encontrada nas listas analisadas</p>
      <h2>{r.municipioNome || f.municipio.trim()} · {f.uf} — zona {Number(f.zona)}, seção {Number(f.secao)}</h2>
      <p>{r.municipioConsta
        ? `Há ${r.secoesNoMunicipio} seções deste município nas listas, mas não esta combinação de zona e seção. Confira os números no seu título de eleitor.`
        : 'Nenhuma seção deste município consta nas listas analisadas. Confira se o nome do município está certo (escolha uma sugestão da lista, se houver).'}</p>
      <p className="aviso">Isso não é garantia de que o seu local de votação não mudou: só reflete as listas analisadas. {OFICIAL}</p>
      <div className="res-acoes"><button type="button" className="btn" onClick={outra}>Consultar outra seção</button></div>
    </section>
  );
}

export default function App() {
  const { dados, erro } = useDados();
  const [f, setF] = useState(lerHash);
  const [consultado, setConsultado] = useState(() => completo(lerHash()));
  const set = (k) => (e) => { setConsultado(false); setF((x) => ({ ...x, [k]: e.target.value, ...(k === 'uf' ? { municipio: '' } : {}) })); };
  const sugestoes = useMemo(() => (dados && f.uf ? dados.municipios[f.uf] || [] : []), [dados, f.uf]);
  const resultado = useMemo(() => (dados && consultado && completo(f) ? procurar(dados, f) : null), [dados, consultado, f]);
  const ok = completo(f);

  useEffect(() => { if (consultado) gravarHash(f); }, [consultado, f]);
  useEffect(() => { if (resultado) document.getElementById('resultado')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [resultado]);

  const enviar = (e) => { e.preventDefault(); if (ok) setConsultado(true); };
  const limpar = () => { setF({ uf: '', municipio: '', zona: '', secao: '' }); setConsultado(false); history.replaceState(null, '', location.pathname + location.search); document.getElementById('campo-uf')?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="app">
      <div className="topbar"><span className="brand">Seções eleitorais · 2026</span><ThemeToggle /></div>
      <main>
        <header className="hero">
          <p className="eyebrow">Eleições 2026 · 2º turno</p>
          <h1>Sua seção eleitoral mudou?</h1>
          <p className="sub">Consulte se a sua seção consta nas listas de locais de votação alterados que analisamos. Você precisa de estado, município, zona e seção — todos estão no seu título de eleitor.</p>
          <ol className="passos" aria-label="Como funciona"><li><b>1</b> Informe sua seção</li><li><b>2</b> Consulte</li><li><b>3</b> Confirme no canal oficial</li></ol>
        </header>

        {erro && <p className="erro" role="alert">Não foi possível carregar os dados ({erro.message}). Tente recarregar a página.</p>}
        <form className="form" onSubmit={enviar} noValidate>
          <label>Estado
            <select id="campo-uf" value={f.uf} onChange={set('uf')} required disabled={!dados}>
              <option value="">{dados ? 'Escolha o estado' : 'Carregando…'}</option>
              {dados?.ufs.map((u) => <option key={u} value={u}>{u === 'ZZ' ? 'ZZ (exterior)' : u}</option>)}
            </select>
          </label>
          <label>Município
            <input list="municipios" value={f.municipio} onChange={set('municipio')} placeholder={f.uf ? 'Digite o município' : 'Escolha o estado primeiro'} disabled={!f.uf} autoComplete="off" />
            <datalist id="municipios">{sugestoes.map((m) => <option key={m} value={m} />)}</datalist>
          </label>
          <div className="duas">
            <label>Zona
              <input inputMode="numeric" pattern="[0-9]*" value={f.zona} onChange={set('zona')} placeholder="Ex.: 12" aria-invalid={naoNum(f.zona)} />
              {naoNum(f.zona) && <span className="campo-erro" role="alert">Use só números.</span>}
            </label>
            <label>Seção
              <input inputMode="numeric" pattern="[0-9]*" value={f.secao} onChange={set('secao')} placeholder="Ex.: 345" aria-invalid={naoNum(f.secao)} />
              {naoNum(f.secao) && <span className="campo-erro" role="alert">Use só números.</span>}
            </label>
          </div>
          <div className="acoes">
            <button className="btn primary" type="submit" disabled={!ok || !dados}>Consultar</button>
            <button className="btn" type="button" onClick={limpar} disabled={!f.uf && !f.municipio && !f.zona && !f.secao}>Limpar</button>
          </div>
        </form>

        <details className="ajuda">
          <summary>Onde encontro a zona e a seção?</summary>
          <div><p>Estão no seu <strong>título de eleitor</strong> (impresso ou digital) e no aplicativo <strong>e-Título</strong>.</p><p>Se o nome do município não aparecer nas sugestões, ele não consta nas listas analisadas.</p></div>
        </details>

        {resultado && <Resultado r={resultado} f={f} outra={limpar} />}

        <p className="disclaimer" role="note">Esta consulta mostra apenas se a seção aparece nas listas que analisamos. Não é uma fonte oficial: para confirmar o seu local de votação, use os canais da Justiça Eleitoral.</p>
      </main>

      <footer className="foot">
        <p>Quer entender o que mudou nas listas e o que isso pode (ou não) significar?</p>
        <a className="btn primary big" href={ANALISE_URL}>Análise completa →</a>
        <p className="note">Os dados mostram o perfil das listas, não comprovam mudanças no resultado da eleição.</p>
      </footer>
    </div>
  );
}
