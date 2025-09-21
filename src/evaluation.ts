import type { PostInput, PredictionOutput, TargetType, TargetPrice, PercentageChange, Range } from '../src/types.ts';
import { CryptoPredictionParser } from './parser.js';
import * as fs from 'fs';

interface TestCase {
  input: PostInput;
  expected: PredictionOutput;
}

class Evaluator {
  private parser = new CryptoPredictionParser();

  /**
   * Full evaluation
   */
  public async evaluate(testCases: TestCase[]): Promise<void> {
    const executionTimes: number[] = [];
    const batch1Times: number[] = [];
    const batch16Times: number[] = [];
    let failCount = 0;
    const types: TargetType[] = ['target_price', 'pct_change', 'range', 'ranking', 'none'];
    const confusionMatrix: Record<string, Record<string, number>> = {};
    const perTypeCorrect: Record<string, { correct: number; total: number }> = {};
    const sentimentErrors: number[] = [];
    const trickyCases: { input: PostInput, expected: PredictionOutput, actual: PredictionOutput, notes: string[] }[] = [];
    let totalCorrect = 0;
    const expectedSentiments: number[] = [];
    const predictedSentiments: number[] = [];
    let exactNumericCorrect = 0;
    let exactNumericTotal = 0;
    let timeframeCorrect = 0;
    let timeframeTotal = 0;

    // Initialize structures
    types.forEach(t1 => {
      confusionMatrix[t1] = {};
      perTypeCorrect[t1] = { correct: 0, total: 0 };
      types.forEach(t2 => {
        confusionMatrix[t1]![t2] = 0;
      });
    });

    let idx = 0;
    for (const testCase of testCases) {
      const start = performance.now();
      const result = await this.parser.parsePrediction(testCase.input);
      const end = performance.now();
      const execTime = end - start;
      executionTimes.push(execTime);
      batch1Times.push(execTime);

      if ((idx + 1) % 16 === 0) {
        const batchTime = executionTimes.slice(idx - 15, idx + 1).reduce((a, b) => a + b, 0);
        batch16Times.push(batchTime);
      }

      const conformityErrors = this.checkConformity(result);

      if (conformityErrors.length > 0) {
        failCount++;
        trickyCases.push({
            input: testCase.input,
            expected: testCase.expected,
            actual: result,
            notes: [`Case #${idx + 1}: Output conformity failure -> ${conformityErrors.join('; ')}`]
        });
        idx++;
        continue; // Do not process metrics for this case
      }

      const expected = testCase.expected;
      const typeFail = result.target_type !== expected.target_type;
      const numFail = ['target_price', 'range', 'pct_change'].includes(expected.target_type) && result.extracted_value && expected.extracted_value && Evaluator.numericError(expected, result) > 0;
      if (typeFail || numFail) failCount++;

      confusionMatrix[expected.target_type]![result.target_type]!++;
      perTypeCorrect[expected.target_type]!.total++;

      if (result.target_type === expected.target_type) {
        perTypeCorrect[expected.target_type]!.correct++;
        totalCorrect++;
      } else {
    trickyCases.push({
      input: testCase.input,
      expected: testCase.expected,
      actual: result,
      notes: [`Case #${idx + 1}: Expected type ${expected.target_type}, got ${result.target_type}`]
    });
      }

      sentimentErrors.push(Math.abs(result.bear_bull - expected.bear_bull));
      expectedSentiments.push(expected.bear_bull);
      predictedSentiments.push(result.bear_bull);

      if (['target_price', 'range', 'pct_change', 'ranking'].includes(expected.target_type) && result.extracted_value && expected.extracted_value) {
        if (Evaluator.numericError(expected, result) > 0) {
          trickyCases.push({
            input: testCase.input,
            expected: testCase.expected,
            actual: result,
            notes: [`Case #${idx + 1}: Numeric extraction error`]
          });
        }
        exactNumericTotal++;
        if (Evaluator.isExactNumericMatch(expected, result)) {
          exactNumericCorrect++;
        }
      }

      if (expected.timeframe) {
        timeframeTotal++;
        if (result.timeframe.explicit === expected.timeframe.explicit && result.timeframe.start === expected.timeframe.start && result.timeframe.end === expected.timeframe.end) {
          timeframeCorrect++;
        } else {
            trickyCases.push({
                input: testCase.input,
                expected: testCase.expected,
                actual: result,
                notes: [`Case #${idx + 1}: Timeframe error. Expected: ${JSON.stringify(expected.timeframe)}, Got: ${JSON.stringify(result.timeframe)}`]
            });
        }
      }
      idx++;
    }

    this.printResults(testCases.length, executionTimes, batch1Times, batch16Times, failCount, types, confusionMatrix, perTypeCorrect, totalCorrect, sentimentErrors, exactNumericTotal, exactNumericCorrect, timeframeTotal, timeframeCorrect, expectedSentiments, predictedSentiments);
    this.generateTrickyCasesMarkdown(trickyCases);
  }

  private checkConformity(result: PredictionOutput): string[] {
    const errors: string[] = [];
    const isString = (val: any): boolean => typeof val === 'string';
    const isNumber = (val: any): boolean => typeof val === 'number' && !isNaN(val);
    const isBool = (val: any): boolean => typeof val === 'boolean';
    const isNullOrString = (val: any): boolean => val === null || isString(val);
    const isArrayOfStrings = (val: any): boolean => Array.isArray(val) && val.every(isString);

    if (!result.hasOwnProperty('target_type') || !isString(result.target_type) || !['target_price', 'pct_change', 'range', 'ranking', 'none'].includes(result.target_type)) {
      errors.push(`Required field missing or malformed: target_type (received: ${result.target_type})`);
    }
    if (!result.hasOwnProperty('bear_bull') || !isNumber(result.bear_bull)) {
      errors.push('Required field missing or malformed: bear_bull');
    }
    if (!result.hasOwnProperty('timeframe') || typeof result.timeframe !== 'object' || result.timeframe === null || !result.timeframe.hasOwnProperty('explicit') || !isBool(result.timeframe.explicit) || !isNullOrString(result.timeframe.start) || !isNullOrString(result.timeframe.end)) {
      errors.push('Required field missing or malformed: timeframe');
    }
    if (!result.hasOwnProperty('notes') || !isArrayOfStrings(result.notes)) {
      errors.push('Required field missing or malformed: notes');
    }
    if (!result.hasOwnProperty('post_text') || !isString(result.post_text)) {
        errors.push('Required field missing or malformed: post_text');
    }

    if (result.target_type !== 'none') {
      let ev = null;
      if (result.target_type === 'range') {
          if (!result.hasOwnProperty('extracted_range') || result.extracted_range === null || typeof result.extracted_range !== 'object') {
            errors.push('Required field missing or malformed: extracted_range');
        } else {
          ev = result.extracted_range;
        }
      } else {
          if (!result.hasOwnProperty('extracted_value') || result.extracted_value === null || typeof result.extracted_value !== 'object') {
            errors.push('Required field missing or malformed: extracted_value');
        } else {
          ev = result.extracted_value;
        }
      }
      if (ev) {
        if (!ev.hasOwnProperty('asset') || !isString(ev.asset)) errors.push(`${result.target_type === 'range' ? 'extracted_range' : 'extracted_value'}.asset missing/malformed`);
        if (!ev.hasOwnProperty('currency') || !isString(ev.currency)) errors.push(`${result.target_type === 'range' ? 'extracted_range' : 'extracted_value'}.currency missing/malformed`);
        if (result.target_type === 'target_price' && (!('price' in ev) || !isNumber((ev as TargetPrice).price))) errors.push('extracted_value.price missing/malformed');
        if (result.target_type === 'pct_change' && (!('percentage' in ev) || !isNumber((ev as PercentageChange).percentage))) errors.push('extracted_value.percentage missing/malformed');
        if (result.target_type === 'range' && (!('min' in ev) || !isNumber((ev as Range).min) || !('max' in ev) || !isNumber((ev as Range).max))) errors.push('extracted_range (min/max) missing/malformed');
        if (result.target_type === 'ranking' && (!('ranking' in ev) || !isNumber((ev as any).ranking))) errors.push('extracted_value.ranking missing/malformed');
      }
    } else {
      if (result.hasOwnProperty('extracted_value') && result.extracted_value !== null && result.extracted_value !== undefined) {
        errors.push('Field extracted_value must be null/undefined when target_type is none');
      }
      if (result.hasOwnProperty('extracted_range') && result.extracted_range !== null && result.extracted_range !== undefined) {
        errors.push('Field extracted_range must be null/undefined when target_type is none');
      }
    }
    return errors;
  }

  private printResults(totalCases: number, executionTimes: number[], batch1Times: number[], batch16Times: number[], failCount: number, types: TargetType[], confusionMatrix: Record<string, Record<string, number>>, perTypeCorrect: Record<string, { correct: number; total: number }>, totalCorrect: number, sentimentErrors: number[], exactNumericTotal: number, exactNumericCorrect: number, timeframeTotal: number, timeframeCorrect: number, expectedSentiments: number[], predictedSentiments: number[]) {
    const macroAccuracy = types.reduce((acc, t) => acc + ((perTypeCorrect[t]?.correct || 0) / (perTypeCorrect[t]?.total || 1)), 0) / types.length;
    const overallAccuracy = totalCorrect / totalCases;
    const avgSentimentError = sentimentErrors.length ? (sentimentErrors.reduce((a, b) => a + b, 0) / sentimentErrors.length) : 0;
    const timeframeAccuracy = timeframeTotal > 0 ? timeframeCorrect / timeframeTotal : 0;
    const spearman = Evaluator.spearmanCorrelation(expectedSentiments, predictedSentiments);

    console.log('=== Evaluation Results ===');
    console.log(`Macro Accuracy (por tipo): ${(macroAccuracy * 100).toFixed(2)}%`);
    console.log(`Overall Accuracy: ${(overallAccuracy * 100).toFixed(2)}%`);
    console.log(`Timeframe Accuracy: ${(timeframeAccuracy * 100).toFixed(2)}%`);
    console.log(`Average Sentiment Error: ${avgSentimentError.toFixed(2)}`);
    console.log(`Spearman correlation (sentimento): ${spearman !== null ? spearman.toFixed(3) : 'N/A'}`);

    if (exactNumericTotal > 0) {
      const exactRate = (exactNumericCorrect / exactNumericTotal) * 100;
      console.log(`Exact match rate for numeric extraction: ${exactRate.toFixed(2)}% (${exactNumericCorrect}/${exactNumericTotal} cases)`);
      if (exactRate < 80) console.warn(`WARNING: Numeric extraction accuracy (${exactRate.toFixed(2)}%) is below the minimum of 80%.`);
    } else {
      console.log('No numeric extraction cases to evaluate exact match rate.');
    }

    console.log('\nConfusion Matrix:');
    console.table(confusionMatrix);
    console.log('\nPer-Type Accuracy:');
    types.forEach(t => {
      const { correct, total } = perTypeCorrect[t] || { correct: 0, total: 0 };
      const acc = total > 0 ? (correct / total) * 100 : 0;
      console.log(`${t}: ${acc.toFixed(2)}% (${correct}/${total})`);
    });

    if (spearman === null) {
      console.error('ERROR: Could not calculate Spearman correlation for sentiment.');
    } else if (spearman < 0.60) {
      console.error(`ERROR: Spearman correlation (${spearman.toFixed(3)}) is below the minimum of 0.60.`);
    }

  console.log('\n=== Cost/Failure Report ===');
  const sortedTimes = [...executionTimes].sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
  console.log(`p50 (median): ${p50.toFixed(2)}ms`);
  console.log(`p95: ${p95.toFixed(2)}ms`);
  const avgBatch1 = batch1Times.length ? (batch1Times.reduce((a, b) => a + b, 0) / batch1Times.length) : 0;
  console.log(`Average batch=1 time: ${avgBatch1.toFixed(2)}ms`);
  const avgBatch16 = batch16Times.length ? (batch16Times.reduce((a, b) => a + b, 0) / batch16Times.length) : 0;
  console.log(`Average batch=16 time: ${avgBatch16.toFixed(2)}ms`);
  console.log(`Total conformity/execution failures: ${failCount} (${((failCount / totalCases) * 100).toFixed(2)}%)`);
  }

  private generateTrickyCasesMarkdown(trickyCases: { input: PostInput, expected: PredictionOutput, actual: PredictionOutput, notes: string[] }[]): void {
    const header = '# Tricky Cases\n\nThis file documents difficult or ambiguous cases encountered during the parsing and evaluation.\n\n---\n';
  const content = trickyCases.map(c => {
    return `## ${c.notes[0]}\n\n**Input:**\n\`\`\`json\n${JSON.stringify(c.input, null, 2)}\n\`\`\`\n\n**Expected:**\n\`\`\`json\n${JSON.stringify(c.expected, null, 2)}\n\`\`\`\n\n**Actual:**\n\`\`\`json\n${JSON.stringify(c.actual, null, 2)}\n\`\`\`\n\n---\n`;
  }).join('\n');
    fs.writeFileSync('tricky_cases.md', header + content);
  console.log('\nFile tricky_cases.md generated successfully.');
  }

  public static numericError(expected: PredictionOutput, result: PredictionOutput): number {
      let exp, res;
      if (expected.target_type === 'range') {
        exp = expected.extracted_range || expected.extracted_value;
        res = result.extracted_range || result.extracted_value;
        if (!exp || !res) return 1;
        // Type guard para Range
        if ('min' in exp && 'max' in exp && 'min' in res && 'max' in res) {
          return exp.min === res.min && exp.max === res.max ? 0 : 1;
        }
        return 1;
      }
      exp = expected.extracted_value;
      res = result.extracted_value;
      if (!exp || !res || expected.target_type !== result.target_type) return 1;
      if (expected.target_type === 'target_price' && 'price' in exp && 'price' in res) {
        return exp.price === res.price ? 0 : 1;
      }
      if (expected.target_type === 'pct_change' && 'percentage' in exp && 'percentage' in res) {
        return exp.percentage === res.percentage ? 0 : 1;
      }
      return 0;
  }

  static isExactNumericMatch(expected: PredictionOutput, result: PredictionOutput): boolean {
    let exp, res;
    if (expected.target_type === 'range') {
      exp = expected.extracted_range || expected.extracted_value;
      res = result.extracted_range || result.extracted_value;
      if (!exp || !res) return false;
      if (exp.asset !== res.asset || exp.currency !== res.currency) return false;
      if ('min' in exp && 'max' in exp && 'min' in res && 'max' in res) {
        return exp.min === res.min && exp.max === res.max;
      }
      return false;
    }
    exp = expected.extracted_value;
    res = result.extracted_value;
    if (!exp || !res || expected.target_type !== result.target_type) return false;
    if (exp.asset !== res.asset || exp.currency !== res.currency) return false;
    switch (expected.target_type) {
      case 'target_price':
        if ('price' in exp && 'price' in res) return exp.price === res.price;
        return false;
      case 'pct_change':
        if ('percentage' in exp && 'percentage' in res) return exp.percentage === res.percentage;
        return false;
      case 'ranking':
        if ('ranking' in exp && 'ranking' in res) return exp.ranking === res.ranking;
        return false;
      default: return false;
    }
  }

  static spearmanCorrelation(a: number[], b: number[]): number | null {
    if (a.length !== b.length || a.length < 2) return null;
    const rank = (arr: number[]): number[] => {
      const sorted = arr.slice().map((v, i) => ({ v, i })).sort((x, y) => x.v - y.v);
      const ranks = new Array(arr.length);
      for (let i = 0; i < sorted.length; ) {
        let j = i;
        while (j < sorted.length - 1 && sorted[j]!.v === sorted[j + 1]!.v) j++;
        const avgRank = (i + j + 2) / 2;
        for (let k = i; k <= j; k++) ranks[sorted[k]!.i] = avgRank;
        i = j + 1;
      }
      return ranks;
    };
    const rankA = rank(a);
    const rankB = rank(b);
    const n = a.length;
    let dSum = 0;
    for (let i = 0; i < n; i++) {
      const d = (rankA[i] ?? 0) - (rankB[i] ?? 0);
      dSum += d * d;
    }
    return 1 - (6 * dSum) / (n * (n * n - 1));
  }
}

export { Evaluator };
