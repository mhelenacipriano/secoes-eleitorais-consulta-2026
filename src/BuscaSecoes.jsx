import { useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, Button, Chip, IconButton, InputAdornment, Pagination, Popover, TextField } from '@mui/material';
import { VAZIO, filtrar, norm } from './busca.js';
import { nomeEstado } from './estados.js';
import ShareButton from './ShareButton.jsx';

const CHAVES_URL = { q: 'tq', uf: 'tuf', mun: 'tm', zona: 'tz', secao: 'ts', ini: 'ti', fin: 'tf' };
const COLUNAS = [['estado', 'Estado'], ['municipio', 'Município'], ['zona', 'Zona'], ['secao', 'Seção'], ['ondeVotava', 'Onde votava'], ['ondeVaiVotar', 'Onde vai votar'], ['eleitores', 'Eleitores']];
const NUMERICAS = ['zona', 'secao', 'eleitores'];
// Campos filtráveis: o rótulo é o mesmo do cabeçalho da coluna.
const CAMPOS = { uf: { rotulo: 'Estado', tipo: 'estado' }, mun: { rotulo: 'Município', tipo: 'municipio' }, zona: { rotulo: 'Zona', tipo: 'num' }, secao: { rotulo: 'Seção', tipo: 'num' }, ini: { rotulo: 'Onde votava', tipo: 'texto' }, fin: { rotulo: 'Onde vai votar', tipo: 'texto' } };
const CHAVES_FILTRO = Object.keys(CAMPOS);
const OFICIAL = 'Confirme o seu local de votação no aplicativo e-Título ou no Autoatendimento Eleitoral do TSE (ou no site do TRE do seu estado) antes de ir votar.';

export const lerFiltros = () => {
  const p = new URLSearchParams(location.hash.replace(/^#\??/, ''));
  return Object.fromEntries(Object.entries(CHAVES_URL).map(([k, c]) => [k, p.get(c) || '']));
};
const gravarFiltros = (f) => {
  const p = new URLSearchParams();
  for (const [k, c] of Object.entries(CHAVES_URL)) if (f[k]) p.set(c, f[k]);
  history.replaceState(null, '', p.toString() ? '#' + p.toString() : location.pathname + location.search);
};

const csv = (linhas) => {
  const esc = (v) => (/[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const cab = ['UF', 'Estado', 'Município', 'Zona', 'Seção', 'Onde votava', 'Onde vai votar', 'Eleitores'];
  const corpo = linhas.map((l) => [l.uf, l.estado, l.municipio, l.zona, l.secao, l.ondeVotava, l.ondeVaiVotar, l.eleitores].map(esc).join(';'));
  return '﻿' + [cab.map(esc).join(';'), ...corpo].join('\r\n');
};

const IconeFiltro = () => <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 7h9M17 7h3M4 17h3M11 17h9M13 4v6M7 14v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" /></svg>;
const IconeLixo = () => <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 11H7L6 9Z" fill="currentColor" /></svg>;
const Lupa = () => <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M10 3a7 7 0 1 0 4.2 12.6l4.6 4.6 1.4-1.4-4.6-4.6A7 7 0 0 0 10 3Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" fill="currentColor" /></svg>;
const campoNum = (v, set) => ({ value: v, onChange: (e) => set(e.target.value.replace(/\D/g, '')), slotProps: { htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' }, inputLabel: { shrink: true } } });

export default function BuscaSecoes({ dados, externo }) {
  const [f, setF] = useState(lerFiltros);
  const [ord, setOrd] = useState({ key: 'estado', dir: 1 });
  const [pag, setPag] = useState(0);
  const [tam, setTam] = useState(25);
  const [ancora, setAncora] = useState(null);
  const [destaque, setDestaque] = useState(false);
  const secaoRef = useRef(null);
  const [campos, setCampos] = useState(() => CHAVES_FILTRO.filter((k) => lerFiltros()[k]));
  const set = (k, v) => { setPag(0); setF((x) => ({ ...x, [k]: v })); };
  const ativosChaves = CHAVES_FILTRO.filter((k) => f[k] !== '');
  const filtrosAtivos = ativosChaves.length;
  useEffect(() => { gravarFiltros(f); }, [f]);
  // "Ver todas na lista completa", vindo da consulta: substitui busca e filtros pelos da consulta (os anteriores são
  // limpos para a tabela mostrar exatamente o resultado), rola até a seção e a destaca por alguns segundos
  useEffect(() => {
    if (!externo?.n) return undefined;
    setAncora(null); setPag(0); setF({ ...VAZIO, ...externo.filtros }); setCampos(CHAVES_FILTRO.filter((k) => externo.filtros[k]));
    secaoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setDestaque(true);
    const t = setTimeout(() => setDestaque(false), 3200);
    return () => clearTimeout(t);
  }, [externo]);

  const filtradas = useMemo(() => filtrar(dados.linhas, f), [dados, f]);
  const ordenadas = useMemo(() => {
    const { key, dir } = ord;
    return [...filtradas].sort((a, b) => {
      const x = a[key], y = b[key];
      const c = typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR', { numeric: true });
      return (c || a.estado.localeCompare(b.estado, 'pt-BR') || a.municipio.localeCompare(b.municipio, 'pt-BR') || a.zona - b.zona || a.secao - b.secao) * dir;
    });
  }, [filtradas, ord]);
  const paginas = Math.max(1, Math.ceil(ordenadas.length / tam));
  const p = Math.min(pag, paginas - 1);
  const visiveis = ordenadas.slice(p * tam, (p + 1) * tam);
  const todosMunicipios = useMemo(() => [...new Set(Object.values(dados.municipios).flat())].sort((a, b) => a.localeCompare(b, 'pt-BR')), [dados]);
  const sugestoes = f.uf ? dados.municipios[f.uf] || [] : todosMunicipios;
  const filtrando = filtrosAtivos > 0 || f.q !== '';

  const ordenar = (key) => { setPag(0); setOrd((o) => (o.key === key ? { key, dir: -o.dir } : { key, dir: 1 })); };
  const baixar = () => {
    const url = URL.createObjectURL(new Blob([csv(ordenadas)], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'secoes-alteradas.csv' });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const limparCampo = (k) => { setPag(0); setF((x) => ({ ...x, [k]: '' })); setCampos((c) => c.filter((x) => x !== k)); };
  const trocarCampo = (velho, novo) => { setPag(0); setF((x) => ({ ...x, [novo]: x[velho], [velho]: '' })); setCampos((c) => c.map((x) => (x === velho ? novo : x))); };
  const adicionarCampo = () => { const livre = CHAVES_FILTRO.find((k) => !campos.includes(k)); if (livre) setCampos((c) => [...c, livre]); };
  const limparTudo = () => { setF(VAZIO); setCampos([]); setPag(0); };
  const rotuloChip = (k) => (k === 'uf' ? `Estado: ${f.uf} — ${nomeEstado(f.uf)}` : `${CAMPOS[k].rotulo}: ${CAMPOS[k].tipo === 'num' ? f[k] : `contém “${f[k]}”`}`);

  const editor = (k) => {
    const { tipo, rotulo } = CAMPOS[k];
    if (tipo === 'estado') return (
      <Autocomplete size="small" options={dados.ufs} value={f.uf || null} onChange={(_, v) => { setPag(0); setF((x) => ({ ...x, uf: v || '', mun: '' })); }}
        getOptionLabel={(u) => (u ? `${u} — ${nomeEstado(u)}` : '')} isOptionEqualToValue={(a, b) => a === b}
        filterOptions={(ops, { inputValue }) => { const n = norm(inputValue); return ops.filter((u) => norm(`${u} ${nomeEstado(u)}`).includes(n)); }}
        noOptionsText="Nenhum estado" renderInput={(params) => <TextField {...params} aria-label={rotulo} placeholder="Nome ou sigla" />} />
    );
    if (tipo === 'municipio') return (
      <Autocomplete size="small" freeSolo options={sugestoes} inputValue={f.mun} onInputChange={(_, v) => set('mun', v)} noOptionsText="Nenhum município"
        renderInput={(params) => <TextField {...params} aria-label={rotulo} placeholder="Contém…" />} />
    );
    if (tipo === 'num') return <TextField size="small" placeholder="Número" value={f[k]} onChange={(e) => set(k, e.target.value.replace(/\D/g, ''))} slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*', 'aria-label': rotulo } }} />;
    return <TextField size="small" placeholder="Contém…" value={f[k]} onChange={(e) => set(k, e.target.value)} slotProps={{ htmlInput: { 'aria-label': rotulo } }} />;
  };

  return (
    <section ref={secaoRef} className={`lista-completa${destaque ? ' destaque' : ''}`} aria-labelledby="titulo-lista">
      <header className="sec-cab">
        <p className="eyebrow">Lista completa</p>
        <h2 id="titulo-lista">Veja a lista completa e explore</h2>
        <p className="sub">Busque por palavra-chave, filtre por campo e ordene as colunas. Você pode baixar a tabela com os filtros aplicados.</p>
      </header>
      <div className="tabela-card">
        <div className="tabela-topo">
          <div className="toolbar">
            <TextField id="busca-geral" type="search" fullWidth className="busca-campo" placeholder="Buscar por cidade, estado, local, zona ou seção" value={f.q} onChange={(e) => set('q', e.target.value)}
              slotProps={{ htmlInput: { 'aria-label': 'Buscar' }, input: { startAdornment: <InputAdornment position="start"><Lupa /></InputAdornment> } }} />
            <Button className="btn-filtros" variant="outlined" color="inherit" startIcon={<IconeFiltro />} aria-haspopup="dialog" aria-expanded={Boolean(ancora)} onClick={(e) => setAncora(e.currentTarget)}>
              Filtros{filtrosAtivos > 0 && <span className="count">{filtrosAtivos}</span>}
            </Button>
          </div>
          <p className="dica-busca">Tente “Rio Grande do Sul”, “RS”, “Catuípe” ou “Z23 S370”. Todos os campos são opcionais: use a busca para refinar os resultados.</p>
          {(filtrosAtivos > 0 || f.q !== '') && (
            <div className="chips-ativos" aria-label="Filtros aplicados">
              {f.q !== '' && <Chip size="small" variant="outlined" label={`Busca: “${f.q}”`} onDelete={() => set('q', '')} />}
              {ativosChaves.map((k) => <Chip key={k} size="small" variant="outlined" label={rotuloChip(k)} onDelete={() => limparCampo(k)} />)}
              <button type="button" className="link-acao" onClick={limparTudo}>Limpar tudo</button>
            </div>
          )}
        </div>

        <Popover open={Boolean(ancora)} anchorEl={ancora} onClose={() => setAncora(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { className: 'filtros-popover', role: 'dialog', 'aria-label': 'Filtros por campo' } }}>
          <div className="pop-topo"><strong>Filtros</strong>{filtrosAtivos > 0 && <button type="button" className="link-acao" onClick={limparTudo}>Limpar filtros</button>}</div>
          {campos.length === 0 && <p className="pop-vazio">Nenhum filtro aplicado. Adicione um para refinar por estado, município, zona, seção ou local.</p>}
          {campos.map((k) => (
            <div className="pop-linha" key={k}>
              <TextField select size="small" value={k} onChange={(e) => trocarCampo(k, e.target.value)} slotProps={{ select: { native: true }, htmlInput: { 'aria-label': 'Campo do filtro' } }}>
                {CHAVES_FILTRO.filter((c) => c === k || !campos.includes(c)).map((c) => <option key={c} value={c}>{CAMPOS[c].rotulo}</option>)}
              </TextField>
              <div className="pop-valor">{editor(k)}</div>
              <IconButton aria-label={`Remover filtro ${CAMPOS[k].rotulo}`} onClick={() => limparCampo(k)} size="small"><IconeLixo /></IconButton>
            </div>
          ))}
          {campos.length < CHAVES_FILTRO.length && <button type="button" className="pop-add" onClick={adicionarCampo}><span aria-hidden="true">+</span> Adicionar filtro</button>}
          <TextField select size="small" className="so-mobile" label="Ordenar por" value={`${ord.key}:${ord.dir}`} onChange={(e) => { const [key, dir] = e.target.value.split(':'); setOrd({ key, dir: Number(dir) }); }} slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}>
            {COLUNAS.flatMap(([k, n]) => [<option key={k + 1} value={`${k}:1`}>{n} (A–Z)</option>, <option key={k + 2} value={`${k}:-1`}>{n} (Z–A)</option>])}
          </TextField>
          <div className="pop-rodape"><span>{ordenadas.length.toLocaleString('pt-BR')} seções</span><Button variant="contained" size="small" onClick={() => setAncora(null)}>Concluir</Button></div>
        </Popover>

        <div className="resumo-tabela" aria-live="polite">
          <span><strong>{ordenadas.length.toLocaleString('pt-BR')}</strong> de {dados.linhas.length.toLocaleString('pt-BR')} seções{filtrando ? ' encontradas' : ' na lista mais recente'}</span>
          <div className="resumo-acoes">
            <ShareButton className="link-acao" titulo="Sua seção eleitoral mudou?" texto="Consulte se a sua seção consta na lista mais recente de locais de votação alterados.">Copiar link</ShareButton>
          </div>
        </div>

        {ordenadas.length === 0 ? (
          <div className="vazio" role="status">
            <p><strong>Nenhuma seção encontrada na lista mais recente.</strong></p>
            <p>Se você procurava a sua seção, ela não consta nessa lista. Confira estado, município, zona e seção no seu título de eleitor. Algumas seções constaram em versões anteriores das listas e deixaram de constar nas atualizações. Não conseguimos confirmar se, nesses casos, o local de votação foi mantido, a mudança foi desfeita ou o registro foi corrigido. {OFICIAL}</p>
            <Button variant="contained" onClick={limparTudo}>Limpar busca</Button>
          </div>
        ) : (
          <div className="tabela-wrap">
            <table className="tabela">
              <caption className="sr">Seções da lista mais recente de locais de votação alterados</caption>
              <thead>
                <tr>
                  {COLUNAS.map(([k, n]) => (
                    <th key={k} scope="col" className={NUMERICAS.includes(k) ? 'num' : ''} aria-sort={ord.key === k ? (ord.dir > 0 ? 'ascending' : 'descending') : 'none'}>
                      <button type="button" onClick={() => ordenar(k)}>{n}{ord.key === k ? (ord.dir > 0 ? ' ↑' : ' ↓') : ''}</button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visiveis.map((l) => (
                  <tr key={`${l.uf}-${l.municipio}-${l.zona}-${l.secao}`}>
                    <td data-label="Estado"><span className="pill">{l.uf}</span> {l.estado}</td>
                    <td data-label="Município">{l.municipio}</td>
                    <td data-label="Zona" className="num">{l.zona}</td>
                    <td data-label="Seção" className="num">{l.secao}</td>
                    <td data-label="Onde votava">{l.ondeVotava}</td>
                    <td data-label="Onde vai votar">{l.ondeVaiVotar}</td>
                    <td data-label="Eleitores" className="num">{l.eleitores.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {ordenadas.length > 0 && (
          <div className="paginacao">
            <button type="button" className="link-acao baixar" onClick={baixar} title={`Baixa as ${ordenadas.length.toLocaleString('pt-BR')} seções do resultado atual (com a busca e os filtros aplicados) em CSV`}>
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 3v11.2l4.1-4.1 1.4 1.4L12 17l-5.5-5.5 1.4-1.4 4.1 4.1V3h2ZM5 19h14v2H5v-2Z" fill="currentColor" /></svg>
              Baixar tabela
            </button>
            <div className="pag-ctl">
              <TextField select size="small" label="Linhas por página" value={tam} onChange={(e) => { setTam(Number(e.target.value)); setPag(0); }} slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}>
                {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </TextField>
              <span className="mostrando">Mostrando {p * tam + 1}–{Math.min((p + 1) * tam, ordenadas.length)} de {ordenadas.length.toLocaleString('pt-BR')}</span>
              <Pagination count={paginas} page={p + 1} onChange={(_, v) => { setPag(v - 1); document.getElementById('titulo-lista')?.scrollIntoView({ behavior: 'smooth' }); }} color="primary" shape="rounded" siblingCount={0} boundaryCount={1} aria-label="Paginação da tabela" />
            </div>
          </div>
        )}
      </div>
      <p className="note">Constar na lista não prova, por si só, que o local de votação mudou. {OFICIAL}</p>
    </section>
  );
}
