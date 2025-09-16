import { testCases } from './test-cases.js';
import { Evaluator } from '../src/evaluation.js';

const evaluator = new Evaluator();
evaluator.evaluate(testCases as any);
