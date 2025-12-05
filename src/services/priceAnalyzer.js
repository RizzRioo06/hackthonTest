import { MARKET_BENCHMARKS, PRICE_CLASSIFICATIONS, normalizeCity, detectPropertyType } from '../config/marketData.js';

/**
 * Price Intelligence System
 * Analyzes rental prices against real Thai market data
 */
export class PriceAnalyzer {
  /**
   * Extract price from text (supports multiple formats)
   */
  extractPrice(text) {
    // Match patterns like: 3000, 3,000, 3000฿, 3000 baht, 3k
    const patterns = [
      /(\d{1,3}(?:,\d{3})*)\s*(?:฿|baht|thb)/gi,
      /(\d{1,3}(?:,\d{3})*)\s*(?:per month|\/month|monthly)/gi,
      /(\d+)k\s*(?:฿|baht|thb)?/gi,
      /(\d{1,3}(?:,\d{3})*)/g
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let price = match[0].replace(/[^\d]/g, '');
        
        // Handle 'k' notation (3k = 3000)
        if (match[0].toLowerCase().includes('k')) {
          price = parseInt(price) * 1000;
        } else {
          price = parseInt(price);
        }

        if (price > 1000 && price < 200000) { // Reasonable rental range
          return price;
        }
      }
    }

    return null;
  }

  /**
   * Analyze price against market data
   */
  analyzePrice(price, city, propertyType, context = '') {
    const normalizedCity = normalizeCity(city);
    const detectedType = propertyType || detectPropertyType(context);

    // Get market benchmark
    const cityData = MARKET_BENCHMARKS[normalizedCity];
    if (!cityData) {
      return {
        classification: null,
        message: `Market data not available for ${city}. Please specify: Chiang Mai, Bangkok, Phuket, Pattaya, Hua Hin, or Krabi.`,
        deviation: null,
        marketRange: null
      };
    }

    const benchmark = cityData[detectedType];
    if (!benchmark) {
      return {
        classification: null,
        message: `Property type not recognized. Please specify: studio, 1BR, 2BR, or 3BR.`,
        deviation: null,
        marketRange: null
      };
    }

    // Calculate deviation from average
    const deviation = (price - benchmark.avg) / benchmark.avg;

    // Classify price
    const classification = this.classifyPrice(deviation);

    // Generate detailed message
    const message = this.generatePriceMessage(
      classification,
      price,
      benchmark,
      deviation,
      normalizedCity,
      detectedType
    );

    return {
      classification: classification.label,
      message,
      deviation: Math.round(deviation * 100),
      marketRange: {
        min: benchmark.min,
        max: benchmark.max,
        avg: benchmark.avg
      },
      emoji: classification.emoji,
      color: classification.color
    };
  }

  /**
   * Classify price based on deviation
   */
  classifyPrice(deviation) {
    for (const classification of Object.values(PRICE_CLASSIFICATIONS)) {
      const { min = -Infinity, max = Infinity } = classification.range;
      if (deviation > min && deviation <= max) {
        return classification;
      }
    }
    return PRICE_CLASSIFICATIONS.FAIR_PRICE;
  }

  /**
   * Generate detailed price analysis message
   */
  generatePriceMessage(classification, price, benchmark, deviation, city, propertyType) {
    const deviationPercent = Math.abs(Math.round(deviation * 100));
    const direction = deviation < 0 ? 'below' : 'above';
    
    let message = `${classification.emoji} ${classification.message}\n\n`;
    message += `📊 **Market Analysis for ${city.toUpperCase()}:**\n`;
    message += `- Your price: ${price.toLocaleString()}฿/month\n`;
    message += `- Market range: ${benchmark.min.toLocaleString()}฿ - ${benchmark.max.toLocaleString()}฿\n`;
    message += `- Average: ${benchmark.avg.toLocaleString()}฿\n`;
    message += `- Deviation: ${deviationPercent}% ${direction} average\n\n`;

    // Add negotiation advice
    if (deviation > 0.10) {
      message += `💡 **Negotiation Tip:** This price is above market average. You could try:\n`;
      message += `- Negotiating 10-15% discount for long-term rental\n`;
      message += `- Asking what's included (utilities, internet, cleaning)\n`;
      message += `- Requesting better terms (flexible move-out, included services)\n`;
    } else if (deviation < -0.20) {
      message += `💡 **Smart Check:** This is an excellent price! Before committing:\n`;
      message += `- Inspect the property condition carefully\n`;
      message += `- Verify all amenities work properly\n`;
      message += `- Check the neighborhood and transportation\n`;
      message += `- Read the contract terms thoroughly\n`;
    } else {
      message += `💡 **Advice:** Fair market price. Consider:\n`;
      message += `- Comparing similar properties in the area\n`;
      message += `- Asking about utilities and internet inclusion\n`;
      message += `- Negotiating 5-10% off for upfront payment\n`;
    }

    return message;
  }

  /**
   * Generate smart advice based on context
   */
  generateSmartAdvice(landlordMessage, guestContext, priceAnalysis) {
    const advice = [];

    // Cultural context
    if (landlordMessage.includes('tomorrow') || landlordMessage.includes('พรุ่งนี้')) {
      advice.push("⏰ Cultural Note: 'Tomorrow' is a common response time in Thailand. If urgent, politely ask for a specific time.");
    }

    // Price-based advice
    if (priceAnalysis && priceAnalysis.classification) {
      const deviation = priceAnalysis.deviation;
      
      if (deviation < -20) {
        advice.push("🎯 This is a great opportunity! Act quickly but inspect carefully.");
      } else if (deviation > 20) {
        advice.push("💰 Consider negotiating or looking at comparable properties in the area.");
      }
    }

    // Deposit and contract advice
    if (landlordMessage.toLowerCase().includes('deposit') || landlordMessage.includes('มัดจำ')) {
      advice.push("📝 Standard Thai rental deposits: 1-2 months rent. Ensure receipt and refund terms in contract.");
    }

    // Utility advice
    if (landlordMessage.toLowerCase().includes('utility') || landlordMessage.includes('ค่าน้ำค่าไฟ')) {
      advice.push("💡 Ask about utility rates per unit. Standard: Electricity 6-8฿/unit, Water 18-25฿/unit.");
    }

    return advice.length > 0 ? advice.join('\n\n') : null;
  }

  /**
   * Suggest appropriate response to guest
   */
  suggestResponse(landlordMessage, priceAnalysis, guestEmotion) {
    // If price is mentioned
    if (priceAnalysis && priceAnalysis.classification) {
      const deviation = priceAnalysis.deviation;

      if (deviation < -20) {
        return "Thank you! That's very reasonable. Could I schedule a viewing to see the property?";
      } else if (deviation > 20) {
        const negotiatedPrice = Math.round(priceAnalysis.marketRange.avg);
        return `Thank you for the information. I've seen similar properties around ${negotiatedPrice.toLocaleString()}฿. Would there be flexibility on the price?`;
      } else {
        return "That's reasonable. Could you provide details about what's included (utilities, internet, cleaning)?";
      }
    }

    // If repair/maintenance mentioned
    if (landlordMessage.toLowerCase().includes('fix') || 
        landlordMessage.toLowerCase().includes('repair') ||
        landlordMessage.includes('ซ่อม')) {
      return "Thank you for the quick response. Could you please confirm approximately what time? I'll make sure to be available.";
    }

    // If viewing/inspection mentioned
    if (landlordMessage.toLowerCase().includes('see') || 
        landlordMessage.toLowerCase().includes('view') ||
        landlordMessage.includes('ดู')) {
      return "Perfect! What time works best for you? I'm flexible with my schedule.";
    }

    // Default polite response
    return "Thank you for your response. I appreciate your help.";
  }
}

export default new PriceAnalyzer();
