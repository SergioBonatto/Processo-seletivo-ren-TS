# Especificação Técnica — Parsing de Previsões Cripto

## Estruturas de dados

```ts
type TargetPrice = {
   "asset": "string",     // Ticker: BTC, ETH, SOL, DOGE, etc.
   "price": "number",     // Valor do preço alvo: 20000, 30000, 100000
   "currency": "string"   // Moeda de referência: USD, BRL, EUR, etc.
}

type PercentageChange = {
    "asset": "string",        // Ticker: BTC, ETH, SOL, DOGE, etc.
    "percentage": "number",   // Variação esperada: 50 (alta de 50%), -30 (queda de 30%)
    "currency": "string"      // Moeda de referência: USD, BRL, EUR, etc.
}

type Range = {
    "asset": "string",    // Ticker: BTC, ETH, SOL, DOGE, etc.
    "min": "number",      // Limite inferior: 40000
    "max": "number",      // Limite superior: 60000
    "currency": "string"  // Moeda de referência: USD, BRL, EUR, etc.
}

type Ranking = {
    "asset": "string",    // Ticker: BTC, ETH, SOL, DOGE, etc.
    "ranking": "number",  // Posição alvo: 1 (primeiro), 3 (terceiro), 10 (décimo)
    "currency": "string"  // Moeda de referência do ranking: USD, BRL, EUR
}

type Output = {
    "post_text": "string"
    "target_type": TargetPrice | PercentageChange | Range | Ranking | None,
    
    "bear_bull": "number",    // Escala: -100 (muito bearish) a +100 (muito bullish)
    
    "timeframe": {
      "explicit": "boolean",        // true se o post declarou prazo explícito
      "start": "string" | None,     // timestamp ISO ex.: "2025-07-02T15:20:00Z"
      "end": "string" | None        // timestamp ISO ex.: "2025-09-30T23:59:59Z"
    },
    
    "notes": "string[]"       // ex.: ["Quarter detectado no contexto", "Retweet atribuído ao autor original"]
}
```
---
## Exemplo de input
```json
{
  "post_text": "BTC breaking $100k before Christmas! Mark my words",
  "post_created_at": "2022-09-20T14:30:00Z"
}
```

---

## Exemplo de output

```json
{
  "post_text": "BTC breaking $100k before Christmas! Mark my words",
  "target_type": "target_price",
  "bear_bull": 85,
  "timeframe": {
    "explicit": true,
    "start": "2022-09-20T14:30:00Z",
    "end": "2022-12-25T23:59:59Z"
  },
  "notes": ["Prazo 'Christmas' convertido para 25 de dezembro", "Moeda assumida: USD"]
}
```

---

## Quality Bars (mínimos de aceitação)

---

- **Target type macro F1 ≥ 0.70**  
  - O classificador deve identificar corretamente os tipos de previsão (`target_price`, `pct_change`, `range`, `ranking`, `none`) com acurácia balanceada entre todas as categorias.  
  - F1 combina precisão e recall — 0.70 significa acertar ~7 de cada 10 vezes.  
  - *Macro* significa que cada categoria tem peso igual (até as menos comuns como `ranking`).  

- **Extração numérica exact match rate ≥ 0.80**  
  - Para preços e ranges, 80% devem estar **exatamente corretos** (sem tolerância).  
  - Exemplo: `"$50,000"` ≠ `"$50000"`.  
  - Vale tanto para valores únicos quanto para `min/max`.  

- **Normalização de frases de tempo ≥ 0.75**  
  - Converter expressões como “fim do Q3” ou “mês que vem” para timestamps UTC com base na data do post.  
  - Acurácia mínima: 75%.  
  - O sistema deve lidar com expressões vagas.  

- **Sentimento Spearman ≥ 0.60**  
  - Escala: -100 (muito bearish) a +100 (muito bullish).  
  - A correlação de Spearman mede se a ordenação dos posts (mais bearish → mais bullish) é próxima da feita por humanos.  
  - 0.60 = concordância moderada a forte.  


---

## Regras de parsing

- Tratar **quotes/replies/reposts** atribuindo corretamente o autor.  
- Converter expressões de tempo relativas para UTC usando `post_created_at` como âncora.  
- Preferir **precisão a recall** (se não tiver certeza, retornar `none` + nota).  
- Aceitar apenas tickers padronizados, desambiguando palavras comuns via contexto.  
- Design **modular**: extrator numérico, normalizador de tempo e sentimento devem ser substituíveis.  

---

## O que entregar

1. Serviço mínimo com endpoint `POST /parse_prediction` e README (setup/env/exemplos).  
2. Script de avaliação com métricas + matriz de confusão.  
3. Relatório de custo (`p50`, `p95`, batch=1 e batch=16, falhas).  
4. Arquivo `tricky_cases.md` com exemplos difíceis e explicação (é tudo bem ter tricky cases).  
