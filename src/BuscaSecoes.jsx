import { useEffect, useMemo, useState } from 'react';
import { Autocomplete, Button, InputAdornment, Pagination, TextField } from '@mui/material';
import { norm } from './busca.js';
import { nomeEstado } from './estados.js';
import ShareButton from './ShareButton.jsx';

export const VAZIO = { q: '', uf: '', mun: '', zona: '', secao: '', ini: '', fin: '' };
const CHAVES_URL = { q: 'q', uf: 'uf', mun: 'm', zona: 'z', secao: 's', ini: 'i', fin: 'f' };
const COLUNAS = [['secaoTxt', 'Seção'], ['ondeVotava', 'Onde votava'], ['ondeVaiVotar', 'Onde vai votar'], ['eleitores', 'Eleitores']];
const OFICIAL = 'Confirme o seu local de votação nos canais oficiais da Justiça Eleitoral (o TRE do seu estado ou o aplicativo e-Título) antes de ir votar.';

export const lerFiltros = () => {
  const p = new URLSearchParams(location.hash.replace(/^#\??/, ''));
  return Object.fromEntries(Object.entries(CHAVES_URL).map(([k, c]) => [k, p.get(c) || '']));
};
const gravarFiltros = (f) => {
  const p = new URLSearchParams();
  for (const [k, c] of Object.entries(CHAVES_URL)) if (f[k]) p.set(c, f[k]);
  history.replaceState(null, '', p.toString() ? '#' + p.toString() : location.pathname + location.search);
};

/** Palavras-chave: todas precisam aparecer. Termos curtos ou numéricos valem como palavra inteira (ex.: "PA" ou "355"). */
function filtrar(linhas, f) {
  const toks = norm(f.q).split(' ').filter(Boolean);
  const mun = norm(f.mun), ini = norm(f.ini), fin = norm(f.fin);
  const zona = f.zona === '' ? null : Number(f.zona), secao = f.secao === '' ? null : Number(f.secao);
  return linhas.filter((l) =>
    (!f.uf || l.uf === f.uf) && (!mun || l.mun.includes(mun)) && (zona == null || l.zona === zona) && (secao == null || l.secao === secao)
    && (!ini || l.ini.includes(ini)) && (!fin || l.fin.includes(fin))
    && toks.every((t) => (t.length <= 2 || /^\d+$/.test(t) ? l.palavras.has(t) : l.hay.includes(t))));
}

const csv = (linhas) => {
  const esc = (v) => (/[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const cab = ['UF', 'Estado', 'Município', 'Zona', 'Seção', 'Onde votava', 'Onde vai votar', 'Eleitores'];
  const corpo = linhas.map((l) => [l.uf, l.estado, l.municipio, l.zona, l.secao, l.ondeVotava, l.ondeVaiVotar, l.eleitores].map(esc).join(';'));
  return '﻿' + [cab.map(esc).join(';'), ...corpo].join('\r\n');
};

const Lupa = () => <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M10 3a7 7 0 1 0 4.2 12.6l4.6 4.6 1.4-1.4-4.6-4.6A7 7 0 0 0 10 3Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" fill="currentColor" /></svg>;
const campoNum = (v, set) => ({ value: v, onChange: (e) => set(e.target.value.replace(/\D/g, '')), slotProps: { htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' }, inputLabel: { shrink: true } } });

export default function BuscaSecoes({ dados }) {
  const [f, setF] = useState(lerFiltros);
  const [ord, setOrd] = useState({ key: 'secaoTxt', dir: 1 });
  const [pag, setPag] = useState(0);
  const [tam, setTam] = useState(25);
  const [aberto, setAberto] = useState(() => window.innerWidth > 760 || Object.entries(lerFiltros()).some(([k, v]) => k !== 'q' && v));
  const set = (k, v) => { setPag(0); setF((x) => ({ ...x, [k]: v })); };
  const ativos = Object.values(f).filter((v) => v !== '').length;
  useEffect(() => { gravarFiltros(f); }, [f]);

  const linhas = useMemo(() => dados.linhas.map((l) => ({ ...l, secaoTxt: `${l.uf} · ${l.municipio} · Z${l.zona} S${l.secao}` })), [dados]);
  const filtradas = useMemo(() => filtrar(linhas, f), [linhas, f]);
  const ordenadas = useMemo(() => {
    const { key, dir } = ord;
    return [...filtradas].sort((a, b) => {
      const x = a[key], y = b[key];
      const c = typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR', { numeric: true });
      return (c || a.uf.localeCompare(b.uf) || a.municipio.localeCompare(b.municipio, 'pt-BR') || a.zona - b.zona || a.secao - b.secao) * dir;
    });
  }, [filtradas, ord]);
  const paginas = Math.max(1, Math.ceil(ordenadas.length / tam));
  const p = Math.min(pag, paginas - 1);
  const visiveis = ordenadas.slice(p * tam, (p + 1) * tam);
  const todosMunicipios = useMemo(() => [...new Set(Object.values(dados.municipios).flat())].sort((a, b) => a.localeCompare(b, 'pt-BR')), [dados]);
  const sugestoes = f.uf ? dados.municipios[f.uf] || [] : todosMunicipios;
  const filtrando = ativos > 0;

  const ordenar = (key) => { setPag(0); setOrd((o) => (o.key === key ? { key, dir: -o.dir } : { key, dir: 1 })); };
  const limpar = () => { setF(VAZIO); setPag(0); };
  const baixar = () => {
    const url = URL.createObjectURL(new Blob([csv(ordenadas)], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'secoes-alteradas.csv' });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  return (
    <section className="lista-completa" aria-labelledby="titulo-lista">
      <h2 id="titulo-lista" className="sr">Buscar seções</h2>
      <div className="busca-rapida">
        <TextField id="busca-geral" type="search" fullWidth autoFocus={false} label="Buscar" placeholder="Cidade, estado, local, zona ou seção" value={f.q} onChange={(e) => set('q', e.target.value)}
          slotProps={{ inputLabel: { shrink: true }, input: { startAdornment: <InputAdornment position="start"><Lupa /></InputAdornment> } }} />
        <p className="dica-busca">Dica: tente “Rio Grande do Sul”, “RS”, “Catuípe” ou “Z23 S370”. Nenhum campo é obrigatório.</p>
      </div>

      <details className="filtros" open={aberto} onToggle={(e) => setAberto(e.currentTarget.open)}>
        <summary>Filtros por campo{ativos > 0 && <span className="count">{ativos}</span>}</summary>
        <div className="filtros-grid">
          <Autocomplete options={dados.ufs} value={f.uf || null} onChange={(_, v) => { setPag(0); setF((x) => ({ ...x, uf: v || '', mun: '' })); }}
            getOptionLabel={(u) => (u ? `${u} — ${nomeEstado(u)}` : '')} isOptionEqualToValue={(a, b) => a === b}
            filterOptions={(ops, { inputValue }) => { const n = norm(inputValue); return ops.filter((u) => norm(`${u} ${nomeEstado(u)}`).includes(n)); }}
            noOptionsText="Nenhum estado" renderInput={(params) => <TextField {...params} label="Estado" placeholder="Nome ou sigla" slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps?.inputLabel, shrink: true } }} />} />
          <Autocomplete freeSolo options={sugestoes} inputValue={f.mun} onInputChange={(_, v) => set('mun', v)} noOptionsText="Nenhum município"
            renderInput={(params) => <TextField {...params} label="Município" placeholder="Contém…" slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps?.inputLabel, shrink: true } }} />} />
          <TextField label="Zona" placeholder="Ex.: 12" {...campoNum(f.zona, (v) => set('zona', v))} />
          <TextField label="Seção" placeholder="Ex.: 345" {...campoNum(f.secao, (v) => set('secao', v))} />
          <TextField label="Onde votava" placeholder="Contém…" value={f.ini} onChange={(e) => set('ini', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Onde vai votar" placeholder="Contém…" value={f.fin} onChange={(e) => set('fin', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField select className="so-mobile" label="Ordenar por" value={`${ord.key}:${ord.dir}`} onChange={(e) => { const [key, dir] = e.target.value.split(':'); setOrd({ key, dir: Number(dir) }); }} slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}>
            {COLUNAS.flatMap(([k, n]) => [<option key={k + 1} value={`${k}:1`}>{n} (A–Z)</option>, <option key={k + 2} value={`${k}:-1`}>{n} (Z–A)</option>])}
          </TextField>
        </div>
      </details>

      <div className="resumo-tabela" aria-live="polite">
        <span><strong>{ordenadas.length.toLocaleString('pt-BR')}</strong> de {dados.linhas.length.toLocaleString('pt-BR')} seções{filtrando ? ' encontradas' : ' na lista mais recente'}</span>
        <div className="resumo-acoes">
          {filtrando && <Button variant="text" color="inherit" onClick={limpar}>Limpar busca</Button>}
          <ShareButton className="btn" titulo="Sua seção eleitoral mudou?" texto="Consulte se a sua seção consta na lista mais recente de locais de votação alterados.">Copiar link da busca</ShareButton>
          <Button variant="outlined" color="inherit" onClick={baixar} disabled={!ordenadas.length}>Baixar CSV</Button>
        </div>
      </div>

      {ordenadas.length === 0 ? (
        <div className="vazio" role="status">
          <p><strong>Nenhuma seção encontrada na lista mais recente.</strong></p>
          <p>Se você procurava a sua seção, ela não consta nessa lista. Confira estado, município, zona e seção no seu título de eleitor. {OFICIAL}</p>
          <Button variant="contained" onClick={limpar}>Limpar busca</Button>
        </div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <caption className="sr">Seções da lista mais recente de locais de votação alterados</caption>
            <thead>
              <tr>
                {COLUNAS.map(([k, n]) => (
                  <th key={k} scope="col" className={k === 'eleitores' ? 'num' : ''} aria-sort={ord.key === k ? (ord.dir > 0 ? 'ascending' : 'descending') : 'none'}>
                    <button type="button" onClick={() => ordenar(k)}>{n}{ord.key === k ? (ord.dir > 0 ? ' ↑' : ' ↓') : ''}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiveis.map((l) => (
                <tr key={l.secaoTxt}>
                  <td data-label="Seção" className="c-secao"><span>{l.secaoTxt}</span><small>{l.estado}</small></td>
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
          <TextField select size="small" label="Linhas por página" value={tam} onChange={(e) => { setTam(Number(e.target.value)); setPag(0); }} slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}>
            {[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </TextField>
          <span>{p * tam + 1}–{Math.min((p + 1) * tam, ordenadas.length)} de {ordenadas.length.toLocaleString('pt-BR')}</span>
          <Pagination count={paginas} page={p + 1} onChange={(_, v) => { setPag(v - 1); document.getElementById('titulo-lista')?.scrollIntoView({ behavior: 'smooth' }); }} color="primary" shape="rounded" siblingCount={0} boundaryCount={1} aria-label="Paginação da tabela" />
        </div>
      )}
      <p className="note">Constar na lista não prova, por si só, que o local de votação mudou. {OFICIAL}</p>
    </section>
  );
}
