import { useEffect, useState } from 'react';

export const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim().replace(/\s+/g, ' ');

/** Carrega public/secoes.json uma única vez. */
export function useDados() {
  const [estado, setEstado] = useState({ dados: null, erro: null });
  useEffect(() => {
    let vivo = true;
    fetch('./secoes.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Erro ' + r.status))))
      .then(({ dados }) => {
        const linhas = dados.map(([uf, municipio, zona, secao, localInicial, localFinal, listas]) => ({ uf, municipio, mun: norm(municipio), zona, secao, localInicial, localFinal, listas }));
        const ufs = [...new Set(linhas.map((l) => l.uf))].sort();
        const municipios = {};
        for (const l of linhas) (municipios[l.uf] ||= new Set()).add(l.municipio);
        for (const k of Object.keys(municipios)) municipios[k] = [...municipios[k]].sort((a, b) => a.localeCompare(b, 'pt-BR'));
        vivo && setEstado({ dados: { linhas, ufs, municipios }, erro: null });
      })
      .catch((erro) => vivo && setEstado({ dados: null, erro }));
    return () => { vivo = false; };
  }, []);
  return estado;
}

/**
 * Procura a seção. Devolve:
 *  - { tipo: 'achou', secao }
 *  - { tipo: 'nao', municipioConsta, secoesNoMunicipio }  (não consta nas listas analisadas)
 */
export function procurar(dados, { uf, municipio, zona, secao }) {
  const m = norm(municipio), z = Number(zona), s = Number(secao);
  const doMun = dados.linhas.filter((l) => l.uf === uf && l.mun === m);
  const achou = doMun.find((l) => l.zona === z && l.secao === s);
  if (achou) return { tipo: 'achou', secao: achou };
  return { tipo: 'nao', municipioConsta: doMun.length > 0, municipioNome: doMun[0]?.municipio, secoesNoMunicipio: doMun.length };
}
