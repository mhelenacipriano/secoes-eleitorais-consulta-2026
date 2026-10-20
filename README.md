# Sua seção eleitoral mudou? · Consulta 2026

Página estática (React + Vite) onde o eleitor informa **estado, município, zona e seção** e vê se a seção consta na **lista mais recente** de locais de votação alterados para o 2º turno de 2026 (441 seções; a fonte não informa a data), com o onde votava e onde vai votar. A página tem duas seções: **Encontre a sua seção** (consulta rápida por estado, município, zona e seção — todos opcionais, qualquer campo já mostra resultados) e **Lista completa** (tabela com busca por palavra-chave, filtros por campo em um popover com chips dos filtros aplicados, ordenação, paginação e "Baixar tabela" com os filtros aplicados). As versões anteriores das listas não são usadas aqui; a comparação entre elas está na análise completa.

Complementa a [análise completa](https://github.com/mhelenacipriano/secoes-eleitorais-analise): o rodapé tem o botão **Análise completa**.

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # gera dist/ (hospedagem estática, base relativa)
```

## Dados

`dados-fonte/secoes_eleitorais_alteradas_2t-pais_2026_lista5.csv` é o CSV oficial da lista mais recente (20/10 às 15h27, 453 seções, baixada em 20/10 às 17h46; ISO-8859-1, separado por `;`). `public/secoes.json` é gerado dele, só com os campos da consulta (UF, município, zona, seção, onde votava, onde vai votar e eleitores da seção). Não há votos nem dados pessoais.

```bash
npm run dados -- dados-fonte/secoes_eleitorais_alteradas_2t-pais_2026_recent.csv
```

## Link da análise completa

O botão do rodapé usa `VITE_ANALISE_URL` (por exemplo, `VITE_ANALISE_URL=https://seu-site/analise npm run build`) ou, se não definida, o repositório da análise (`src/config.js`).

## Links compartilháveis

A consulta fica na URL (`#uf=RS&m=catuipe&z=23&s=370`) e a tabela com o prefixo `t` (`#tq=escola&tuf=MG`), então qualquer resultado é compartilhável.

## Aviso

A consulta mostra apenas se a seção aparece nas listas analisadas, não é fonte oficial e não prova que o local de votação mudou. O eleitor é orientado a confirmar nos canais da Justiça Eleitoral.

## Tema

Claro e escuro com alternância no topo (segue o sistema na primeira visita). Identidade em vermelho e branco/cinza-escuro.

## Deploy na Vercel

Site estático: importe o repositório em vercel.com/new (a Vercel detecta Vite: build `npm run build`, saída `dist`). Em Settings → Environment Variables, defina `VITE_ANALISE_URL` com o endereço publicado da análise completa e faça um novo deploy (variáveis `VITE_` entram no build).

## Contador de acessos (página escondida)

Contagem anônima (sem cookies, sem IP, sem dados pessoais): acessos no total, por dia e quem está no site agora. Só você vê, em `/#estatisticas`, com uma senha.

Como ligar na Vercel:

1. No projeto da Vercel: **Storage → Create Database → Upstash (Redis)** (plano gratuito) e **Connect Project**. Isso cria as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_URL`/`TOKEN`).
2. **Settings → Environment Variables**: crie `STATS_TOKEN` com a senha que você quiser (Production).
3. Faça um novo deploy (Deployments → ⋯ → Redeploy).
4. Abra `https://SEU-SITE/#estatisticas` e entre com a senha.

Sem essas variáveis o site funciona normalmente e o contador fica desligado. Não conta em desenvolvimento nem na própria página de estatísticas. Código: `api/` (funções), `src/contador.js` (envio) e `src/Estatisticas.jsx` (painel).

## Atualização das listas do TSE

`node scripts/gerar-dados.mjs <link .csv.zip | arquivo>` baixa, confere e grava `public/secoes.json` com a lista mais recente, mais `meta` (quando foi publicada e baixada) e `historico` (uma linha por lista). O aviso do topo e os textos de datas vêm desses metadados, sem nada escrito à mão. Se a lista for igual à atual, não muda nada.
O link do CDN muda a cada publicação e só aparece no painel do SIG/TSE (que bloqueia data centers): use o workflow *Atualizar lista do TSE* (Run workflow + link) ou a rotina local do repositório da análise (`scripts/atualizar-tudo.mjs`, com `CONSULTA_DIR` apontando para este projeto).
