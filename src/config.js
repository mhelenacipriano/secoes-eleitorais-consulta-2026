// Endereço da análise completa. Pode ser trocado com VITE_ANALISE_URL no build.
export const ANALISE_URL = import.meta.env.VITE_ANALISE_URL || 'https://secoes-eleitorais-analise.vercel.app/';

// Painel "Capilaridade" do SIG/TSE, de onde vem a lista mais recente usada nesta busca.
export const FONTE_URL = 'https://sig.tse.jus.br/ords/dwapr/r/seai/sig-eleicao-eleitorado/painel-capilaridade';

// Versões datadas da lista de seções com local alterado (contagens conferidas no CSV da análise).
export const VERSOES = [
  { quando: '18/10 às 11h', secoes: 2033 },
  { quando: '18/10 às 17h', secoes: 1396 },
  { quando: '19/10 às 11h', secoes: 554 },
];

// Chamada para a análise completa no rodapé (e a menção a ela no aviso do topo). Escondida por enquanto,
// enquanto a análise é refinada: troque para true para voltar a exibir.
export const MOSTRAR_ANALISE = false;
