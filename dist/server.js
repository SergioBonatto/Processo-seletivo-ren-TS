import express from 'express';
import { CryptoPredictionParser } from './parser.js';
const app = express();
const parser = new CryptoPredictionParser();
app.use(express.json());
app.post('/parse_prediction', (req, res) => {
    try {
        const input = req.body;
        if (!input.post_text || !input.post_created_at) {
            return res.status(400).json({
                error: 'Missing required fields: post_text, post_created_at'
            });
        }
        const result = parser.parsePrediction(input);
        res.json(result);
    }
    catch (error) {
        console.error('Parse error:', error);
        res.status(500).json({ error: 'Internal parsing error' });
    }
});
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Crypto Prediction Parser running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map