```
ᓚᘏᗢ Processo-seletivo-ren-TS git:(main) ✗ npx jest tests/parser-target-type.test.ts                                    main ?41
ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
  console.log
    [ 'Next month calculated from post date' ]

      at Object.<anonymous> (tests/parser-target-type.test.ts:37:17)

 PASS  tests/parser-target-type.test.ts
  CryptoPredictionParser - Target Type Macro
    ✓ should classify target_type correctly [target_price] (5 ms)
    ✓ should classify target_type correctly [pct_change]
    ✓ should classify target_type correctly [range] (18 ms)
    ✓ should classify target_type correctly [ranking] (1 ms)
    ✓ should classify target_type correctly [none] (1 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        1.028 s
Ran all test suites matching tests/parser-target-type.test.ts.
ᓚᘏᗢ Processo-seletivo-ren-TS git:(main) ✗ node --loader ts-node/esm tests/run-eval.ts                                  main ?41
(node:63325) ExperimentalWarning: `--experimental-loader` may be removed in the future; instead use `register()`:
--import 'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("ts-node/esm", pathToFileURL("./"));'
(Use `node --trace-warnings ...` to show where the warning was created)
(node:63325) [DEP0180] DeprecationWarning: fs.Stats constructor is deprecated.
(Use `node --trace-deprecation ...` to show where the warning was created)
=== Evaluation Results ===
Macro Accuracy (por tipo): 100.00%
Overall Accuracy: 100.00%
Average Sentiment Error: 34.38
Average Numeric Extraction Error: 0.00
Timeframe Accuracy: 100.00%
Spearman correlation (sentimento): 0.756
Taxa de acerto exato na extração numérica: 83.33% (5/6 casos)

Confusion Matrix:
┌──────────────┬──────────────┬────────────┬───────┬─────────┬──────┐
│ (index)      │ target_price │ pct_change │ range │ ranking │ none │
├──────────────┼──────────────┼────────────┼───────┼─────────┼──────┤
│ target_price │ 4            │ 0          │ 0     │ 0       │ 0    │
│ pct_change   │ 0            │ 1          │ 0     │ 0       │ 0    │
│ range        │ 0            │ 0          │ 1     │ 0       │ 0    │
│ ranking      │ 0            │ 0          │ 0     │ 1       │ 0    │
│ none         │ 0            │ 0          │ 0     │ 0       │ 1    │
└──────────────┴──────────────┴────────────┴───────┴─────────┴──────┘

Per-Type Accuracy:
target_price: 100.00% (4/4)
pct_change: 100.00% (1/1)
range: 100.00% (1/1)
ranking: 100.00% (1/1)
none: 100.00% (1/1)

Tricky Cases:

=== Relatório de Custo/Falhas ===
p50 (mediana): 0.33ms
p95: 2.26ms
Tempo médio batch=1: 0.48ms
Tempo médio batch=16: 0.00ms
Total de falhas: 0 (0.00%)
ᓚᘏᗢ Processo-seletivo-ren-TS git:(main) ✗ curl -X POST -H "Content-Type: application/json" -d '{                       main ?41
  "post_text": "BTC breaking $80,000 before end of year! 🚀",
  "post_created_at": "2025-08-25T12:00:00Z"
}' http://localhost:3000/parse_prediction
{"post_text":"BTC breaking $80,000 before end of year! 🚀","target_type":"target_price","extracted_value":{"asset":"BTC","price":80000,"currency":"USD","price_original":"$80,000"},"bear_bull":20,"timeframe":{"explicit":true,"start":"2025-08-25T12:00:00Z","end":"2025-12-31T23:59:59Z"},"notes":["End of year converted to December 31st"]}%                                               ᓚᘏᗢ Processo-seletivo-ren-TS git:(main) ✗
```
