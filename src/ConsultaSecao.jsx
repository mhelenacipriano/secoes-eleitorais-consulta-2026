import { useEffect, useMemo, useState } from 'react';
import { Autocomplete, Button, TextField } from '@mui/material';
import { VAZIO, filtrar, norm } from './busca.js';
import { nomeEstado } from './estados.js';
import ShareButton from './ShareButton.jsx';
import LinkFonte from './LinkFonte.jsx';

const MAX_LINHAS = 5;
const lerUrl = () => { const p = new URLSearchParams(location.hash.replace(/^#\??/, '')); return { uf: p.get('uf') || '', mun: p.get('m') || '', zona: p.get('z') || '', secao: p.get('s') || '' }; };
// a URL guarda a consulta (uf, m, z, s) junto com o estado da tabela (tq, tuf, ...)
const gravarUrl = (c) => {
  const p = new URLSearchParams(location.hash.replace(/^#\??/, ''));
  for (const [k, ch] of [['uf', 'uf'], ['mun', 'm'], ['zona', 'z'], ['secao', 's']]) { if (c[k]) p.set(ch, c[k]); else p.delete(ch); }
  history.replaceState(null, '', p.toString() ? '#' + p.toString() : location.pathname + location.search);
};

function Linha({ l }) {
  const igual = l.ondeVotava === l.ondeVaiVotar;
  return (
    <li className="res-linha">
      <div className="res-id"><strong>{l.municipio}</strong> <span className="pill">{l.uf}</span><span className="zs">Zona {l.zona} · Seção {l.secao}</span></div>
      <div className="res-loc"><small>Onde votava</small>{l.ondeVotava}</div>
      <div className="res-loc"><small>Onde vai votar</small>{l.ondeVaiVotar}{igual && <em> (igual ao de antes nos registros)</em>}</div>
    </li>
  );
}

/** Seção 1: "Encontre a sua seção". Todos os campos são opcionais; qualquer um já mostra resultados. */
export default function ConsultaSecao({ dados, onVerLista }) {
  const [c, setC] = useState(lerUrl);
  const set = (k, v) => setC((x) => ({ ...x, [k]: v }));
  useEffect(() => { gravarUrl(c); }, [c]);
  const preenchido = Boolean(c.uf || c.mun.trim() || c.zona || c.secao);
  const achadas = useMemo(() => (preenchido ? filtrar(dados.linhas, { ...VAZIO, ...c }) : []), [dados, c, preenchido]);
  const todosMunicipios = useMemo(() => [...new Set(Object.values(dados.municipios).flat())].sort((a, b) => a.localeCompare(b, 'pt-BR')), [dados]);
  const sugestoes = c.uf ? dados.municipios[c.uf] || [] : todosMunicipios;
  const campoNum = (k, rotulo, ph) => <TextField size="small" label={rotulo} placeholder={ph} value={c[k]} onChange={(e) => set(k, e.target.value.replace(/\D/g, ''))} slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' }, inputLabel: { shrink: true } }} />;

  return (
    <section className="consulta" aria-labelledby="titulo-consulta">
      <div className="consulta-cab">
        <h2 id="titulo-consulta">Encontre a sua seção</h2>
        <p>Preencha o que souber — estado, município, zona ou seção. Todos os campos são opcionais.</p>
      </div>
      <form className="form-linha" onSubmit={(e) => e.preventDefault()} noValidate>
        <Autocomplete size="small" options={dados.ufs} value={c.uf || null} onChange={(_, v) => setC((x) => ({ ...x, uf: v || '', mun: '' }))}
          getOptionLabel={(u) => (u ? `${u} — ${nomeEstado(u)}` : '')} isOptionEqualToValue={(a, b) => a === b}
          filterOptions={(ops, { inputValue }) => { const n = norm(inputValue); return ops.filter((u) => norm(`${u} ${nomeEstado(u)}`).includes(n)); }}
          noOptionsText="Nenhum estado" renderInput={(params) => <TextField {...params} label="Estado" placeholder="Nome ou sigla" slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps?.inputLabel, shrink: true } }} />} />
        <Autocomplete size="small" freeSolo options={sugestoes} inputValue={c.mun} onInputChange={(_, v) => set('mun', v)} noOptionsText="Nenhum município"
          renderInput={(params) => <TextField {...params} label="Município" placeholder="Digite o município" slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps?.inputLabel, shrink: true } }} />} />
        {campoNum('zona', 'Zona', 'Ex.: 12')}
        {campoNum('secao', 'Seção', 'Ex.: 345')}
        <Button className="btn-limpar" variant="text" color="inherit" type="button" onClick={() => setC({ uf: '', mun: '', zona: '', secao: '' })} disabled={!preenchido}>Limpar</Button>
      </form>

      <div className="consulta-res" aria-live="polite">
        {!preenchido && <p className="res-vazio">Os resultados aparecem aqui assim que você preencher qualquer campo.</p>}
        {preenchido && achadas.length === 0 && (
          <div className="vazio-res" role="status">
            <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M10 3a7 7 0 1 0 4.2 12.6l4.6 4.6 1.4-1.4-4.6-4.6A7 7 0 0 0 10 3Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm-2.1 2.9L10 10l-2.1 2.1 1.4 1.4L11.4 11.4l2.1 2.1 1.4-1.4L12.8 10l2.1-2.1-1.4-1.4-2.1 2.1-2.1-2.1-1.4 1.4Z" fill="currentColor" /></svg>
            <p className="vazio-tit">Nenhuma seção encontrada</p>
            <p className="vazio-txt">Não encontramos uma seção com esses dados na lista mais recente divulgada pelo TSE. Confira estado, município, zona e seção no seu título de eleitor — se estiver tudo certo, ela não consta nessa lista.</p>
            <p className="vazio-nota">Isso não garante que o local de votação seja o mesmo. Confirme no e-Título.</p>
          </div>
        )}
        {achadas.length > 0 && (
          <div className="res-box">
            <div className="res-cab">
              <span className="selo">{achadas.length === 1 ? 'Consta' : 'Constam'} na lista mais recente divulgada pelo TSE <LinkFonte /></span>
              <span className="res-conta"><strong>{achadas.length.toLocaleString('pt-BR')}</strong> {achadas.length === 1 ? 'seção encontrada' : 'seções encontradas'}</span>
              <span className="res-cab-acoes">
                <button type="button" className="link-acao destaque" onClick={() => onVerLista({ uf: c.uf, mun: c.mun, zona: c.zona, secao: c.secao })}>{achadas.length > MAX_LINHAS ? `Ver as ${achadas.length.toLocaleString('pt-BR')} na lista completa ↓` : 'Ver na lista completa ↓'}</button>
                <ShareButton className="link-acao" titulo="Sua seção eleitoral mudou?" texto="Consulte se a sua seção consta na lista mais recente de locais de votação alterados.">Compartilhar</ShareButton>
              </span>
            </div>
            <ul className="res-lista">{achadas.slice(0, MAX_LINHAS).map((l) => <Linha key={`${l.uf}-${l.municipio}-${l.zona}-${l.secao}`} l={l} />)}</ul>
            {achadas.length > MAX_LINHAS && <p className="res-mais">Mostrando {MAX_LINHAS} de {achadas.length.toLocaleString('pt-BR')}. <button type="button" className="link-acao destaque" onClick={() => onVerLista({ uf: c.uf, mun: c.mun, zona: c.zona, secao: c.secao })}>Ver todas na lista completa</button></p>}
          </div>
        )}
      </div>
    </section>
  );
}
