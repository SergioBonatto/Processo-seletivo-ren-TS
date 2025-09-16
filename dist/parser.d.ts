import type { PostInput, PredictionOutput } from './types.js';
declare class CryptoPredictionParser {
    private assetExtractor;
    private predictionTypeClassifier;
    private numericExtractor;
    private timeframeNormalizer;
    private sentimentAnalyzer;
    constructor();
    parsePrediction(input: PostInput): PredictionOutput;
    private handleRetweetAndQuote;
}
export { CryptoPredictionParser };
//# sourceMappingURL=parser.d.ts.map