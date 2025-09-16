import { CryptoPredictionParser } from '../parser.js';
// eslint-disable-next-line
// Adiciona referência ao Jest para tipos globais
// / <reference types="jest" />
describe('CryptoPredictionParser - Target Type Macro', () => {
    const parser = new CryptoPredictionParser();
    const cases = [
        {
            input: { post_text: 'BTC breaking $80,000 before end of year! 🚀', post_created_at: '2025-08-25T12:00:00Z' },
            expectedType: 'target_price',
        },
        {
            input: { post_text: 'SOL down 40% from here, bear market incoming 📉', post_created_at: '2025-08-25T12:00:00Z' },
            expectedType: 'pct_change',
        },
        {
            input: { post_text: 'ETH consolidating between $3,200-$3,800 next month.', post_created_at: '2025-08-25T12:00:00Z' },
            expectedType: 'range',
        },
        {
            input: { post_text: 'PEPE will crack top 10 by market cap this cycle', post_created_at: '2025-08-25T12:00:00Z' },
            expectedType: 'ranking',
        },
        {
            input: { post_text: "Crypto market volatility hits new highs this week. This is exactly why I don't make predictions anymore 🤷‍♂️", post_created_at: '2025-08-25T12:00:00Z' },
            expectedType: 'none',
        },
    ];
    cases.forEach(({ input, expectedType }, idx) => {
        test(`should classify target_type correctly [${expectedType}]`, () => {
            const result = parser.parsePrediction(input);
            if (expectedType === 'range') {
                console.log(result.notes);
            }
            expect(result.target_type).toBe(expectedType);
        });
    });
});
//# sourceMappingURL=parser-target-type.test.js.map