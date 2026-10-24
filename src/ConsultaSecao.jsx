import { useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete, Button, Chip, TextField } from '@mui/material';
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
export default function ConsultaSecao({ dados, onVerLista, forcarUf, onUf }) {
  const [c, setC] = useState(lerUrl);
  // o mapa escolheu (ou desmarcou) um estado: preenche o campo e limpa o município, que podia ser de outro estado
  useEffect(() => { if (forcarUf?.n) setC((x) => ({ ...x, uf: forcarUf.uf, mun: '' })); }, [forcarUf]);
  useEffect(() => { onUf?.(c.uf); }, [c.uf, onUf]);
  const registrada = useRef('');
  const set = (k, v) => setC((x) => ({ ...x, [k]: v }));
  useEffect(() => { gravarUrl(c); }, [c]);
  const preenchido = Boolean(c.uf || c.mun.trim() || c.zona || c.secao);
  const completo = Boolean(c.uf && c.mun.trim() && c.zona && c.secao);
  const achadas = useMemo(() => (preenchido ? filtrar(dados.linhas, { ...VAZIO, ...c }) : []), [dados, c, preenchido]);
  const todosMunicipios = useMemo(() => [...new Set(Object.values(dados.todosMunicipios).flat())].sort((a, b) => a.localeCompare(b, 'pt-BR')), [dados]);
  const sugestoes = c.uf ? dados.todosMunicipios[c.uf] || [] : todosMunicipios;
  // sugestões a partir da própria lista: municípios com seções alteradas (e quantas) vêm primeiro, depois os demais
  const indice = useMemo(() => { const m = new Map(); for (const l of dados.linhas) { const k = `${l.uf}|${l.municipio}`; const o = m.get(k) || { municipio: l.municipio, uf: l.uf, n: 0 }; o.n++; m.set(k, o); } return [...m.values()]; }, [dados]);
  const opcoesMun = useMemo(() => {
    const naLista = indice.filter((o) => !c.uf || o.uf === c.uf).sort((a, b) => b.n - a.n || a.municipio.localeCompare(b.municipio, 'pt-BR'))
      .map((o) => ({ label: o.municipio, uf: o.uf, n: o.n, grupo: 'Com seções alteradas na lista' }));
    const nomes = new Set(naLista.map((o) => norm(o.label)));
    const outros = sugestoes.filter((m) => !nomes.has(norm(m))).map((m) => ({ label: m, uf: '', n: 0, grupo: 'Outros municípios' }));
    return [...naLista, ...outros];
  }, [indice, sugestoes, c.uf]);
  const filtraMunSug = (ops, { inputValue }) => {
    const n = norm(inputValue); if (!n) return ops.slice(0, 80);
    const ok = ops.filter((o) => norm(o.label).includes(n));
    const rank = (o) => (norm(o.label).startsWith(n) ? 0 : 1);
    const lista = ok.filter((o) => o.n > 0).sort((a, b) => rank(a) - rank(b) || b.n - a.n), outros = ok.filter((o) => o.n === 0).sort((a, b) => rank(a) - rank(b));
    return [...lista, ...outros].slice(0, 80);
  };
  // zonas e seções que existem na lista para o que já foi preenchido (estado, município e, no caso das seções, a zona)
  const contagem = (campo) => {
    const nm = norm(c.mun), g = new Map();
    for (const l of dados.linhas) if ((!c.uf || l.uf === c.uf) && (!nm || l.mun.includes(nm)) && (campo === 'zona' || !c.zona || l.zona === Number(c.zona))) g.set(l[campo], (g.get(l[campo]) || 0) + 1);
    return g;
  };
  const zonasLista = useMemo(() => contagem('zona'), [dados, c.uf, c.mun]);   // eslint-disable-line react-hooks/exhaustive-deps
  const secoesLista = useMemo(() => contagem('secao'), [dados, c.uf, c.mun, c.zona]);   // eslint-disable-line react-hooks/exhaustive-deps
  // só estado e/ou município (sem zona nem seção) e nada encontrado: diz que não há registro naquele local
  const semZonaSecao = Boolean((c.uf || c.mun.trim()) && !c.zona && !c.secao && (!c.mun.trim() || sugestoes.some((m) => norm(m) === norm(c.mun))));
  // 5.500 cidades: filtra sem acento e mostra no máximo 80 por vez
  const filtraMun = (ops, { inputValue }) => { const n = norm(inputValue); return (n ? ops.filter((m) => norm(m).includes(n)) : ops).slice(0, 80); };
  // registro anônimo da consulta: só depois de 1,5 s sem digitar, e o município só vai se for um nome da lista (nunca texto livre)
  useEffect(() => {
    const local = ['localhost', '127.0.0.1', ''].includes(location.hostname);
    if (!preenchido || !import.meta.env.PROD || local) return undefined;
    const t = setTimeout(() => {
      const nm = norm(c.mun.trim());
      const mun = nm ? (sugestoes.find((m) => norm(m) === nm) || '') : '';
      const corpo = { uf: c.uf, mun, zona: c.zona, secao: c.secao, n: achadas.length };
      const chave = JSON.stringify(corpo);
      if (!(corpo.uf || corpo.mun || corpo.zona || corpo.secao) || chave === registrada.current) return;
      registrada.current = chave;
      fetch('/api/busca', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: chave, keepalive: true }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [c, preenchido, achadas, sugestoes]);
  // sugestões: só a zona → municípios que têm essa zona; município com seções alteradas → total e zonas
  const dica = useMemo(() => {
    const MAX = 12;
    if (c.zona && !c.uf && !c.mun.trim()) {
      const g = new Map();
      for (const l of dados.linhas) if (l.zona === Number(c.zona)) { const k = `${l.uf}|${l.municipio}`; g.set(k, (g.get(k) || 0) + 1); }
      const itens = [...g].map(([k, n]) => { const [uf, municipio] = k.split('|'); return { uf, municipio, n }; }).sort((a, b) => b.n - a.n || a.municipio.localeCompare(b.municipio, 'pt-BR'));
      return itens.length ? { tipo: 'zona', itens: itens.slice(0, MAX), resto: Math.max(0, itens.length - MAX), total: itens.length } : null;
    }
    const nm = norm(c.mun);
    if (nm && !c.zona && !c.secao) {
      const linhas = dados.linhas.filter((l) => l.mun === nm && (!c.uf || l.uf === c.uf));
      if (!linhas.length) return null;
      const z = new Map(); for (const l of linhas) z.set(l.zona, (z.get(l.zona) || 0) + 1);
      return { tipo: 'mun', nome: linhas[0].municipio, ufs: [...new Set(linhas.map((l) => l.uf))], n: linhas.length, zonas: [...z].sort((a, b) => a[0] - b[0]) };
    }
    return null;
  }, [dados, c]);
  const campoNum = (k, rotulo, ph, mapa) => {
    const opcoes = [...mapa.keys()].sort((x, y) => x - y).map(String);
    return (
      <Autocomplete size="small" freeSolo openOnFocus options={opcoes} inputValue={c[k]} onInputChange={(_, v) => set(k, String(v).replace(/\D/g, ''))}
        filterOptions={(ops, { inputValue }) => (inputValue ? ops.filter((o) => o.startsWith(inputValue)) : ops).slice(0, 40)}
        renderOption={(props, o) => { const { key, ...resto } = props; return <li key={key} {...resto}><span>{k === 'zona' ? 'Zona' : 'Seção'} <strong>{o}</strong></span>{k === 'zona' && <span className="op-n">{mapa.get(Number(o))} {mapa.get(Number(o)) === 1 ? 'seção alterada' : 'seções alteradas'}</span>}</li>; }}
        renderInput={(params) => <TextField {...params} label={rotulo} placeholder={ph} inputProps={{ ...params.inputProps, inputMode: 'numeric', pattern: '[0-9]*' }} slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps?.inputLabel, shrink: true } }} />} />
    );
  };

  return (
    <section className="consulta" aria-labelledby="titulo-consulta">
      <div className="consulta-cab">
        <h2 id="titulo-consulta">Encontre a sua seção</h2>
        <p>Preencha o que souber — estado, município, zona ou seção. Todos os campos são opcionais.</p>
      </div>
      <form className="form-linha" onSubmit={(e) => e.preventDefault()} noValidate>
        <Autocomplete size="small" options={dados.todasUfs} value={c.uf || null} onChange={(_, v) => setC((x) => ({ ...x, uf: v || '', mun: '' }))}
          getOptionLabel={(u) => (u ? `${u} — ${nomeEstado(u)}` : '')} isOptionEqualToValue={(a, b) => a === b}
          filterOptions={(ops, { inputValue }) => { const n = norm(inputValue); return ops.filter((u) => norm(`${u} ${nomeEstado(u)}`).includes(n)); }}
          noOptionsText="Nenhum estado" renderInput={(params) => <TextField {...params} label="Estado" placeholder="Nome ou sigla" slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps?.inputLabel, shrink: true } }} />} />
        <Autocomplete size="small" freeSolo options={opcoesMun} filterOptions={filtraMunSug} groupBy={(o) => o.grupo} getOptionLabel={(o) => (typeof o === 'string' ? o : o.label)}
          isOptionEqualToValue={(a, b) => a.label === b.label && a.uf === b.uf} inputValue={c.mun} onInputChange={(_, v) => set('mun', v)}
          onChange={(_, v) => { if (v && typeof v === 'object') setC((x) => ({ ...x, mun: v.label, uf: x.uf || v.uf })); }} noOptionsText="Nenhum município"
          renderOption={(props, o) => { const { key, ...resto } = props; return <li key={`${o.label}-${o.uf}`} {...resto}><span>{o.label}{o.uf ? <> · <span className="op-uf">{o.uf}</span></> : null}</span>{o.n > 0 && <span className="op-n">{o.n} {o.n === 1 ? 'seção alterada' : 'seções alteradas'}</span>}</li>; }}
          renderInput={(params) => <TextField {...params} label="Município" placeholder="Digite o município" slotProps={{ ...params.slotProps, inputLabel: { ...params.slotProps?.inputLabel, shrink: true } }} />} />
        {campoNum('zona', 'Zona', 'Ex.: 12', zonasLista)}
        {campoNum('secao', 'Seção', 'Ex.: 345', secoesLista)}
        <Button className="btn-limpar" variant="text" color="inherit" type="button" onClick={() => setC({ uf: '', mun: '', zona: '', secao: '' })} disabled={!preenchido}>Limpar</Button>
      </form>

      {dica?.tipo === 'zona' && (
        <div className="dica" role="group" aria-label="Sugestões de município">
          <p>A zona {Number(c.zona)} aparece {dica.total === 1 ? 'em 1 município' : `em ${dica.total} municípios`} da lista. É o seu?</p>
          <div className="dica-chips">
            {dica.itens.map((i) => <Chip key={i.uf + i.municipio} size="small" variant="outlined" clickable label={`${i.municipio} · ${i.uf} (${i.n})`} onClick={() => setC((x) => ({ ...x, uf: i.uf, mun: i.municipio }))} />)}
            {dica.resto > 0 && <span className="dica-mais">+ {dica.resto}</span>}
          </div>
        </div>
      )}
      {dica?.tipo === 'mun' && (
        <div className="dica" role="note">
          <p><strong>{dica.nome}{dica.ufs.length === 1 ? ` · ${dica.ufs[0]}` : ''}</strong> tem {dica.n} {dica.n === 1 ? 'seção alterada' : 'seções alteradas'}, em {dica.zonas.length} {dica.zonas.length === 1 ? 'zona' : 'zonas'}. Filtre pela sua zona:</p>
          <div className="dica-chips">
            {dica.zonas.map(([z, n]) => <Chip key={z} size="small" variant="outlined" clickable label={`Zona ${z} (${n})`} onClick={() => set('zona', String(z))} />)}
          </div>
        </div>
      )}

      <div className="consulta-res" aria-live="polite">
        {!preenchido && <p className="res-vazio">Os resultados aparecem aqui assim que você preencher qualquer campo.</p>}
        {preenchido && achadas.length === 0 && (completo ? (
          <div className="vazio-res ok" role="status">
            <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm4.3 4.8-5.1 5.1-2.5-2.5-1.4 1.4 3.9 3.9 6.5-6.5-1.4-1.4Z" fill="currentColor" /></svg>
            <p className="vazio-tit">Segundo a última atualização do TSE, a sua seção não consta como alterada</p>
            <p className="vazio-txt">Não há mudança de local de votação registrada para {c.mun.trim()} · {c.uf}, zona {Number(c.zona)}, seção {Number(c.secao)}, na versão mais recente da lista divulgada pelo TSE.</p>
            <p className="vazio-nota"><strong>Mesmo assim, confirme no e-Título.</strong> A lista pode estar desatualizada ou incompleta, e isso não garante que o local de votação seja o mesmo. Use o aplicativo e-Título ou o Autoatendimento Eleitoral do TSE antes de ir votar.</p>
          </div>
        ) : semZonaSecao ? (
          <div className="vazio-res" role="status">
            <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm4.3 4.8-5.1 5.1-2.5-2.5-1.4 1.4 3.9 3.9 6.5-6.5-1.4-1.4Z" fill="currentColor" /></svg>
            <p className="vazio-tit">Sem registro de seções alteradas na região</p>
            <p className="vazio-txt">Na versão mais recente da lista do TSE, não consta nenhuma seção com mudança de local de votação nesta região.</p>
            <p className="vazio-nota"><strong>Mesmo assim, confirme no e-Título.</strong> A lista pode estar desatualizada ou incompleta, e isso não garante que o local de votação seja o mesmo. Use o aplicativo e-Título ou o Autoatendimento Eleitoral do TSE antes de ir votar.</p>
          </div>
        ) : (
          <div className="vazio-res" role="status">
            <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M10 3a7 7 0 1 0 4.2 12.6l4.6 4.6 1.4-1.4-4.6-4.6A7 7 0 0 0 10 3Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm-2.1 2.9L10 10l-2.1 2.1 1.4 1.4L11.4 11.4l2.1 2.1 1.4-1.4L12.8 10l2.1-2.1-1.4-1.4-2.1 2.1-2.1-2.1-1.4 1.4Z" fill="currentColor" /></svg>
            <p className="vazio-tit">Nenhuma seção alterada com esses dados</p>
            <p className="vazio-txt">Na versão mais recente da lista do TSE, nenhuma seção com mudança de local de votação corresponde ao que você preencheu. Preencha estado, município, zona e seção para uma resposta mais precisa.</p>
            <p className="vazio-nota"><strong>Confirme no e-Título.</strong> Esta consulta não é oficial e a lista pode estar desatualizada.</p>
          </div>
        ))}
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
