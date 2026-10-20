# Sua seção eleitoral mudou? · Consulta 2026

Página estática (React + Vite) onde o eleitor informa **estado, município, zona e seção** e vê se a seção consta na **lista mais recente** de locais de votação alterados para o 2º turno de 2026 (438 seções; a fonte não informa a data), com o onde votava e onde vai votar. Uma única busca por palavra-chave (cidade, estado por nome ou sigla, local, zona, seção) e filtros por campo, todos opcionais, sobre a lista completa, com ordenação, paginação e exportação em CSV. As versões anteriores das listas não são usadas aqui; a comparação entre elas está na análise completa.

Complementa a [análise completa](https://github.com/mhelenacipriano/secoes-eleitorais-analise): o rodapé tem o botão **Análise completa**.

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # gera dist/ (hospedagem estática, base relativa)
```

## Dados

`dados-fonte/secoes_eleitorais_alteradas_2t-regiao_2026.csv` é o CSV oficial da lista mais recente (ISO-8859-1, separado por `;`). `public/secoes.json` é gerado dele, só com os campos da consulta (UF, município, zona, seção, onde votava, onde vai votar e eleitores da seção). Não há votos nem dados pessoais.

```bash
npm run dados -- dados-fonte/secoes_eleitorais_alteradas_2t-regiao_2026.csv
```

## Link da análise completa

O botão do rodapé usa `VITE_ANALISE_URL` (por exemplo, `VITE_ANALISE_URL=https://seu-site/analise npm run build`) ou, se não definida, o repositório da análise (`src/config.js`).

## Links compartilháveis

A busca fica na URL (`#q=catuipe&uf=RS&z=23&s=370`), então qualquer resultado é compartilhável.

## Aviso

A consulta mostra apenas se a seção aparece nas listas analisadas, não é fonte oficial e não prova que o local de votação mudou. O eleitor é orientado a confirmar nos canais da Justiça Eleitoral.

## Tema

Claro e escuro com alternância no topo (segue o sistema na primeira visita). Identidade em vermelho e branco/cinza-escuro.

## Deploy na Vercel

Site estático: importe o repositório em vercel.com/new (a Vercel detecta Vite: build `npm run build`, saída `dist`). Em Settings → Environment Variables, defina `VITE_ANALISE_URL` com o endereço publicado da análise completa e faça um novo deploy (variáveis `VITE_` entram no build).
