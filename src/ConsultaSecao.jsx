import { useEffect, useMemo, useState } from 'react';
import { Autocomplete, Button, TextField } from '@mui/material';
import { VAZIO, filtrar, norm } from './busca.js';
import { nomeEstado } from './estados.js';
import ShareButton from './ShareButton.jsx';

const MAX_CARTOES = 5;
const OFICIAL = 'Confirme o seu local de votação no aplicativo e-Título ou no Autoatendimento Eleitoral do TSE (ou no site do TRE do seu estado) antes de ir votar.';
const lerUrl = () => { const p = new URLSearchParams(location.hash.replace(/^#\??/, '')); return { uf: p.get('uf') || '', mun: p.get('m') || '', zona: p.get('z') || '', secao: p.get('s') || '' }; };
// a URL guarda a consulta (uf, m, z, s) junto com o estado da tabela (tq, tuf, ...)
const gravarUrl = (c) => {
  const p = new URLSearchParams(location.hash.replace(/^#\??/, ''));
  for (const [k, ch] of [['uf', 'uf'], ['mun', 'm'], ['zona', 'z'], ['secao', 's']]) { if (c[k]) p.set(ch, c[k]); else p.delete(ch); }
  history.replaceState(null, '', p.toString() ? '#' + p.toString() : location.pathname + location.search);
};

function Cartao({ l }) {
  const igual = l.ondeVotava === l.ondeVaiVotar;
  return (
    <article className="cartao-secao">
      <p className="selo">Consta na lista mais recente</p>
      <h3>{l.municipio} · {l.uf} — zona {l.zona}, seção {l.secao}</h3>
      <dl className="locais">
        <div><dt>Onde votava</dt><dd>{l.ondeVotava}</dd></div>
        <div><dt>Onde vai votar</dt><dd>{l.ondeVaiVotar}{igual && <small> — igual ao de antes nos registros</small>}</dd></div>
      </dl>
    </article>
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
  const campoNum = (k, rotulo, ph) => <TextField label={rotulo} placeholder={ph} value={c[k]} onChange={(e) => set(k, e.target.value.replace(/\D/g, ''))} slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' }, inputLabel: { shrink: true } }} />;

  return (
    <section className="consulta" aria-labelledby="titulo-consulta">
      <header className="sec-cab">
        <p className="eyebrow">Consulta rápida</p>
        <h2 id="titulo-consulta">Encontre a sua seção</h2>
        <p className="sub">Preencha o que souber — estado, município, zona ou seção. Todos os campos são opcionais.</p>
      </header>
      <form className="form" onSubmit={(e) => e.preventDefault()} noValidate>
        <Autocomplete options={dados.ufs} value={c.uf || null} onChange={(_, v) => setC((x) => ({ ...x, uf: v || '', mun: '' }))}
          getOptionLabel={(u) => (u ? `${u} — ${nomeEstado(u)}` : '')} isOptionEqualToValue={(a, b) => a === b}
          filterOptions={(ops, { inputValue }) => { const n = norm(inputValue); return ops.filter((u) => norm(`${u} ${nomeEstado(u)}`).includes(n)); }}
          noOptionsText="Nenhum estado" renderInput={(params) => <TextField {...params} label="Estado" placeholder="Nome ou sigla" slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps?.inputLabel, shrink: true } }} />} />
        <Autocomplete freeSolo options={sugestoes} inputValue={c.mun} onInputChange={(_, v) => set('mun', v)} noOptionsText="Nenhum município"
          renderInput={(params) => <TextField {...params} label="Município" placeholder="Digite o município" slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps?.inputLabel, shrink: true } }} />} />
        <div className="duas">{campoNum('zona', 'Zona', 'Ex.: 12')}{campoNum('secao', 'Seção', 'Ex.: 345')}</div>
        <div className="acoes">
          <Button variant="outlined" color="inherit" type="button" onClick={() => setC({ uf: '', mun: '', zona: '', secao: '' })} disabled={!preenchido}>Limpar</Button>
        </div>
      </form>

      <div className="consulta-res" aria-live="polite">
        {!preenchido && <p className="note">Os resultados aparecem aqui assim que você preencher qualquer campo.</p>}
        {preenchido && achadas.length === 0 && (
          <article className="cartao-secao nao" role="status">
            <p className="selo neutro">Não consta na lista mais recente</p>
            <p>Nenhuma seção com esses dados está na lista mais recente. Confira estado, município, zona e seção no seu título de eleitor — se tudo estiver certo, a sua seção não consta nessa lista.</p>
            <p className="aviso"><strong>Isso não é garantia de que o seu local de votação não mudou.</strong> Esta página só reflete a lista mais recente, que pode estar incompleta ou desatualizada. Algumas seções constaram em versões anteriores das listas e deixaram de constar nas atualizações. Não conseguimos confirmar se, nesses casos, o local de votação foi mantido, a mudança foi desfeita ou o registro foi corrigido. {OFICIAL}</p>
          </article>
        )}
        {achadas.length > 0 && (
          <>
            <p className="res-conta"><strong>{achadas.length.toLocaleString('pt-BR')}</strong> {achadas.length === 1 ? 'seção encontrada' : 'seções encontradas'}</p>
            {achadas.slice(0, MAX_CARTOES).map((l) => <Cartao key={`${l.uf}-${l.municipio}-${l.zona}-${l.secao}`} l={l} />)}
            <div className="res-acoes">
              {achadas.length > MAX_CARTOES && <Button variant="contained" onClick={() => onVerLista({ uf: c.uf, mun: c.mun, zona: c.zona, secao: c.secao })}>Ver as {achadas.length.toLocaleString('pt-BR')} na lista completa</Button>}
              <ShareButton className="btn" titulo="Sua seção eleitoral mudou?" texto="Consulte se a sua seção consta na lista mais recente de locais de votação alterados.">Compartilhar esta consulta</ShareButton>
            </div>
            <p className="aviso">Constar na lista não prova, por si só, que o local de votação mudou. {OFICIAL}</p>
          </>
        )}
      </div>
    </section>
  );
}
