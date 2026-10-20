import { useEffect, useMemo, useState } from 'react';
import { ANALISE_URL } from './config.js';
import { procurar, useDados } from './busca.js';
import ThemeToggle from './ThemeToggle.jsx';
import ShareButton from './ShareButton.jsx';
import TabelaSecoes from './TabelaSecoes.jsx';
import { Autocomplete, Button, TextField } from '@mui/material';

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

const OFICIAL = 'Confirme o seu local de votação nos canais oficiais da Justiça Eleitoral (o TRE do seu estado ou o aplicativo e-Título) antes de ir votar.';
const AVISO = `Constar na lista não significa, por si só, que o seu local de votação foi alterado: a lista pode conter registros que foram corrigidos ou reclassificados depois. ${OFICIAL}`;

function Resultado({ r, f, outra }) {
  if (r.tipo === 'achou') {
    const s = r.secao, igual = s.localInicial === s.localFinal;
    return (
      <section className="resultado achou" aria-live="polite" tabIndex={-1} id="resultado">
        <p className="selo">Consta na lista mais recente</p>
        <h2>{s.municipio} · {s.uf} — zona {s.zona}, seção {s.secao}</h2>
        <p>Esta seção consta na lista mais recente de locais de votação alterados.</p>
        <dl className="locais">
          <div><dt>Local inicial</dt><dd>{s.localInicial}</dd></div>
          <div><dt>Local final</dt><dd>{s.localFinal}{igual && <small> — igual ao local inicial nos registros</small>}</dd></div>
        </dl>
        <p className="aviso">{AVISO}</p>
        <div className="res-acoes"><ShareButton className="btn" titulo="Sua seção eleitoral mudou?" texto="Consulte se a sua seção consta na lista mais recente de locais de votação alterados.">Compartilhar esta consulta</ShareButton><button type="button" className="btn" onClick={outra}>Consultar outra seção</button></div>
      </section>
    );
  }
  return (
    <section className="resultado nao-achou" aria-live="polite" tabIndex={-1} id="resultado">
      <p className="selo neutro">Não consta na lista mais recente</p>
      <h2>{r.municipioNome || f.municipio.trim()} · {f.uf} — zona {Number(f.zona)}, seção {Number(f.secao)}</h2>
      <p>{r.municipioConsta
        ? `Há ${r.secoesNoMunicipio} seções deste município na lista mais recente, mas não esta combinação de zona e seção. Confira os números no seu título de eleitor.`
        : 'Nenhuma seção deste município consta na lista mais recente. Confira se o nome do município está certo (escolha uma sugestão da lista, se houver).'}</p>
      <p className="aviso">Isso não é garantia de que o seu local de votação não mudou: só reflete a lista mais recente. {OFICIAL}</p>
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
        <p className="banner" role="note"><strong>Informação mais recente.</strong> Esta página considera apenas a lista mais recente de seções com local de votação alterado ({dados ? dados.linhas.length.toLocaleString('pt-BR') : '438'} seções; a fonte não informa a data de publicação). As versões anteriores das listas não são usadas aqui — a comparação entre elas está na análise completa.</p>
        <div className="estreito">
        <header className="hero">
          <p className="eyebrow">Eleições 2026 · 2º turno</p>
          <h1>Sua seção eleitoral mudou?</h1>
          <p className="sub">Consulte se a sua seção consta na lista mais recente de locais de votação alterados. Você precisa de estado, município, zona e seção — todos estão no seu título de eleitor. Se preferir, role a página e navegue pela lista completa.</p>
          <ol className="passos" aria-label="Como funciona"><li><b>1</b> Informe sua seção</li><li><b>2</b> Consulte</li><li><b>3</b> Confirme no canal oficial</li></ol>
        </header>

        {erro && <p className="erro" role="alert">Não foi possível carregar os dados ({erro.message}). Tente recarregar a página.</p>}
        <form className="form" onSubmit={enviar} noValidate>
          <TextField select id="campo-uf" label="Estado" value={f.uf} onChange={set('uf')} disabled={!dados} fullWidth slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}>
            <option value="">{dados ? 'Escolha o estado' : 'Carregando…'}</option>
            {dados?.ufs.map((u) => <option key={u} value={u}>{u === 'ZZ' ? 'ZZ (exterior)' : u}</option>)}
          </TextField>
          <Autocomplete freeSolo disabled={!f.uf} options={sugestoes} inputValue={f.municipio} onInputChange={(_, v) => { setConsultado(false); setF((x) => ({ ...x, municipio: v })); }}
            noOptionsText="Nenhum município com esse nome" renderInput={(params) => <TextField {...params} label="Município" placeholder={f.uf ? 'Digite o município' : 'Escolha o estado primeiro'} slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps?.inputLabel, shrink: true } }} />} />
          <div className="duas">
            <TextField label="Zona" value={f.zona} onChange={set('zona')} placeholder="Ex.: 12" error={naoNum(f.zona)} helperText={naoNum(f.zona) ? 'Use só números.' : ' '} slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' }, inputLabel: { shrink: true } }} />
            <TextField label="Seção" value={f.secao} onChange={set('secao')} placeholder="Ex.: 345" error={naoNum(f.secao)} helperText={naoNum(f.secao) ? 'Use só números.' : ' '} slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' }, inputLabel: { shrink: true } }} />
          </div>
          <div className="acoes">
            <Button variant="contained" type="submit" disabled={!ok || !dados}>Consultar</Button>
            <Button variant="outlined" color="inherit" type="button" onClick={limpar} disabled={!f.uf && !f.municipio && !f.zona && !f.secao}>Limpar</Button>
          </div>
        </form>

        <details className="ajuda">
          <summary>Onde encontro a zona e a seção?</summary>
          <div><p>Estão no seu <strong>título de eleitor</strong> (impresso ou digital) e no aplicativo <strong>e-Título</strong>.</p><p>Se o nome do município não aparecer nas sugestões, ele não consta na lista mais recente.</p></div>
        </details>

        {resultado && <Resultado r={resultado} f={f} outra={limpar} />}

        </div>

        {dados && <TabelaSecoes dados={dados} />}

        <p className="disclaimer" role="note">Esta consulta mostra apenas se a seção aparece na lista mais recente que analisamos. Não é uma fonte oficial: para confirmar o seu local de votação, use os canais da Justiça Eleitoral.</p>
      </main>

      <footer className="foot">
        <p>Quer entender o que mudou nas listas e o que isso pode (ou não) significar?</p>
        <a className="btn primary big" href={ANALISE_URL}>Análise completa →</a>
        <p className="note">Os dados mostram o perfil das listas, não comprovam mudanças no resultado da eleição.</p>
      </footer>
    </div>
  );
}
