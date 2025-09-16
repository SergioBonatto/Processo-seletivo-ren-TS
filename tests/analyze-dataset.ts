import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { CryptoPredictionParser } from '../src/parser.ts';
import type { PostInput, PredictionOutput } from '../src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function analyzeDataset() {
  const datasetPath = path.resolve(__dirname, '../dataset.json');
  const datasetContent = fs.readFileSync(datasetPath, 'utf-8');
  const dataset: PostInput[] = JSON.parse(datasetContent);

  const parser = new CryptoPredictionParser();

  console.log('\n--- Analyzing dataset.json ---');
  let i = 1;
  for (const entry of dataset) {
    try {
      const result: PredictionOutput = await parser.parsePrediction(entry);
      console.log(`\n--- Entry ${i++} ---`);
      console.log(`Input: ${JSON.stringify(entry, null, 2)}`);
      console.log(`Output: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      console.error(`\n--- Error processing entry ${i++}: ${JSON.stringify(entry, null, 2)} ---`);
      console.error(error);
    }
  }
  console.log('\n--- Dataset analysis complete ---');
}

analyzeDataset();
