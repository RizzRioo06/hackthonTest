import axios from 'axios';

/**
 * AI Interpreter Service
 * Handles 3rd person professional interpretation with offensive language filtering
 */
export class AIInterpreterService {
  constructor(apiKey, apiUrl) {
    if (!apiKey) {
      throw new Error('AIML_API_KEY is required but not provided');
    }
    
    this.apiKey = apiKey;
    this.apiUrl = apiUrl || 'https://api.aimlapi.com/v1';
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Detect emotion from guest message
   */
  detectEmotion(message) {
    const emotions = {
      angry: ['fuck', 'shit', 'damn', 'scam', 'terrible', 'worst', 'hate', 'angry', 'pissed'],
      frustrated: ['frustrated', 'annoyed', 'irritated', 'waiting', 'still', 'not working'],
      worried: ['worried', 'concerned', 'afraid', 'problem', 'issue', 'help'],
      excited: ['great', 'amazing', 'perfect', 'excellent', 'love', 'excited', '!'],
      neutral: []
    };

    const lowerMessage = message.toLowerCase();

    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return emotion;
      }
    }

    return 'neutral';
  }

  /**
   * Check if message contains offensive language
   */
  hasOffensiveLanguage(message) {
    const offensiveWords = [
      'fuck', 'shit', 'damn', 'asshole', 'bitch', 'bastard', 
      'crap', 'piss', 'hell', 'scam', 'cheat', 'liar',
      'idiot', 'stupid', 'dumb', 'moron'
    ];

    const lowerMessage = message.toLowerCase();
    return offensiveWords.some(word => lowerMessage.includes(word));
  }

  /**
   * Interpret guest message to landlord (FLOW 1)
   * Filters offensive language and converts to professional 3rd person
   */
  async interpretGuestToLandlord(guestMessage, context = {}) {
    const hasOffensive = this.hasOffensiveLanguage(guestMessage);
    const emotion = this.detectEmotion(guestMessage);

    const systemPrompt = `You are a professional interpreter facilitating communication between a foreign guest and a Thai landlord. 

CRITICAL RULES:
1. ALWAYS speak in 3rd person: "The guest says..." or "The guest asks..." (NEVER "I want..." or "I need...")
2. Filter offensive language but preserve legitimate concerns
3. Be diplomatic and professional
4. Maintain the core message intent
5. Add polite framing appropriate for Thai culture

Context: ${JSON.stringify(context)}
Guest emotion detected: ${emotion}
Offensive language present: ${hasOffensive}`;

    const userPrompt = `Convert this guest message to professional 3rd person interpretation for the landlord:

Guest message: "${guestMessage}"

Provide TWO outputs:
1. English (3rd person, professional, diplomatic)
2. Thai translation (3rd person, polite, appropriate for Thai landlord)

Format your response as JSON:
{
  "englishToLandlord": "The guest...",
  "thaiToLandlord": "แขก...",
  "wasFiltered": true/false
}`;

    try {
      const response = await this.client.post('/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const content = response.data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

      return {
        englishToLandlord: result.englishToLandlord,
        thaiToLandlord: result.thaiToLandlord,
        guestEmotion: emotion,
        interpretingNote: hasOffensive ? "Removed offensive language, converted to professional request" : null
      };
    } catch (error) {
      console.error('AI Interpretation Error:', error.response?.data || error.message);
      throw new Error('Failed to interpret message');
    }
  }

  /**
   * Translate landlord message to guest (FLOW 2)
   * Simple translation without filtering
   */
  async translateLandlordToGuest(landlordMessage, context = {}) {
    const systemPrompt = `You are a professional interpreter translating a Thai landlord's message to a foreign guest.

RULES:
1. Translate naturally to English
2. Maintain the landlord's tone
3. Add brief cultural context if relevant
4. Keep it concise and clear

Context: ${JSON.stringify(context)}`;

    const userPrompt = `Translate this landlord's message to English for the guest:

Landlord message: "${landlordMessage}"

Provide clear, natural English translation.`;

    try {
      const response = await this.client.post('/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Translation Error:', error.response?.data || error.message);
      throw new Error('Failed to translate message');
    }
  }

  /**
   * Detect if message is in Thai
   */
  isThaiLanguage(text) {
    // Thai Unicode range: \u0E00-\u0E7F
    const thaiPattern = /[\u0E00-\u0E7F]/;
    return thaiPattern.test(text);
  }

  /**
   * Extract Thai and English portions from mixed message
   */
  extractLanguages(text) {
    const thaiPattern = /[\u0E00-\u0E7F\s]+/g;
    const thai = text.match(thaiPattern)?.join(' ').trim() || '';
    const english = text.replace(thaiPattern, '').trim();
    
    return { thai, english };
  }
}

export default AIInterpreterService;
