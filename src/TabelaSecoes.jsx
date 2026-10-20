import { useMemo, useState } from 'react';
import { LISTAS } from './config.js';
import { norm } from './busca.js';

const VAZIO = { q: '', uf: '', mun: '', zona: '', secao: '', ini: '', fin: '', listas: [false, false, false, false], ultima: '' };
const COLUNAS = [
  ['uf', 'UF'], ['municipio', 'Município'], ['zona', 'Zona'], ['secao', 'Seção'], ['localInicial', 'Local inicial'], ['localFinal', 'Local final'], ['listas', 'Listas'],
];
const NOMES_CURTOS = ['18/10 · 11h', '18/10 · 17h', '19/10 · 11h', 'Lista de 438'];

function filtrar(linhas, f) {
  const toks = norm(f.q).split(' ').filter(Boolean);
  const mun = norm(f.mun), ini = norm(f.ini), fin = norm(f.fin);
  const zona = f.zona.trim() === '' ? null : Number(f.zona), secao = f.secao.trim() === '' ? null : Number(f.secao);
  const exigidas = f.listas.reduce((m, on, i) => (on ? m | (1 << i) : m), 0);
  return linhas.filter((l) =>
    (!f.uf || l.uf === f.uf) && (!mun || l.mun.includes(mun)) && (zona == null || l.zona === zona) && (secao == null || l.secao === secao)
    && (!ini || l.ini.includes(ini)) && (!fin || l.fin.includes(fin)) && (l.listas & exigidas) === exigidas
    && (!f.ultima || (f.ultima === 'consta' ? (l.listas & 8) !== 0 : (l.listas & 8) === 0))
    && toks.every((t) => l.hay.includes(t)));
}

const csv = (linhas) => {
  const esc = (v) => (/[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const cab = ['UF', 'Município', 'Zona', 'Seção', 'Local inicial', 'Local final', ...LISTAS.map((l) => l.nome)];
  const corpo = linhas.map((l) => [l.uf, l.municipio, l.zona, l.secao, l.localInicial, l.localFinal, ...LISTAS.map((x) => (l.listas & (1 << (x.id - 1)) ? 'Sim' : 'Não'))].map(esc).join(';'));
  return '﻿' + [cab.map(esc).join(';'), ...corpo].join('\r\n');
};

function Chips({ mask }) {
  return (
    <span className="chips">
      {LISTAS.map((l) => {
        const tem = (mask & (1 << (l.id - 1))) !== 0;
        return <i key={l.id} className={tem ? 'on' : ''} title={`${l.nome}: ${tem ? 'consta' : 'não consta'}`}>{l.id}<span className="sr"> {l.nome}: {tem ? 'consta' : 'não consta'}</span></i>;
      })}
    </span>
  );
}

export default function TabelaSecoes({ dados }) {
  const [f, setF] = useState(VAZIO);
  const [ord, setOrd] = useState({ key: 'uf', dir: 1 });
  const [pag, setPag] = useState(0);
  const [tam, setTam] = useState(25);
  const [aberto, setAberto] = useState(() => typeof window !== 'undefined' && window.innerWidth > 760);
  const set = (k, v) => { setPag(0); setF((x) => ({ ...x, [k]: v })); };
  const ativos = Object.entries(f).filter(([k, v]) => (k === 'listas' ? v.some(Boolean) : v !== '')).length;

  const filtradas = useMemo(() => filtrar(dados.linhas, f), [dados, f]);
  const ordenadas = useMemo(() => {
    const { key, dir } = ord;
    return [...filtradas].sort((a, b) => {
      const x = a[key], y = b[key];
      const c = typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'pt-BR');
      return (c || a.uf.localeCompare(b.uf) || a.municipio.localeCompare(b.municipio, 'pt-BR') || a.zona - b.zona || a.secao - b.secao) * dir;
    });
  }, [filtradas, ord]);
  const paginas = Math.max(1, Math.ceil(ordenadas.length / tam));
  const p = Math.min(pag, paginas - 1);
  const visiveis = ordenadas.slice(p * tam, (p + 1) * tam);
  const sugestoes = f.uf ? dados.municipios[f.uf] || [] : [];

  const ordenar = (key) => { setPag(0); setOrd((o) => (o.key === key ? { key, dir: -o.dir } : { key, dir: 1 })); };
  const baixar = () => {
    const url = URL.createObjectURL(new Blob([csv(ordenadas)], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'secoes-alteradas.csv' });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  return (
    <section className="lista-completa" aria-labelledby="titulo-lista">
      <header>
        <p className="eyebrow">Lista completa</p>
        <h2 id="titulo-lista">Todas as seções das listas analisadas</h2>
        <p className="sub">Veja as {dados.linhas.length.toLocaleString('pt-BR')} seções que apareceram em pelo menos uma das quatro listas. Use a busca ou filtre por qualquer coluna — nenhum filtro é obrigatório.</p>
      </header>

      <div className="busca-rapida">
        <label className="sr" htmlFor="busca-geral">Buscar em toda a lista</label>
        <input id="busca-geral" type="search" placeholder="Buscar município, local, zona ou seção" value={f.q} onChange={(e) => set('q', e.target.value)} />
      </div>

      <details className="filtros" open={aberto} onToggle={(e) => setAberto(e.currentTarget.open)}>
        <summary>Filtros por coluna{ativos > 0 && <span className="count">{ativos}</span>}</summary>
        <div className="filtros-grid">
          <label>UF
            <select value={f.uf} onChange={(e) => { setPag(0); setF((x) => ({ ...x, uf: e.target.value, mun: '' })); }}>
              <option value="">Todas</option>
              {dados.ufs.map((u) => <option key={u} value={u}>{u === 'ZZ' ? 'ZZ (exterior)' : u}</option>)}
            </select>
          </label>
          <label>Município
            <input list="mun-filtro" value={f.mun} onChange={(e) => set('mun', e.target.value)} placeholder="Contém…" autoComplete="off" />
            <datalist id="mun-filtro">{sugestoes.map((m) => <option key={m} value={m} />)}</datalist>
          </label>
          <label>Zona<input inputMode="numeric" pattern="[0-9]*" value={f.zona} onChange={(e) => set('zona', e.target.value.replace(/\D/g, ''))} placeholder="Ex.: 12" /></label>
          <label>Seção<input inputMode="numeric" pattern="[0-9]*" value={f.secao} onChange={(e) => set('secao', e.target.value.replace(/\D/g, ''))} placeholder="Ex.: 345" /></label>
          <label>Local inicial<input value={f.ini} onChange={(e) => set('ini', e.target.value)} placeholder="Contém…" /></label>
          <label>Local final<input value={f.fin} onChange={(e) => set('fin', e.target.value)} placeholder="Contém…" /></label>
          <fieldset className="listas-filtro">
            <legend>Aparece em</legend>
            {LISTAS.map((l, i) => (
              <label key={l.id} className="check"><input type="checkbox" checked={f.listas[i]} onChange={(e) => set('listas', f.listas.map((v, j) => (j === i ? e.target.checked : v)))} />{NOMES_CURTOS[i]}</label>
            ))}
          </fieldset>
          <label>Na lista de 438
            <select value={f.ultima} onChange={(e) => set('ultima', e.target.value)}>
              <option value="">Tanto faz</option>
              <option value="consta">Consta</option>
              <option value="fora">Não consta (saiu)</option>
            </select>
          </label>
          <label className="so-mobile">Ordenar por
            <select value={`${ord.key}:${ord.dir}`} onChange={(e) => { const [key, dir] = e.target.value.split(':'); setOrd({ key, dir: Number(dir) }); }}>
              {COLUNAS.map(([k, n]) => [<option key={k + 1} value={`${k}:1`}>{n} (A–Z)</option>, <option key={k + 2} value={`${k}:-1`}>{n} (Z–A)</option>])}
            </select>
          </label>
        </div>
        <div className="filtros-acoes"><button type="button" className="btn" onClick={() => { setF(VAZIO); setPag(0); }} disabled={ativos === 0}>Limpar filtros</button></div>
      </details>

      <div className="resumo-tabela" aria-live="polite">
        <span><strong>{ordenadas.length.toLocaleString('pt-BR')}</strong> de {dados.linhas.length.toLocaleString('pt-BR')} seções</span>
        <button type="button" className="btn" onClick={baixar} disabled={!ordenadas.length}>Baixar CSV</button>
      </div>
      <p className="legenda-listas"><Chips mask={15} /> Listas: 1 = 18/10 · 11h · 2 = 18/10 · 17h · 3 = 19/10 · 11h · 4 = lista de 438 (data não informada)</p>

      {ordenadas.length === 0 ? (
        <div className="vazio"><p>Nenhuma seção encontrada com esses filtros.</p><button type="button" className="btn" onClick={() => { setF(VAZIO); setPag(0); }}>Limpar filtros</button></div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <caption className="sr">Seções das listas de locais de votação alterados</caption>
            <thead>
              <tr>
                {COLUNAS.map(([k, n]) => (
                  <th key={k} scope="col" aria-sort={ord.key === k ? (ord.dir > 0 ? 'ascending' : 'descending') : 'none'}>
                    <button type="button" onClick={() => ordenar(k)}>{n}{ord.key === k ? (ord.dir > 0 ? ' ↑' : ' ↓') : ''}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiveis.map((l) => (
                <tr key={`${l.uf}-${l.municipio}-${l.zona}-${l.secao}`}>
                  <td data-label="UF">{l.uf}</td><td data-label="Município">{l.municipio}</td><td data-label="Zona">{l.zona}</td><td data-label="Seção">{l.secao}</td>
                  <td data-label="Local inicial">{l.localInicial}</td><td data-label="Local final">{l.localFinal}</td><td data-label="Listas"><Chips mask={l.listas} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ordenadas.length > 0 && (
        <div className="paginacao">
          <label>Linhas por página
            <select value={tam} onChange={(e) => { setTam(Number(e.target.value)); setPag(0); }}>{[25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}</select>
          </label>
          <span>{p * tam + 1}–{Math.min((p + 1) * tam, ordenadas.length)} de {ordenadas.length.toLocaleString('pt-BR')}</span>
          <button type="button" className="btn" disabled={p === 0} onClick={() => setPag(p - 1)}>Anterior</button>
          <button type="button" className="btn" disabled={p >= paginas - 1} onClick={() => setPag(p + 1)}>Próxima</button>
        </div>
      )}
      <p className="note">Constar numa lista não prova que o local de votação mudou: as listas foram revisadas várias vezes. Confirme no canal oficial da Justiça Eleitoral.</p>
    </section>
  );
}
