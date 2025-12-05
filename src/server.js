import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import InterpretationEngine from './services/interpretationEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize AI Interpreter
const interpreter = new InterpretationEngine(
  process.env.AIML_API_KEY,
  process.env.AIML_API_URL
);

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'AI 3-Way Professional Interpreter',
    version: '1.0.0'
  });
});

/**
 * Main interpretation endpoint
 * POST /api/interpret
 * 
 * Body:
 * {
 *   "message": "fuck you, fix the AC now!",
 *   "sender": "guest",  // or "landlord"
 *   "context": {
 *     "city": "chiang mai",
 *     "propertyType": "1br",
 *     "guestName": "John",
 *     "landlordName": "Somchai",
 *     "previousMessages": "..."
 *   }
 * }
 */
app.post('/api/interpret', async (req, res) => {
  try {
    const { message, sender, context } = req.body;

    // Validate input
    if (!message || !sender) {
      return res.status(400).json({
        error: 'Missing required fields: message and sender'
      });
    }

    if (!['guest', 'landlord'].includes(sender)) {
      return res.status(400).json({
        error: 'Invalid sender. Must be "guest" or "landlord"'
      });
    }

    // Process message
    const result = await interpreter.processMessage(message, sender, context || {});

    res.json(result);
  } catch (error) {
    console.error('Interpretation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Price analysis endpoint (standalone)
 * POST /api/analyze-price
 * 
 * Body:
 * {
 *   "price": 8000,
 *   "city": "chiang mai",
 *   "propertyType": "1br"
 * }
 */
app.post('/api/analyze-price', (req, res) => {
  try {
    const { price, city, propertyType } = req.body;

    if (!price || !city) {
      return res.status(400).json({
        error: 'Missing required fields: price and city'
      });
    }

    const analysis = interpreter.priceAnalyzer.analyzePrice(
      price,
      city,
      propertyType || '1br',
      ''
    );

    res.json(analysis);
  } catch (error) {
    console.error('Price analysis error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Get market data for a city
 * GET /api/market-data/:city
 */
app.get('/api/market-data/:city', async (req, res) => {
  const { city } = req.params;
  const { MARKET_BENCHMARKS } = await import('./config/marketData.js');
  
  const normalizedCity = city.toLowerCase().trim();
  const data = MARKET_BENCHMARKS[normalizedCity];

  if (!data) {
    return res.status(404).json({
      error: 'City not found',
      availableCities: Object.keys(MARKET_BENCHMARKS)
    });
  }

  res.json({
    city: normalizedCity,
    data
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌐 AI 3-Way Interpreter Server running on port ${PORT}`);
  console.log(`📊 API Endpoint: http://localhost:${PORT}/api/interpret`);
  console.log(`💰 Price Analysis: http://localhost:${PORT}/api/analyze-price`);
  console.log(`🏠 Market Data: http://localhost:${PORT}/api/market-data/:city`);
});

export default app;
