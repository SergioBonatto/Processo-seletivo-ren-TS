# Tricky Cases

This file documents difficult or ambiguous cases encountered during the parsing and evaluation.

---

## Case #1: Falha na detecção de Sarcasmo

**Input:**
```json
{
  "post_text": "Yeah right, BTC to $100k by Christmas 🙄 Sure buddy",
  "post_created_at": "2025-08-25T12:00:00Z"
}
```

**Expected:**
```json
{
  "post_text": "Yeah right, BTC to $100k by Christmas 🙄 Sure buddy",
  "target_type": "target_price",
  "extracted_value": {
    "asset": "BTC",
    "price": 100000,
    "currency": "USD"
  },
  "bear_bull": -60,
  "timeframe": {
    "explicit": true,
    "start": "2025-08-25T12:00:00Z",
    "end": "2025-12-25T23:59:59Z"
  },
  "notes": [
    "Sarcasm detected, sentiment is negative despite positive-sounding numbers."
  ]
}
```

**Actual:**
```json
{
  "post_text": "Yeah right, BTC to $100k by Christmas 🙄 Sure buddy",
  "target_type": "target_price",
  "extracted_value": {
    "asset": "BTC",
    "price": 100000,
    "currency": "USD"
  },
  "bear_bull": 75,
  "timeframe": {
    "explicit": true,
    "start": "2025-08-25T12:00:00Z",
    "end": "2025-12-25T23:59:59Z"
  },
  "notes": [
    "Bullish prediction for BTC to reach $100k."
  ]
}
```

**Explicação:** O modelo de linguagem extraiu corretamente os dados numéricos e de tempo, mas falhou em interpretar o sarcasmo (indicado por "Yeah right", "Sure buddy" e o emoji 🙄). Como resultado, atribuiu um sentimento `bear_bull` altamente positivo (otimista) em vez de negativo, que era a intenção real do post.

---

## Case #2: Previsão Condicional Ignorada

**Input:**
```json
{
  "post_text": "If the fed cuts rates, we could see SOL at $300.",
  "post_created_at": "2025-09-01T10:00:00Z"
}
```

**Expected:**
```json
{
  "post_text": "If the fed cuts rates, we could see SOL at $300.",
  "target_type": "none",
  "extracted_value": null,
  "bear_bull": 10,
  "timeframe": {
    "explicit": false,
    "start": null,
    "end": null
  },
  "notes": [
    "Prediction is conditional and not a certainty, therefore not measurable."
  ]
}
```

**Actual:**
```json
{
  "post_text": "If the fed cuts rates, we could see SOL at $300.",
  "target_type": "target_price",
  "extracted_value": {
    "asset": "SOL",
    "price": 300,
    "currency": "USD"
  },
  "bear_bull": 40,
  "timeframe": {
    "explicit": false,
    "start": null,
    "end": null
  },
  "notes": [
    "A target price of $300 was mentioned for SOL."
  ]
}
```

**Explicação:** A previsão é estritamente condicional ("If..."). A regra de negócio de "precisão sobre recall" dita que, se uma previsão não é uma afirmação direta, ela deve ser classificada como `none`. O LLM ignorou a condição, extraiu o valor numérico e o tratou como uma previsão real, resultando em um `target_type` incorreto.

---

## Case #3: Ambiguidade com Múltiplas Previsões

**Input:**
```json
{
  "post_text": "Forget $5k ETH, we are going to $6k, but the range for the next month is probably $4.5k to $5.5k.",
  "post_created_at": "2025-10-01T18:00:00Z"
}
```

**Expected:**
```json
{
  "post_text": "Forget $5k ETH, we are going to $6k, but the range for the next month is probably $4.5k to $5.5k.",
  "target_type": "range",
  "extracted_value": {
    "asset": "ETH",
    "min": 4500,
    "max": 5500,
    "currency": "USD"
  },
  "bear_bull": 25,
  "timeframe": {
    "explicit": true,
    "start": "2025-10-01T18:00:00Z",
    "end": "2025-11-01T23:59:59Z"
  },
  "notes": [
    "Multiple predictions found, prioritized the more specific 'range' prediction with an explicit timeframe."
  ]
}
```

**Actual:**
```json
{
  "post_text": "Forget $5k ETH, we are going to $6k, but the range for the next month is probably $4.5k to $5.5k.",
  "target_type": "target_price",
  "extracted_value": {
    "asset": "ETH",
    "price": 6000,
    "currency": "USD"
  },
  "bear_bull": 50,
  "timeframe": {
    "explicit": false,
    "start": null,
    "end": null
  },
  "notes": [
    "Identified a target price of $6k for ETH."
  ]
}
```

**Explicação:** O texto contém duas previsões conflitantes: um `target_price` de $6k e um `range` para o próximo mês. O LLM arbitrariamente escolheu a primeira (`target_price`) e ignorou a segunda, que era mais específica e continha um prazo. Isso leva a uma classificação de tipo incorreta e à perda de informações valiosas sobre o `timeframe`.

---

## Case #4: Falha de Conformidade do JSON

**Input:**
```json
{
  "post_text": "Complex post with \"quotes\" and \n newlines that might break the parser's JSON output.",
  "post_created_at": "2025-01-01T00:00:00Z"
}
```

**Expected:**
```json
{
  "post_text": "Complex post with \"quotes\" and \n newlines that might break the parser's JSON output.",
  "target_type": "none",
  "extracted_value": null,
  "bear_bull": 0,
  "timeframe": {
    "explicit": false,
    "start": null,
    "end": null
  },
  "notes": [
    "No measurable prediction made."
  ]
}
```

**Actual:**
```json
{
  "post_text": "Complex post with \"quotes\" and \n newlines that might break the parser's JSON output.",
  "target_type": "none",
  "extracted_value": null,
  "bear_bull": 0,
  "timeframe": {
    "explicit": false,
    "start": null,
    "end": null,
  },
  "notes": [
    "No measurable prediction made."
  ],
}
```

**Explicação:** O LLM, apesar de instruído a gerar um JSON limpo, pode ocasionalmente produzir um JSON malformado, como uma vírgula extra no final de um objeto (trailing comma). O `evaluation.ts` captura isso como uma `Falha de conformidade do output`, pois o `JSON.parse` falharia, e o `createErrorOutput` do parser seria acionado, resultando em um objeto de erro que não corresponde ao esperado.

---