import { useMemo, useState } from 'react';
import { Autocomplete, Button, Checkbox, FormControlLabel, FormGroup, Pagination, TextField } from '@mui/material';
import { norm } from './busca.js';

const VAZIO = { q: '', uf: '', mun: '', zona: '', secao: '', ini: '', fin: '' };
const COLUNAS = [
  ['uf', 'UF'], ['municipio', 'Município'], ['zona', 'Zona'], ['secao', 'Seção'], ['localInicial', 'Local inicial'], ['localFinal', 'Local final'],
];

function filtrar(linhas, f) {
  const toks = norm(f.q).split(' ').filter(Boolean);
  const mun = norm(f.mun), ini = norm(f.ini), fin = norm(f.fin);
  const zona = f.zona.trim() === '' ? null : Number(f.zona), secao = f.secao.trim() === '' ? null : Number(f.secao);
  return linhas.filter((l) =>
    (!f.uf || l.uf === f.uf) && (!mun || l.mun.includes(mun)) && (zona == null || l.zona === zona) && (secao == null || l.secao === secao)
    && (!ini || l.ini.includes(ini)) && (!fin || l.fin.includes(fin))
    && toks.every((t) => l.hay.includes(t)));
}

const csv = (linhas) => {
  const esc = (v) => (/[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const cab = ['UF', 'Município', 'Zona', 'Seção', 'Local inicial', 'Local final'];
  const corpo = linhas.map((l) => [l.uf, l.municipio, l.zona, l.secao, l.localInicial, l.localFinal].map(esc).join(';'));
  return '\ufeff' + [cab.map(esc).join(';'), ...corpo].join('\r\n');
};

export default function TabelaSecoes({ dados }) {
  const [f, setF] = useState(VAZIO);
  const [ord, setOrd] = useState({ key: 'uf', dir: 1 });
  const [pag, setPag] = useState(0);
  const [tam, setTam] = useState(25);
  const [aberto, setAberto] = useState(() => typeof window !== 'undefined' && window.innerWidth > 760);
  const set = (k, v) => { setPag(0); setF((x) => ({ ...x, [k]: v })); };
  const ativos = Object.values(f).filter((v) => v !== '').length;

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
        <h2 id="titulo-lista">Todas as seções da lista mais recente</h2>
        <p className="sub">Veja as {dados.linhas.length.toLocaleString('pt-BR')} seções da lista mais recente de locais de votação alterados. Use a busca ou filtre por qualquer coluna — nenhum filtro é obrigatório.</p>
      </header>

      <div className="busca-rapida">
        <TextField id="busca-geral" type="search" fullWidth label="Buscar em toda a lista" placeholder="Município, local, zona ou seção" value={f.q} onChange={(e) => set('q', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      </div>

      <details className="filtros" open={aberto} onToggle={(e) => setAberto(e.currentTarget.open)}>
        <summary>Filtros por coluna{ativos > 0 && <span className="count">{ativos}</span>}</summary>
        <div className="filtros-grid">
          <TextField select label="UF" value={f.uf} onChange={(e) => { setPag(0); setF((x) => ({ ...x, uf: e.target.value, mun: '' })); }} slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}>
            <option value="">Todas</option>
            {dados.ufs.map((u) => <option key={u} value={u}>{u === 'ZZ' ? 'ZZ (exterior)' : u}</option>)}
          </TextField>
          <Autocomplete freeSolo options={sugestoes} inputValue={f.mun} onInputChange={(_, v) => set('mun', v)} noOptionsText="Nenhum município"
            renderInput={(params) => <TextField {...params} label="Município" placeholder="Contém…" slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps?.inputLabel, shrink: true } }} />} />
          <TextField label="Zona" value={f.zona} onChange={(e) => set('zona', e.target.value.replace(/\D/g, ''))} placeholder="Ex.: 12" slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' }, inputLabel: { shrink: true } }} />
          <TextField label="Seção" value={f.secao} onChange={(e) => set('secao', e.target.value.replace(/\D/g, ''))} placeholder="Ex.: 345" slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*' }, inputLabel: { shrink: true } }} />
          <TextField label="Local inicial" value={f.ini} onChange={(e) => set('ini', e.target.value)} placeholder="Contém…" slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Local final" value={f.fin} onChange={(e) => set('fin', e.target.value)} placeholder="Contém…" slotProps={{ inputLabel: { shrink: true } }} />
          <TextField select className="so-mobile" label="Ordenar por" value={`${ord.key}:${ord.dir}`} onChange={(e) => { const [key, dir] = e.target.value.split(':'); setOrd({ key, dir: Number(dir) }); }} slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}>
            {COLUNAS.flatMap(([k, n]) => [<option key={k + 1} value={`${k}:1`}>{n} (A–Z)</option>, <option key={k + 2} value={`${k}:-1`}>{n} (Z–A)</option>])}
          </TextField>
        </div>
        <div className="filtros-acoes"><Button variant="outlined" color="inherit" onClick={() => { setF(VAZIO); setPag(0); }} disabled={ativos === 0}>Limpar filtros</Button></div>
      </details>

      <div className="resumo-tabela" aria-live="polite">
        <span><strong>{ordenadas.length.toLocaleString('pt-BR')}</strong> de {dados.linhas.length.toLocaleString('pt-BR')} seções</span>
        <Button variant="outlined" color="inherit" onClick={baixar} disabled={!ordenadas.length}>Baixar CSV</Button>
      </div>

      {ordenadas.length === 0 ? (
        <div className="vazio"><p>Nenhuma seção encontrada com esses filtros.</p><Button variant="contained" onClick={() => { setF(VAZIO); setPag(0); }}>Limpar filtros</Button></div>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela">
            <caption className="sr">Seções da lista mais recente de locais de votação alterados</caption>
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
                  <td data-label="Local inicial">{l.localInicial}</td><td data-label="Local final">{l.localFinal}</td>
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
      <p className="note">Constar na lista não prova, por si só, que o local de votação mudou. Confirme no canal oficial da Justiça Eleitoral.</p>
    </section>
  );
}
