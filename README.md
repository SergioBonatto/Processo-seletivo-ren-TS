# Crypto Forecast Parsing Project

## 1. Overview

# Crypto Forecast Parsing Project

## 1. Overview
This project implements a backend service in Node.js and TypeScript to analyze social media posts about cryptocurrencies and extract financial forecasts in a structured way.
---

## 9. Output Examples (by type)

### Target Price
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

### Percentage Change
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

### Range
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

### Ranking
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

### None
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

## 10. Quality Bars (Acceptance Criteria)

## 10. Quality Bars (How the project meets the criteria)

- **Target type classification:**
    - The parser uses an LLM with a detailed prompt to identify the forecast type. Evaluation is performed by the script `src/evaluation.ts`, which calculates macro accuracy (by category) and confusion matrix. Typical results can be checked in the test output.

- **Exact numeric extraction:**
    - The system requires exact match for price and range values, with no tolerance. The method `isExactNumericMatch` in `src/evaluation.ts` validates this match. Metrics are reported in the console after running `npm test`.

- **Normalization of time phrases:**
    - Expressions like "end of Q3" or "next month" are converted to UTC using the post date as reference. The LLM is instructed via prompt and results are evaluated by the evaluation script, which calculates time normalization accuracy.

- **Sentiment (Spearman):**
    - The `bear_bull` field is extracted by the LLM and compared with the expected value in the tests. Spearman correlation is calculated by the method `spearmanCorrelation` in `src/evaluation.ts` and reported in the test output.

All results can be audited in the output files and in the console after running the evaluation scripts.

---

## 11. Parsing Rules

## 11. Parsing Rules (Implementation)

- **Quotes, replies and reposts:** The parser instructs the LLM to correctly identify and attribute forecasts made in retweets, replies and quotes, adding notes in the `notes` field.
- **Time normalization:** The `post_created_at` field is always sent to the LLM, which converts relative expressions to UTC. The evaluation script validates the accuracy of these conversions.
- **Precision vs recall:** The system prioritizes precision: if the LLM does not identify a measurable forecast, it returns `target_type: none` and adds an explanation in `notes`.
- **Standardized tickers:** The LLM is instructed to accept only recognized tickers, disambiguating via context. Ambiguous cases are treated as `none`.
- **Modular design:** The parser (`src/parser.ts`) can be easily adapted for other models or rules, as all extraction logic is isolated and the prompt can be adjusted.

---

## 12. Deliverables Checklist

## 12. Deliverables Checklist (How to access each item)

1. **Minimum service:** The endpoint `POST /parse_prediction` is implemented in `src/server.ts`. The README provides usage examples, setup and environment variables.
2. **Evaluation script:** The script `tests/run-eval.ts` runs the full evaluation, generating metrics and confusion matrix in the console.
3. **Cost report:** The evaluation script reports latencies (`p50`, `p95`) for batch=1 and batch=16, and counts failures. Check the console output after running the tests.
4. **File tricky_cases.md:** Automatically generated by the evaluation script, contains difficult examples and detailed explanations for each tricky case.

The core of the system uses a Language Model (LLM) via OpenRouter API to interpret the natural language of posts, classifying them into different forecast types (`target_price`, `pct_change`, `range`, `ranking` or `none`) and extracting numeric values, timeframes and sentiment (bullish/bearish).

The architecture consists of three main components:
1.  **API Server (`src/server.ts`):** An Express server exposing the `POST /parse_prediction` endpoint.
2.  **Parsing Module (`src/parser.ts`):** Where the communication logic with the LLM resides, sending the post text and receiving the structured JSON analysis.
3.  **Evaluation Suite (`src/evaluation.ts` and `tests/`):** A set of scripts and test cases to validate the quality and performance of the parser against the metrics defined in the technical specification.

---

## 2. Tech Stack

-   **Backend:** Node.js
-   **Language:** TypeScript
-   **Framework:** Express.js
-   **Natural Language Parsing:** LLM (Mistral 7B via OpenRouter API)
-   **HTTP Requests:** Axios
-   **Testing:** Jest (configured, but main evaluation scripts are run with `ts-node`)
-   **Environment Management:** Dotenv

---

## 3. Project Structure

```
/
├─── src/
│    ├─── parser.ts       # Main parsing logic (interaction with the LLM API)
│    ├─── server.ts       # Express server implementation and endpoint
│    ├─── types.ts        # Definitions of all interfaces and data types
│    └─── evaluation.ts   # Logic to evaluate parser performance
├─── tests/
│    ├─── analyze-dataset.ts # Script to run the parser on a full dataset
│    ├─── run-eval.ts        # Script to run the quality evaluation suite
│    └─── test-cases.ts      # Specific test cases with input and expected output
├─── dataset.json           # Input dataset with posts for analysis
├─── package.json           # Project dependencies and scripts
└─── tsconfig.json          # TypeScript compiler configuration
```

---

## 4. Setup and Installation

**Prerequisites:**
*   Node.js (v18 or higher)
*   NPM

**Steps:**

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/SergioBonatto/Processo-seletivo-ren-TS
    cd Processo-seletivo-ren-TS
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    Create a `.env` file at the project root. The parser requires an OpenRouter API key and allows you to configure the LLM model used.

    ```env
    # Add your OpenRouter API key
    OPENROUTER_API_KEY="sk_or_..."

    # LLM model name (optional)
    # Example: LLM_MODEL_NAME="mistralai/mistral-7b-instruct:free"
    # If not set, defaults to "mistralai/mistral-7b-instruct:free"
    LLM_MODEL_NAME="mistralai/mistral-7b-instruct:free"

    # Server port (optional, default 3000)
    PORT=3000
    ```
    - **Modular design:** O parser (`src/parser.ts`) pode ser facilmente adaptado para outros modelos ou regras, pois toda a lógica de extração está isolada e o prompt pode ser ajustado. O nome do modelo LLM pode ser configurado via variável de ambiente `LLM_MODEL_NAME`.
    - **Modular design:** The parser (`src/parser.ts`) can be easily adapted for other models or rules, as all extraction logic is isolated and the prompt can be adjusted. The LLM model name can be configured via the `LLM_MODEL_NAME` environment variable.

4.  **Build the project:**
    To run in "production" mode, you need to compile the TypeScript files to JavaScript.
    ```bash
    npm run build
    ```
    The compiled files will be saved in the `/dist` directory.

---

## 5. How to Run

### Development Mode

To run the server in development mode with hot-reloading (via `ts-node`):
```bash
npm run dev
```
The server will be available at `http://localhost:3000`.

### Production Mode

To run the compiled server (more performant):
```bash
# Make sure you have built the project first with "npm run build"
npm start
```
The server will be available at `http://localhost:3000`.

---

## 6. API Documentation

### `POST /parse_prediction`

This endpoint analyzes a single post and returns the forecast structure.

**Request Body:**
```json
{
  "post_text": "string",
  "post_created_at": "string"
}
```
-   `post_text`: The post text to be analyzed.
-   `post_created_at`: The post creation date in ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`). This is crucial to calculate relative timeframes like "one month from now".

**Example usage with `curl`:**
```bash
curl -X POST http://localhost:3000/parse_prediction \
-H "Content-Type: application/json" \
-d '{
  "post_text": "BTC breaking $100k before Christmas! Mark my words",
  "post_created_at": "2024-09-20T14:30:00Z"
}'
```

**Success Response (200 OK):**
The response will be a JSON with the `PredictionOutput` structure, as defined in `src/types.ts`.
```json
{
    "post_text": "BTC breaking $100k before Christmas! Mark my words",
    "target_type": "target_price",
    "extracted_value": {
        "asset": "BTC",
        "price": 100000,
        "currency": "USD"
    },
    "bear_bull": 80,
    "timeframe": {
        "explicit": true,
        "start": "2024-09-20T14:30:00Z",
        "end": "2024-12-25T23:59:59Z"
    },
    "notes": [
        "Assumed USD currency",
        "Christmas converted to December 25th"
    ]
}
```

### `GET /health`
Endpoint to check if the service is up. Returns status and current timestamp.

---

## 7. Evaluation and Test Scripts

The project includes an evaluation suite to measure parser quality and analyze datasets.

### a) Run Quality Evaluation

This script runs the cases defined in `tests/test-cases.ts` and compares parser results with expected outputs, generating a full quality metrics report.

**Command:**
```bash
npm test
```

**Output:**
The script will print to the console:
-   Accuracy metrics (Macro and Overall).
-   Numeric extraction accuracy.
-   Timeframe accuracy.
-   Spearman correlation for sentiment.
-   A **Confusion Matrix** for target types.
-   Performance report (latency `p50`, `p95`).
-   It will also generate/update the file `tricky_cases.md` with details of each failure found.

### b) Analyze a Full Dataset

This script reads the file `dataset.json`, runs the parser on each entry and prints the result to the console. Useful for batch analysis and generating an output file.

**Command:**
```bash
npm run test:dataset
```

**To save the result to a file (like `dataset-test.json`):**
```bash
npm run test:dataset > dataset-test.json
```

---

## 8. Data Structures (Output)

The main output structure is `PredictionOutput`.

```ts
type PredictionOutput = {
    "post_text": string; // The original post text
    "target_type": "target_price" | "pct_change" | "range" | "ranking" | "none";
    "extracted_value"?: ExtractedValue; // Object with extracted values
    "extracted_range"?: Range; // Object with extracted range
    "bear_bull": number; // Sentiment: -100 (bearish) to +100 (bullish)
    "timeframe": {
      "explicit": boolean;
      "start": string | null; // ISO 8601 timestamp
      "end": string | null;   // ISO 8601 timestamp
    };
    "notes": string[]; // Parser notes (e.g., "Assumed USD currency")
}
```

The `ExtractedValue` types are:

-   **TargetPrice**: `{ asset, price, currency }`
-   **PercentageChange**: `{ asset, percentage, currency }`
-   **Range**: `{ asset, min, max, currency }`
-   **Ranking**: `{ asset, ranking, currency }`

For a detailed definition, see the file `src/types.ts`.
