// Endereço da análise completa. Pode ser trocado com VITE_ANALISE_URL no build.
export const ANALISE_URL = import.meta.env.VITE_ANALISE_URL || 'https://secoes-eleitorais-analise.vercel.app/';

// Painel "Seções alteradas" do SIG/TSE, de onde vem a lista mais recente usada nesta busca.
export const FONTE_URL = 'https://sig.tse.jus.br/ords/dwapr/r/seai/sig-eleicao-eleitorado/se%C3%A7%C3%B5es-alteradas';

// Chamada para a análise completa no rodapé (e a menção a ela no aviso do topo). Escondida por enquanto,
// enquanto a análise é refinada: troque para true para voltar a exibir.
export const MOSTRAR_ANALISE = true;

// Texto do botão de curtida (canto da tela).
export const TEXTO_CURTIDA = 'vamo no 13!';
