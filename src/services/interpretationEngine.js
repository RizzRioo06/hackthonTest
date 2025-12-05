import AIInterpreterService from './aiInterpreter.js';
import PriceAnalyzer from './priceAnalyzer.js';

/**
 * Main Interpretation Engine
 * Orchestrates the complete interpretation workflow
 */
export class InterpretationEngine {
  constructor(apiKey, apiUrl) {
    this.aiService = new AIInterpreterService(apiKey, apiUrl);
    this.priceAnalyzer = PriceAnalyzer;
  }

  /**
   * FLOW 1: Guest → Landlord
   * Convert guest message to professional 3rd person with filtering
   */
  async processGuestMessage(guestMessage, context = {}) {
    try {
      // Step 1: Interpret and filter
      const interpretation = await this.aiService.interpretGuestToLandlord(
        guestMessage,
        context
      );

      return {
        success: true,
        englishToLandlord: interpretation.englishToLandlord,
        thaiToLandlord: interpretation.thaiToLandlord,
        guestEmotion: interpretation.guestEmotion,
        interpretingNote: interpretation.interpretingNote,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * FLOW 2: Landlord → Guest
   * Translate landlord message with price analysis and smart advice
   */
  async processLandlordMessage(landlordMessage, context = {}) {
    try {
      // Step 1: Translate message
      const translation = await this.aiService.translateLandlordToGuest(
        landlordMessage,
        context
      );

      // Step 2: Check for price mention
      const extractedPrice = this.priceAnalyzer.extractPrice(landlordMessage);
      let priceAnalysis = null;

      if (extractedPrice && context.city) {
        priceAnalysis = this.priceAnalyzer.analyzePrice(
          extractedPrice,
          context.city,
          context.propertyType,
          landlordMessage + ' ' + (context.previousMessages || '')
        );
      }

      // Step 3: Generate smart advice
      const aiAdvice = this.priceAnalyzer.generateSmartAdvice(
        landlordMessage,
        context,
        priceAnalysis
      );

      // Step 4: Suggest appropriate response
      const suggestedResponse = this.priceAnalyzer.suggestResponse(
        landlordMessage,
        priceAnalysis,
        context.guestEmotion
      );

      return {
        success: true,
        translationToGuest: translation,
        priceAnalysis: priceAnalysis ? {
          classification: priceAnalysis.classification,
          message: priceAnalysis.message,
          emoji: priceAnalysis.emoji,
          color: priceAnalysis.color,
          deviation: priceAnalysis.deviation,
          marketRange: priceAnalysis.marketRange,
          detectedPrice: extractedPrice
        } : null,
        aiAdvice,
        suggestedResponse,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Process conversation turn (auto-detect direction)
   */
  async processMessage(message, sender, context = {}) {
    if (sender === 'guest') {
      return await this.processGuestMessage(message, context);
    } else if (sender === 'landlord') {
      return await this.processLandlordMessage(message, context);
    } else {
      throw new Error('Invalid sender. Must be "guest" or "landlord"');
    }
  }
}

export default InterpretationEngine;
