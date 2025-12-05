/**
 * Thai Rental Market Benchmarks (2025)
 * Real-time price intelligence data for major cities
 */

export const MARKET_BENCHMARKS = {
  'chiang mai': {
    studio: { min: 5000, max: 10000, avg: 7500 },
    '1br': { min: 8000, max: 15000, avg: 11500 },
    '2br': { min: 12000, max: 25000, avg: 18500 },
    '3br': { min: 18000, max: 35000, avg: 26500 }
  },
  'bangkok': {
    studio: { min: 8000, max: 15000, avg: 11500 },
    '1br': { min: 12000, max: 25000, avg: 18500 },
    '2br': { min: 20000, max: 40000, avg: 30000 },
    '3br': { min: 30000, max: 60000, avg: 45000 }
  },
  'phuket': {
    studio: { min: 10000, max: 18000, avg: 14000 },
    '1br': { min: 15000, max: 30000, avg: 22500 },
    '2br': { min: 25000, max: 50000, avg: 37500 },
    '3br': { min: 35000, max: 70000, avg: 52500 }
  },
  'pattaya': {
    studio: { min: 6000, max: 12000, avg: 9000 },
    '1br': { min: 10000, max: 18000, avg: 14000 },
    '2br': { min: 15000, max: 30000, avg: 22500 },
    '3br': { min: 20000, max: 40000, avg: 30000 }
  },
  'hua hin': {
    studio: { min: 7000, max: 14000, avg: 10500 },
    '1br': { min: 10000, max: 20000, avg: 15000 },
    '2br': { min: 15000, max: 30000, avg: 22500 },
    '3br': { min: 20000, max: 40000, avg: 30000 }
  },
  'krabi': {
    studio: { min: 8000, max: 15000, avg: 11500 },
    '1br': { min: 12000, max: 25000, avg: 18500 },
    '2br': { min: 20000, max: 40000, avg: 30000 },
    '3br': { min: 25000, max: 50000, avg: 37500 }
  }
};

/**
 * 7-Level Price Classification System
 */
export const PRICE_CLASSIFICATIONS = {
  EXCELLENT_DEAL: {
    range: { max: -0.40 },
    label: 'Excellent deal',
    message: 'This is EXCEPTIONALLY cheap!',
    emoji: '🎉',
    color: '#00C853'
  },
  VERY_GOOD_DEAL: {
    range: { min: -0.40, max: -0.20 },
    label: 'Very good deal',
    message: "That's a VERY GOOD price",
    emoji: '✨',
    color: '#64DD17'
  },
  GOOD_PRICE: {
    range: { min: -0.20, max: -0.10 },
    label: 'Good price',
    message: "That's a good price",
    emoji: '👍',
    color: '#AEEA00'
  },
  FAIR_PRICE: {
    range: { min: -0.10, max: 0.10 },
    label: 'Fair price',
    message: "That's a fair market price",
    emoji: '⚖️',
    color: '#FFD600'
  },
  SLIGHTLY_HIGH: {
    range: { min: 0.10, max: 0.20 },
    label: 'Slightly high',
    message: "That's slightly above average",
    emoji: '⚠️',
    color: '#FF9100'
  },
  QUITE_HIGH: {
    range: { min: 0.20, max: 0.40 },
    label: 'Quite high',
    message: "That's quite high for this area",
    emoji: '📈',
    color: '#FF6D00'
  },
  VERY_EXPENSIVE: {
    range: { min: 0.40 },
    label: 'Very expensive',
    message: "That's VERY expensive",
    emoji: '🚨',
    color: '#DD2C00'
  }
};

/**
 * Property type keywords for detection
 */
export const PROPERTY_TYPES = {
  studio: ['studio', 'efficiency', 'bedsit'],
  '1br': ['1 bedroom', '1br', 'one bedroom', '1-bedroom'],
  '2br': ['2 bedroom', '2br', 'two bedroom', '2-bedroom'],
  '3br': ['3 bedroom', '3br', 'three bedroom', '3-bedroom']
};

/**
 * Normalize city name for lookup
 */
export function normalizeCity(city) {
  if (!city) return null;
  return city.toLowerCase().trim();
}

/**
 * Detect property type from context
 */
export function detectPropertyType(context) {
  const lowerContext = context.toLowerCase();
  
  for (const [type, keywords] of Object.entries(PROPERTY_TYPES)) {
    if (keywords.some(keyword => lowerContext.includes(keyword))) {
      return type;
    }
  }
  
  return '1br'; // Default to 1BR if not specified
}
