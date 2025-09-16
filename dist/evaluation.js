import { CryptoPredictionParser } from './parser.js';
class Evaluator {
    parser = new CryptoPredictionParser();
    /**
     * Avaliação completa conforme requisitos do README.md
     */
    evaluate(testCases) {
        // Simulação de tempos de execução (mock, substitua por tempos reais se necessário)
        const executionTimes = [];
        const batch1Times = [];
        const batch16Times = [];
        let failCount = 0;
        const types = ['target_price', 'pct_change', 'range', 'ranking', 'none'];
        const confusionMatrix = Object.create(null);
        const perTypeCorrect = Object.create(null);
        const sentimentErrors = [];
        const numericErrors = [];
        const trickyCases = [];
        let totalCorrect = 0;
        // Para Spearman
        const expectedSentiments = [];
        const predictedSentiments = [];
        // Métrica de acerto exato para extração numérica
        let exactNumericCorrect = 0;
        let exactNumericTotal = 0;
        // Métrica para timeframe
        let timeframeCorrect = 0;
        let timeframeTotal = 0;
        // Inicializar estruturas
        types.forEach(t1 => {
            if (!confusionMatrix[t1])
                confusionMatrix[t1] = Object.create(null);
            if (!perTypeCorrect[t1])
                perTypeCorrect[t1] = { correct: 0, total: 0 };
            types.forEach(t2 => {
                if (!confusionMatrix[t1])
                    confusionMatrix[t1] = Object.create(null);
                confusionMatrix[t1][t2] = 0;
            });
        });
        testCases.forEach((testCase, idx) => {
            const start = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            const result = this.parser.parsePrediction(testCase.input);
            const end = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            const execTime = end - start;
            executionTimes.push(execTime);
            batch1Times.push(execTime);
            // Simula batch=16 (soma de 16 execuções reais)
            if ((idx + 1) % 16 === 0) {
                const batchTime = executionTimes.slice(idx - 15, idx + 1).reduce((a, b) => a + b, 0);
                batch16Times.push(batchTime);
            }
            // Validação de conformidade do output
            const conformityErrors = [];
            function isString(val) { return typeof val === 'string'; }
            function isNumber(val) { return typeof val === 'number' && !isNaN(val); }
            function isBool(val) { return typeof val === 'boolean'; }
            function isNullOrString(val) { return val === null || isString(val); }
            function isArrayOfStrings(val) { return Array.isArray(val) && val.every(isString); }
            // target_type obrigatório
            if (!result.hasOwnProperty('target_type') || typeof result.target_type !== 'string') {
                conformityErrors.push('Campo obrigatório ausente ou malformado: target_type');
            }
            else {
                const validTypes = ['target_price', 'pct_change', 'range', 'ranking', 'none'];
                if (!validTypes.includes(result.target_type)) {
                    conformityErrors.push(`target_type inválido: ${result.target_type}`);
                }
            }
            // bear_bull obrigatório
            if (!result.hasOwnProperty('bear_bull') || !isNumber(result.bear_bull)) {
                conformityErrors.push('Campo obrigatório ausente ou malformado: bear_bull');
            }
            // timeframe obrigatório
            if (!result.hasOwnProperty('timeframe') || typeof result.timeframe !== 'object' || result.timeframe === null) {
                conformityErrors.push('Campo obrigatório ausente ou malformado: timeframe');
            }
            else {
                const tf = result.timeframe;
                if (!tf.hasOwnProperty('explicit') || !isBool(tf.explicit)) {
                    conformityErrors.push('Campo timeframe.explicit ausente ou malformado');
                }
                if (!tf.hasOwnProperty('start') || !isNullOrString(tf.start)) {
                    conformityErrors.push('Campo timeframe.start ausente ou malformado');
                }
                if (!tf.hasOwnProperty('end') || !isNullOrString(tf.end)) {
                    conformityErrors.push('Campo timeframe.end ausente ou malformado');
                }
            }
            // notes obrigatório
            if (!result.hasOwnProperty('notes') || !isArrayOfStrings(result.notes)) {
                conformityErrors.push('Campo obrigatório ausente ou malformado: notes');
            }
            // extracted_value: só obrigatório se não for 'none'
            if (result.target_type !== 'none') {
                if (!result.hasOwnProperty('extracted_value') || result.extracted_value === null || typeof result.extracted_value !== 'object') {
                    conformityErrors.push('Campo obrigatório ausente ou malformado: extracted_value');
                }
                else {
                    // Validação básica dos campos de extracted_value
                    const ev = result.extracted_value;
                    if (!ev.hasOwnProperty('asset') || !isString(ev.asset)) {
                        conformityErrors.push('Campo extracted_value.asset ausente ou malformado');
                    }
                    if (!ev.hasOwnProperty('currency') || !isString(ev.currency)) {
                        conformityErrors.push('Campo extracted_value.currency ausente ou malformado');
                    }
                    if (result.target_type === 'target_price') {
                        if (!('price' in ev) || !isNumber(ev.price)) {
                            conformityErrors.push('Campo extracted_value.price ausente ou malformado');
                        }
                    }
                    if (result.target_type === 'pct_change') {
                        if (!('percentage' in ev) || !isNumber(ev.percentage)) {
                            conformityErrors.push('Campo extracted_value.percentage ausente ou malformado');
                        }
                    }
                    if (result.target_type === 'range') {
                        if (!('min' in ev) || !isNumber(ev.min)) {
                            conformityErrors.push('Campo extracted_value.min ausente ou malformado');
                        }
                        if (!('max' in ev) || !isNumber(ev.max)) {
                            conformityErrors.push('Campo extracted_value.max ausente ou malformado');
                        }
                    }
                    if (result.target_type === 'ranking') {
                        if (!('ranking' in ev) || !isNumber(ev.ranking)) {
                            conformityErrors.push('Campo extracted_value.ranking ausente ou malformado');
                        }
                    }
                }
            }
            else {
                // Se for 'none', extracted_value deve ser null ou undefined
                if (result.hasOwnProperty('extracted_value') && result.extracted_value !== null && result.extracted_value !== undefined) {
                    conformityErrors.push('Campo extracted_value deve ser null ou undefined quando target_type é none');
                }
            }
            // post_text sempre obrigatório
            if (!result.hasOwnProperty('post_text') || !isString(result.post_text)) {
                conformityErrors.push('Campo obrigatório ausente ou malformado: post_text');
            }
            if (conformityErrors.length > 0) {
                failCount++;
                trickyCases.push(`Case #${idx + 1}: Falha de conformidade do output -> ${conformityErrors.join('; ')}`);
                // Não processa métricas para este caso
                return;
            }
            const expected = testCase.expected;
            // Falha: tipo errado ou erro numérico > 0
            const typeFail = result.target_type !== expected.target_type;
            const numFail = ['target_price', 'range', 'pct_change'].includes(expected.target_type) && result.extracted_value && expected.extracted_value && Evaluator.numericError(expected, result) > 0;
            if (typeFail || numFail)
                failCount++;
            // Matriz de confusão macro
            // Safe access for confusionMatrix and perTypeCorrect
            if (!confusionMatrix[expected.target_type])
                confusionMatrix[expected.target_type] = Object.create(null);
            if (!perTypeCorrect[expected.target_type])
                perTypeCorrect[expected.target_type] = { correct: 0, total: 0 };
            if (!confusionMatrix[expected.target_type])
                confusionMatrix[expected.target_type] = Object.create(null);
            if (!perTypeCorrect[expected.target_type])
                perTypeCorrect[expected.target_type] = { correct: 0, total: 0 };
            if (!confusionMatrix[expected.target_type][result.target_type])
                confusionMatrix[expected.target_type][result.target_type] = 0;
            confusionMatrix[expected.target_type][result.target_type]++;
            perTypeCorrect[expected.target_type].total++;
            if (result.target_type === expected.target_type) {
                perTypeCorrect[expected.target_type].correct++;
                totalCorrect++;
            }
            else {
                trickyCases.push(`Case #${idx + 1}: Tipo esperado ${expected.target_type}, obtido ${result.target_type}`);
            }
            // Erro de sentimento
            sentimentErrors.push(Math.abs(result.bear_bull - expected.bear_bull));
            expectedSentiments.push(expected.bear_bull);
            predictedSentiments.push(result.bear_bull);
            // Erro de extração numérica (apenas para target_price, range, pct_change)
            if (['target_price', 'range', 'pct_change'].includes(expected.target_type) && result.extracted_value && expected.extracted_value) {
                numericErrors.push(Evaluator.numericError(expected, result));
                if (Evaluator.numericError(expected, result) > 0) {
                    trickyCases.push(`Case #${idx + 1}: Erro de extração numérica`);
                }
                // Métrica de acerto exato
                exactNumericTotal++;
                if (Evaluator.isExactNumericMatch(expected, result)) {
                    exactNumericCorrect++;
                }
            }
            // Timeframe accuracy
            if (expected.timeframe) {
                timeframeTotal++;
                if (result.timeframe.explicit === expected.timeframe.explicit && result.timeframe.start === expected.timeframe.start && result.timeframe.end === expected.timeframe.end) {
                    timeframeCorrect++;
                }
                else {
                    trickyCases.push(`Case #${idx + 1}: Erro de timeframe. Esperado: ${JSON.stringify(expected.timeframe)}, Obtido: ${JSON.stringify(result.timeframe)}`);
                }
            }
        });
        // Métricas
        const macroAccuracy = types.reduce((acc, t) => {
            const typeStats = perTypeCorrect[t] || { correct: 0, total: 0 };
            return acc + (typeStats.correct / (typeStats.total || 1));
        }, 0) / types.length;
        const overallAccuracy = totalCorrect / testCases.length;
        const avgSentimentError = sentimentErrors.length ? (sentimentErrors.reduce((a, b) => a + b, 0) / sentimentErrors.length) : 0;
        const avgNumericError = numericErrors.length ? (numericErrors.reduce((a, b) => a + b, 0) / numericErrors.length) : 0;
        const timeframeAccuracy = timeframeTotal > 0 ? timeframeCorrect / timeframeTotal : 0;
        // Correlação de Spearman para sentimento
        const spearman = Evaluator.spearmanCorrelation(expectedSentiments, predictedSentiments);
        // Relatório
        // Validação obrigatória do requisito Spearman
        if (spearman === null) {
            console.error('ERRO: Não foi possível calcular a correlação de Spearman para sentimento.');
            throw new Error('Falha na avaliação: Spearman não pôde ser calculada.');
        }
        if (spearman < 0.60) {
            console.error(`ERRO: Correlação de Spearman para sentimento abaixo do mínimo exigido pelo README (valor: ${spearman.toFixed(3)} < 0.60).`);
            throw new Error('Falha na avaliação: Spearman abaixo do mínimo exigido pelo README.');
        }
        console.log('=== Evaluation Results ===');
        console.log(`Macro Accuracy (por tipo): ${(macroAccuracy * 100).toFixed(2)}%`);
        console.log(`Overall Accuracy: ${(overallAccuracy * 100).toFixed(2)}%`);
        console.log(`Average Sentiment Error: ${avgSentimentError.toFixed(2)}`);
        console.log(`Average Numeric Extraction Error: ${avgNumericError.toFixed(2)}`);
        console.log(`Timeframe Accuracy: ${(timeframeAccuracy * 100).toFixed(2)}%`);
        console.log(`Spearman correlation (sentimento): ${spearman !== null ? spearman.toFixed(3) : 'N/A'}`);
        // Métrica de acerto exato para extração numérica
        if (exactNumericTotal > 0) {
            const exactRate = (exactNumericCorrect / exactNumericTotal) * 100;
            console.log(`Taxa de acerto exato na extração numérica: ${exactRate.toFixed(2)}% (${exactNumericCorrect}/${exactNumericTotal} casos)`);
        }
        else {
            console.log('Nenhum caso de extração numérica para avaliar acerto exato.');
        }
        console.log('\nConfusion Matrix:');
        console.table(confusionMatrix);
        console.log('\nPer-Type Accuracy:');
        types.forEach(t => {
            const typeStats = perTypeCorrect[t] || { correct: 0, total: 0 };
            console.log(`${t}: ${(typeStats.correct / (typeStats.total || 1) * 100).toFixed(2)}% (${typeStats.correct}/${typeStats.total})`);
        });
        // Gerar tricky_cases.md
        this.generateTrickyCasesMarkdown(trickyCases);
        // Relatório de custo/falhas
        console.log('\n=== Relatório de Custo/Falhas ===');
        // p50, p95
        const sortedTimes = [...executionTimes].sort((a, b) => a - b);
        const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
        const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
        console.log(`p50 (mediana): ${p50.toFixed(2)}ms`);
        console.log(`p95: ${p95.toFixed(2)}ms`);
        // batch=1
        const avgBatch1 = batch1Times.length ? (batch1Times.reduce((a, b) => a + b, 0) / batch1Times.length) : 0;
        console.log(`Tempo médio batch=1: ${avgBatch1.toFixed(2)}ms`);
        // batch=16
        const avgBatch16 = batch16Times.length ? (batch16Times.reduce((a, b) => a + b, 0) / batch16Times.length) : 0;
        console.log(`Tempo médio batch=16: ${avgBatch16.toFixed(2)}ms`);
        // Falhas
        console.log(`Total de falhas: ${failCount} (${((failCount / testCases.length) * 100).toFixed(2)}%)`);
        // Estrutura para relatório de custo/falhas pode ser expandida aqui
    }
    generateTrickyCasesMarkdown(trickyCases) {
        const header = '# Tricky Cases\n\nThis file documents difficult or ambiguous cases encountered during the parsing and evaluation of crypto prediction posts. Each entry includes the input, expected output, actual output (if relevant), and a brief explanation of why the case is considered tricky.\n\n---\n';
        const content = trickyCases.map(c => `## ${c}\n\n---\n`).join('\n');
        // fs.writeFileSync('tricky_cases.md', header + content);
        console.log('\nTricky Cases:');
        trickyCases.forEach(c => console.log(c));
    }
    /**
     * Calcula erro absoluto para extração numérica
     */
    static numericError(expected, result) {
        if (!expected.extracted_value || !result.extracted_value)
            return 0;
        // TargetPrice
        if (expected.target_type === 'target_price' && result.target_type === 'target_price') {
            // @ts-ignore
            return Math.abs(expected.extracted_value.price - result.extracted_value.price);
        }
        // PercentageChange
        if (expected.target_type === 'pct_change' && result.target_type === 'pct_change') {
            // @ts-ignore
            return Math.abs(expected.extracted_value.percentage - result.extracted_value.percentage);
        }
        // Range
        if (expected.target_type === 'range' && result.target_type === 'range') {
            // @ts-ignore
            return Math.abs(expected.extracted_value.min - result.extracted_value.min) + Math.abs(expected.extracted_value.max - result.extracted_value.max);
        }
        return 0;
    }
    /**
     * Verifica se a extração numérica foi exatamente correta (sem tolerância)
     * Considera valores originais se presentes (ex: price_original, min_original, max_original)
     */
    static isExactNumericMatch(expected, result) {
        if (!expected.extracted_value || !result.extracted_value)
            return false;
        if (expected.target_type !== result.target_type)
            return false;
        switch (expected.target_type) {
            case 'target_price': {
                const exp = expected.extracted_value;
                const res = result.extracted_value;
                if (exp.price_original !== undefined && res.price_original !== undefined) {
                    return exp.price === res.price && exp.price_original === res.price_original && exp.asset === res.asset && exp.currency === res.currency;
                }
                return exp.price === res.price && exp.asset === res.asset && exp.currency === res.currency;
            }
            case 'pct_change': {
                const exp = expected.extracted_value;
                const res = result.extracted_value;
                return exp.percentage === res.percentage && exp.asset === res.asset && exp.currency === res.currency;
            }
            case 'range': {
                const exp = expected.extracted_value;
                const res = result.extracted_value;
                if ('min_original' in exp && 'min_original' in res && 'max_original' in exp && 'max_original' in res && exp.min_original !== undefined && res.min_original !== undefined && exp.max_original !== undefined && res.max_original !== undefined) {
                    return exp.min === res.min && exp.max === res.max && exp.min_original === res.min_original && exp.max_original === res.max_original && exp.asset === res.asset && exp.currency === res.currency;
                }
                return exp.min === res.min && exp.max === res.max && exp.asset === res.asset && exp.currency === res.currency;
            }
            default:
                return false;
        }
    }
    /**
     * Calcula a correlação de Spearman entre dois arrays de valores
     * Retorna null se não for possível calcular
     */
    static spearmanCorrelation(a, b) {
        if (a.length !== b.length || a.length < 2)
            return null;
        // Função para rankear valores (média para empates)
        function safeValue(obj) {
            return obj?.v ?? NaN;
        }
        function rank(arr) {
            const sorted = arr.slice().map((v, i) => ({ v, i })).sort((x, y) => x.v - y.v);
            const ranks = new Array(arr.length);
            let i = 0;
            while (i < sorted.length) {
                let j = i;
                while (j + 1 < sorted.length &&
                    safeValue(sorted[j + 1]) === safeValue(sorted[i]))
                    j++;
                const avgRank = (i + j + 2) / 2; // ranks são 1-based
                for (let k = i; k <= j; k++) {
                    const item = sorted[k];
                    if (item !== undefined && item !== null) {
                        ranks[item.i] = avgRank;
                    }
                }
                i = j + 1;
            }
            return ranks;
        }
        const rankA = rank(a);
        const rankB = rank(b);
        const n = a.length;
        let dSum = 0;
        for (let i = 0; i < n; i++) {
            const d = rankA[i] - rankB[i];
            dSum += d * d;
        }
        // Fórmula de Spearman
        return 1 - (6 * dSum) / (n * (n * n - 1));
    }
}
export { Evaluator };
//# sourceMappingURL=evaluation.js.map