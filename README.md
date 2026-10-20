# Sua seção eleitoral mudou? · Consulta 2026

Página estática (React + Vite) onde o eleitor informa **estado, município, zona e seção** e vê se a seção consta nas quatro listas de locais de votação alterados analisadas para o 2º turno de 2026, com o local inicial e o final.

Complementa a [análise completa](https://github.com/mhelenacipriano/secoes-eleitorais-analise): o rodapé tem o botão **Análise completa**.

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm run build    # gera dist/ (hospedagem estática, base relativa)
```

## Dados

`public/secoes.json` é gerado do CSV do projeto de análise e contém só o necessário para a consulta (UF, município, zona, seção, local inicial/final e em quais listas a seção aparece). Não há votos nem número de eleitores.

```bash
npm run dados -- caminho/para/secoes_v.csv
```

## Link da análise completa

O botão do rodapé usa `VITE_ANALISE_URL` (por exemplo, `VITE_ANALISE_URL=https://seu-site/analise npm run build`) ou, se não definida, o repositório da análise (`src/config.js`).

## Links compartilháveis

Uma consulta fica na URL: `#uf=CE&m=JARDIM&z=119&s=352`.

## Aviso

A consulta mostra apenas se a seção aparece nas listas analisadas, não é fonte oficial e não prova que o local de votação mudou. O eleitor é orientado a confirmar nos canais da Justiça Eleitoral.

## Tema

Claro e escuro com alternância no topo (segue o sistema na primeira visita). Identidade em vermelho e branco/cinza-escuro.

## Deploy na Vercel

Site estático: importe o repositório em vercel.com/new (a Vercel detecta Vite: build `npm run build`, saída `dist`). Em Settings → Environment Variables, defina `VITE_ANALISE_URL` com o endereço publicado da análise completa e faça um novo deploy (variáveis `VITE_` entram no build).
