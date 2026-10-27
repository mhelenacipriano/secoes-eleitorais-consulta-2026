# Sua seção eleitoral mudou? · Consulta 2026

Página estática onde o eleitor informa **estado, município, zona e seção** e vê se a seção consta na **lista mais recente** de locais de votação alterados para o 2º turno de 2026, com o local onde votava e onde vai votar. Também dá para explorar a lista completa.

- Página publicada: <https://www.secoes-eleitorais-consulta-2026.app/>
- Análise completa dos dados (repositório irmão): <https://github.com/mhelenacipriano/secoes-eleitorais-analise>

> **Aviso.** Projeto independente, sem fins lucrativos e sem vínculo com a Justiça Eleitoral. Não é um canal oficial. A consulta mostra apenas se a seção aparece na lista divulgada pelo TSE, que pode estar desatualizada ou incompleta. **Confirme sempre o seu local de votação no aplicativo e-Título ou no Autoatendimento Eleitoral do TSE.**

## O que a página faz

- **Encontre a sua seção:** todos os campos são opcionais; qualquer um já mostra resultados. Os cinco primeiros resultados aparecem na hora, com link para a lista completa já filtrada.
- **Sugestões ao digitar:** no município, as cidades com seções alteradas aparecem primeiro, com a quantidade; no campo da zona e da seção, só as que existem na lista para o que já foi preenchido. No celular o campo sobe para o topo ao tocar, para o teclado não cobrir a lista.
- **Mapa do Brasil clicável:** toque num estado para ver as seções dele na lista completa.
- **Lista completa:** busca por palavra, filtros, ordenação e paginação, com os locais de origem e destino.
- **Aviso do TSE no topo:** última atualização, próxima prevista, quando a lista foi baixada e quando o painel do TSE foi conferido pela última vez. Tudo vem dos metadados da lista, sem datas escritas à mão.
- **Links compartilháveis:** a consulta fica na URL (`#uf=RS&m=catuipe&z=23&s=370`) e a tabela usa o prefixo `t` (`#tq=escola&tuf=MG`).
- Tema claro e escuro.

## Como rodar

Requisitos: Node.js 20 ou mais novo.

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # gera dist/ (hospedagem estática)
npm run preview  # serve o dist/ localmente
```

### Estrutura

```
src/                    React 18 + Vite + MUI (ConsultaSecao, BuscaSecoes, MapaEstados, AvisoTse...)
public/secoes.json      a lista mais recente + meta (datas) + historico (uma linha por lista)
public/municipios.json  todos os municípios do Brasil (IBGE), para a busca
dados-fonte/            o CSV oficial da lista mais recente
api/                    funções da Vercel (contador, curtidas, registro de buscas)
scripts/                gerar-dados.mjs, aplicar-painel.mjs, gerar-municipios.mjs, gerar-mapa.py
```

## Dados

`public/secoes.json` guarda só o necessário para a consulta: UF, município, zona, seção, onde votava, onde vai votar e eleitores da seção. Não há votos nem dados pessoais. O mapa do Brasil (`src/mapaBrasil.js`) é gerado por `scripts/gerar-mapa.py` a partir das malhas do IBGE.

## Atualizando a lista

O TSE publica novas versões várias vezes por dia (perto de 06:27, 11:27, 15:27 e 20:27, horário de Brasília). Desde 22/10/2026 o arquivo vem com **todas as seções do país**, com o local final em branco nas que não mudaram; o script já descarta essas linhas.

```bash
# link do .csv.zip no CDN do TSE (ou um .zip/.csv local)
node scripts/gerar-dados.mjs <link | arquivo> [--publicada-em 2026-10-20T15:27:55-03:00] [--fonte texto]

# copia para public/secoes.json a última conferência do painel feita pela análise
node scripts/aplicar-painel.mjs
```

`gerar-dados.mjs` baixa, confere (colunas, seções repetidas, tamanho plausível), compara com a lista atual (se for igual, não faz nada; diferenças só de espaços não contam) e grava `public/secoes.json` com a lista, a data de publicação e de download e uma linha no histórico. A data de publicação vem do link do CDN (`…/20261022_062810/…`).

**Pelo GitHub.** Em *Actions*:

- *Atualizar lista do TSE (automático)* → *Run workflow*: lê o link da lista mais recente descoberto pelo repositório da análise (onde está o código que lê o painel do TSE) e atualiza a busca. Rode o da análise primeiro.
- *Atualizar lista do TSE* → *Run workflow* → cole o link do `.csv.zip`.

Os dois workflows estão **sem agendamento**. Para rodarem sozinhos, acrescente em `on:` um bloco `schedule` com `cron` em UTC (o GitHub pode atrasar ou pular execuções agendadas).

O painel do SIG/TSE bloqueia servidores em nuvem e não tem link de download na página; quem o lê é a rotina do repositório da análise (`scripts/raspar-painel.mjs` e `scripts/atualizar-tudo.mjs`, com `CONSULTA_DIR` apontando para este projeto).

## Deploy na Vercel

Site estático: importe o repositório em vercel.com/new (a Vercel detecta Vite: build `npm run build`, saída `dist`). Variáveis de ambiente (as `VITE_` entram no build, então exigem novo deploy):

| Variável | Para quê |
| --- | --- |
| `VITE_ANALISE_URL` | Endereço da análise completa (o botão do rodapé). Padrão: o site publicado da análise |
| `KV_REST_API_URL` e `KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`) | Redis do contador, das curtidas e do registro de buscas (opcional) |
| `STATS_TOKEN` | Senha da página de estatísticas (opcional) |

## Contador, curtidas e estatísticas (opcional)

Sem as variáveis acima o site funciona normalmente e esses recursos ficam desligados.

- **Contador de acessos:** anônimo, sem cookies, sem IP, sem dados pessoais. Conta acessos no total, por dia e quem está no site agora. Não conta em desenvolvimento.
- **Curtidas:** botão de estrela no canto da tela; a curtida vale só até fechar a aba e o servidor conta uma por sessão. Com "reduzir movimento" ligado no aparelho, a animação aparece sem deslocamento.
- **Registro de buscas:** só estado, zona, seção e o município **se for um nome da lista** (nunca texto livre), depois de 1,5 s sem digitar.
- **Estatísticas:** abra `https://SEU-SITE/#estatisticas` e entre com o `STATS_TOKEN`.

Para ligar: na Vercel, *Storage → Create Database → Upstash (Redis)* → *Connect Project*; crie `STATS_TOKEN` em *Settings → Environment Variables* e faça um novo deploy.

## Licença

Ainda não definida. Se quiser reutilizar o código, abra uma issue.
