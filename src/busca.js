import { useEffect, useState } from 'react';
import { nomeEstado } from './estados.js';

export const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim().replace(/\s+/g, ' ');

/** Carrega public/secoes.json uma única vez e prepara os textos de busca. */
export function useDados() {
  const [estado, setEstado] = useState({ dados: null, erro: null });
  useEffect(() => {
    let vivo = true;
    fetch('./secoes.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Erro ' + r.status))))
      .then(({ dados }) => {
        const linhas = dados.map(([uf, municipio, zona, secao, ondeVotava, ondeVaiVotar, eleitores]) => ({
          uf, estado: nomeEstado(uf), municipio, mun: norm(municipio), zona, secao, ondeVotava, ondeVaiVotar, eleitores,
          ini: norm(ondeVotava), fin: norm(ondeVaiVotar),
          // busca por palavra-chave: sigla, nome do estado, município, zona, seção e os dois locais
          hay: norm(`${uf} ${nomeEstado(uf)} ${municipio} zona ${zona} secao ${secao} Z${zona} S${secao} ${ondeVotava} ${ondeVaiVotar}`),
        })).map((l) => ({ ...l, palavras: new Set(l.hay.split(/[^A-Z0-9]+/).filter(Boolean)) }));
        const ufs = [...new Set(linhas.map((l) => l.uf))].sort((a, b) => nomeEstado(a).localeCompare(nomeEstado(b), 'pt-BR'));
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
