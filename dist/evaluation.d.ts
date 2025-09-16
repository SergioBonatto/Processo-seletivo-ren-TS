import type { PostInput, PredictionOutput } from './types.ts';
interface TestCase {
    input: PostInput;
    expected: PredictionOutput;
}
declare class Evaluator {
    private parser;
    /**
     * Avaliação completa conforme requisitos do README.md
     */
    evaluate(testCases: TestCase[]): void;
    private generateTrickyCasesMarkdown;
    /**
     * Calcula erro absoluto para extração numérica
     */
    static numericError(expected: PredictionOutput, result: PredictionOutput): number;
    /**
     * Verifica se a extração numérica foi exatamente correta (sem tolerância)
     * Considera valores originais se presentes (ex: price_original, min_original, max_original)
     */
    static isExactNumericMatch(expected: PredictionOutput, result: PredictionOutput): boolean;
    /**
     * Calcula a correlação de Spearman entre dois arrays de valores
     * Retorna null se não for possível calcular
     */
    static spearmanCorrelation(a: number[], b: number[]): number | null;
}
export { Evaluator };
//# sourceMappingURL=evaluation.d.ts.map