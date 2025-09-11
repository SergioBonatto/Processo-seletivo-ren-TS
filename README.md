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

type None = {
  // Explicitly marks that no structured prediction was extracted
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
### Campos obrigatórios do output

- **target_type**: um dos valores **`target_price`**, **`pct_change`**, **`range`**, **`ranking`**, **`none`**.
  - `target_price`: previsão de preço absoluto (ex: "BTC vai a $100k").  
  - `pct_change`: previsão em percentual (ex: "ETH vai subir 50%").  
  - `range`: previsão de faixa de preço (ex: "BTC entre $40k–$60k").  
  - `ranking`: previsão de posição relativa (ex: "AVAX no top 5").  
  - `none`: post sem previsão mensurável.  

- **timeframe**: objeto `{ explicit: boolean, start?: string, end?: string }`, com timestamps em **UTC** no formato ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`).
  - `explicit`: `true` se o post mencionar prazo claro (ex: “até fim do ano”), senão `false`.  
  - `start`: timestamp inicial do período considerado.  
  - `end`: timestamp final do período considerado.  

- **bear_bull**: sentimento inteiro na escala **-100** (muito bearish) a **+100** (muito bullish).
  - Valores negativos indicam viés pessimista (queda esperada).  
  - Valores positivos indicam viés otimista (alta esperada).  
  - Valores próximos de 0 indicam neutralidade ou incerteza.  

- **notes**: lista de strings com **assunções** e decisões de normalização feitas pelo parser.
  - Exemplo: moeda assumida (`USD`) quando não especificada.  
  - Conversões de prazos vagos para datas (ex: “Christmas” → `2025-12-25`).  
  - Observações contextuais (ex: “retweet atribuído ao autor original”).  


---
### Exemplos para cada tipo

---

#### 1. TargetPrice Example (Quote Tweet)

**Exemplo de Input**:

```json
{
  "post_text": "BTC breaking $80,000 before end of year! 🚀",
  "post_created_at": "2025-08-25T12:00:00Z"
}
```
**Exemplo de Output**:
```json
{
  "target_type": "target_price",
  "extracted_value": {
    "asset": "BTC",
    "price": 80000,
    "currency": "USD"
  },
  "timeframe": {
    "explicit": true,
    "start": "2025-08-25T12:00:00Z",
    "end": "2025-12-31T23:59:59Z"
  },
  "bear_bull": 78,
  "notes": [
    "End of year converted to December 31st",
    "Assumed USD currency",
    "Quote tweet - prediction attributed to @crypto_bull_2024",
    "Rocket emoji indicates high bullish sentiment"
  ]
}
```

#### 2. Percentage Change Example

**Exemplo de Input**:
```json
{
  "post_text": "RT @sol_predictions: SOL down 40% from here, bear market incoming 📉",
  "post_created_at": "2025-08-25T12:00:00Z"
}
```

**Exemplo de Output**:
```json
{
  "target_type": "pct_change",
  "extracted_value": {
    "asset": "SOL",
    "percentage": -40,
    "currency": "USD"
  },
  "timeframe": {
    "explicit": false,
    "start": null,
    "end": null
  },
  "bear_bull": -75,
  "notes": [
    "No specific timeframe mentioned",
    "Retweet - original prediction by @sol_predictions",
    "Bear market language indicates strong negative sentiment",
    "Assumed USD currency"
  ]
}
```

#### 3. Range Example (Original Tweet with Image)

**Input Example**:
```json
{
  "post_text": "ETH consolidating between $3,200-$3,800 next month. Chart analysis attached 📊",
  "post_created_at": "2025-08-25T12:00:00Z"
}
```

**Output Example**:
```json
{
  "target_type": "range",
  "extracted_range": {
    "asset": "ETH",
    "min": 3200,
    "max": 3800,
    "currency": "USD"
  },
  "timeframe": {
    "explicit": true,
    "start": "2025-08-25T12:00:00Z",
    "end": "2025-09-25T23:59:59Z"
  },
  "bear_bull": 15,
  "notes": [
    "Next month calculated from post date",
    "Chart analysis image attached - technical analysis basis",
    "Consolidation suggests neutral-to-slightly-bullish sentiment",
    "Assumed USD currency"
  ]
}
```

#### 4. Ranking Exmaple

**Input Example**:
```json
{
  "post_text": "Disagree with this take. PEPE will crack top 10 by market cap this cycle, not crash 🐸💎",
  "post_created_at": "2025-08-25T12:00:00Z"
}
```

**Output Example**:
```json
{
  "target_type": "ranking",
  "extracted_value": {
    "asset": "PEPE",
    "ranking": 10,
    "currency": "USD"
  },
  "timeframe": {
    "explicit": false,
    "start": null,
    "end": null
  },
  "bear_bull": 65,
  "notes": [
    "Market cap ranking assumed",
    "This cycle is vague timeframe",
    "Quote tweet disagreeing with @bearish_analyst's bearish prediction",
    "Frog and diamond emojis indicate strong bullish sentiment",
    "USD market cap ranking context"
  ]
}
```

#### 5. None Example

**Input Example**:
```json
{
  "post_text": "RT @market_news: Crypto market volatility hits new highs this week. This is exactly why I don't make predictions anymore 🤷‍♂️",
  "post_created_at": "2025-08-25T12:00:00Z"
}
```
**Output Example**:
```json
{
  "target_type": "none",
  "timeframe": {
    "explicit": false,
    "start": null,
    "end": null
  },
  "bear_bull": -20,
  "notes": [
    "No measurable prediction made",
    "Retweet with additional commentary by @former_crypto_bull",
    "General market volatility observation only",
    "Slight negative sentiment due to uncertainty and anti-prediction stance",
    "Shrugging emoji indicates resignation/uncertainty"
  ]
}

```
---

## Quality Bars (mínimos de aceitação)

---

- **Target type macro**  
  - O classificador deve identificar corretamente os tipos de previsão (`target_price`, `pct_change`, `range`, `ranking`, `none`) com acurácia balanceada entre todas as categorias.  
  - A Taxa de acerto deve ser ~7 de cada 10 vezes.  
  - *Macro* significa que cada categoria tem peso igual (até as menos comuns como `ranking`).  

- **Extração numérica**  
  - Para preços e ranges, 80% devem estar **exatamente corretos** (sem tolerância).  
  - Exemplo: `"$50,000"` ≠ `"$50000"`.  
  - Vale tanto para valores únicos quanto para `min/max`.  

- **Normalização de frases de tempo**  
  - Converter expressões como “fim do Q3” ou “mês que vem” para timestamps UTC com base na data do post.  
  - Acurácia mínima: 75%.  
  - O sistema deve lidar com expressões vagas.  

- **Sentimento Spearman**  
  - Escala: -100 (muito bearish) a +100 (muito bullish).  
  - A correlação de Spearman mede se a ordenação dos posts (mais bearish → mais bullish) é próxima da feita por humanos.  
  - A concordância deve ser > 0.60(concordância moderada a forte).  


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
