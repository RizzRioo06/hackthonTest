// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const guestInput = document.getElementById('guestInput');
const guestSend = document.getElementById('guestSend');
const guestMessages = document.getElementById('guestMessages');

const landlordInput = document.getElementById('landlordInput');
const landlordSend = document.getElementById('landlordSend');
const landlordMessages = document.getElementById('landlordMessages');

const interpreterMessages = document.getElementById('interpreterMessages');

const cityInput = document.getElementById('cityInput');
const propertyTypeSelect = document.getElementById('propertyTypeSelect');
const guestNameInput = document.getElementById('guestNameInput');
const landlordNameInput = document.getElementById('landlordNameInput');

// Conversation History
let conversationHistory = [];

/**
 * Get current context
 */
function getContext() {
    return {
        city: cityInput.value.trim(),
        propertyType: propertyTypeSelect.value,
        guestName: guestNameInput.value.trim(),
        landlordName: landlordNameInput.value.trim(),
        previousMessages: conversationHistory.slice(-3).map(m => m.message).join(' ')
    };
}

/**
 * Add message to conversation history
 */
function addToHistory(sender, message, result) {
    conversationHistory.push({
        sender,
        message,
        result,
        timestamp: new Date().toISOString()
    });
}

/**
 * Format timestamp
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

/**
 * Create message element
 */
function createMessageElement(content, badges = [], additionalContent = []) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    messageDiv.appendChild(contentDiv);
    
    // Add badges
    if (badges.length > 0) {
        const badgesDiv = document.createElement('div');
        badgesDiv.className = 'message-badges';
        badges.forEach(badge => {
            const badgeSpan = document.createElement('span');
            badgeSpan.className = `badge ${badge.class}`;
            badgeSpan.innerHTML = `${badge.emoji} ${badge.text}`;
            badgesDiv.appendChild(badgeSpan);
        });
        messageDiv.appendChild(badgesDiv);
    }
    
    // Add additional content (price analysis, advice, etc.)
    additionalContent.forEach(content => {
        messageDiv.appendChild(content);
    });
    
    // Add timestamp
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'timestamp';
    timestampDiv.textContent = formatTimestamp(new Date());
    messageDiv.appendChild(timestampDiv);
    
    return messageDiv;
}

/**
 * Create price analysis element
 */
function createPriceAnalysis(analysis) {
    const div = document.createElement('div');
    div.className = 'price-analysis';
    div.style.borderColor = analysis.color;
    
    const title = document.createElement('h4');
    title.innerHTML = `${analysis.emoji} ${analysis.classification}`;
    title.style.color = analysis.color;
    div.appendChild(title);
    
    const message = document.createElement('div');
    message.innerHTML = analysis.message.replace(/\n/g, '<br>');
    div.appendChild(message);
    
    return div;
}

/**
 * Create AI advice element
 */
function createAIAdvice(advice) {
    const div = document.createElement('div');
    div.className = 'ai-advice';
    
    const title = document.createElement('h4');
    title.innerHTML = '💡 Smart Advice';
    div.appendChild(title);
    
    const content = document.createElement('div');
    content.innerHTML = advice.replace(/\n/g, '<br>');
    div.appendChild(content);
    
    return div;
}

/**
 * Create suggested response element
 */
function createSuggestedResponse(response) {
    const div = document.createElement('div');
    div.className = 'suggested-response';
    
    const title = document.createElement('h4');
    title.innerHTML = '💬 Suggested Response';
    div.appendChild(title);
    
    const content = document.createElement('div');
    content.className = 'response-text';
    content.textContent = `"${response}"`;
    div.appendChild(content);
    
    return div;
}

/**
 * Send guest message
 */
async function sendGuestMessage() {
    const message = guestInput.value.trim();
    if (!message) return;
    
    // Show guest's original message
    const guestMsg = createMessageElement(message);
    guestMessages.appendChild(guestMsg);
    guestMessages.scrollTop = guestMessages.scrollHeight;
    
    // Show loading in interpreter
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message';
    loadingDiv.innerHTML = '<div class="loading"></div> Processing...';
    interpreterMessages.appendChild(loadingDiv);
    interpreterMessages.scrollTop = interpreterMessages.scrollHeight;
    
    // Clear input
    guestInput.value = '';
    
    try {
        // Call API
        const response = await fetch(`${API_BASE_URL}/interpret`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                sender: 'guest',
                context: getContext()
            })
        });
        
        const result = await response.json();
        
        // Remove loading
        loadingDiv.remove();
        
        if (result.success) {
            // Add to history
            addToHistory('guest', message, result);
            
            // Show interpreter analysis
            const badges = [];
            if (result.interpretingNote) {
                badges.push({ emoji: '🛡️', text: 'Filtered', class: 'badge-filter' });
            }
            if (result.guestEmotion && result.guestEmotion !== 'neutral') {
                badges.push({ emoji: '😠', text: result.guestEmotion, class: 'badge-emotion' });
            }
            
            const interpreterMsg = createMessageElement(
                `🇬🇧 To Landlord: "${result.englishToLandlord}"\n\n🇹🇭 Thai: "${result.thaiToLandlord}"`,
                badges
            );
            
            if (result.interpretingNote) {
                const noteDiv = document.createElement('div');
                noteDiv.className = 'ai-advice';
                noteDiv.innerHTML = `<h4>📝 Interpreting Note</h4><p>${result.interpretingNote}</p>`;
                interpreterMsg.appendChild(noteDiv);
            }
            
            interpreterMessages.appendChild(interpreterMsg);
            interpreterMessages.scrollTop = interpreterMessages.scrollHeight;
            
            // Show landlord receives message
            const landlordMsg = createMessageElement(
                `🇹🇭 ${result.thaiToLandlord}\n\n🇬🇧 (${result.englishToLandlord})`
            );
            landlordMessages.appendChild(landlordMsg);
            landlordMessages.scrollTop = landlordMessages.scrollHeight;
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        loadingDiv.remove();
        alert(`Network error: ${error.message}`);
    }
}

/**
 * Send landlord message
 */
async function sendLandlordMessage() {
    const message = landlordInput.value.trim();
    if (!message) return;
    
    // Show landlord's original message
    const landlordMsg = createMessageElement(message);
    landlordMessages.appendChild(landlordMsg);
    landlordMessages.scrollTop = landlordMessages.scrollHeight;
    
    // Show loading in interpreter
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message';
    loadingDiv.innerHTML = '<div class="loading"></div> Processing...';
    interpreterMessages.appendChild(loadingDiv);
    interpreterMessages.scrollTop = interpreterMessages.scrollHeight;
    
    // Clear input
    landlordInput.value = '';
    
    try {
        // Call API
        const response = await fetch(`${API_BASE_URL}/interpret`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                sender: 'landlord',
                context: getContext()
            })
        });
        
        const result = await response.json();
        
        // Remove loading
        loadingDiv.remove();
        
        if (result.success) {
            // Add to history
            addToHistory('landlord', message, result);
            
            // Show interpreter analysis
            const badges = [];
            const additionalContent = [];
            
            if (result.priceAnalysis) {
                badges.push({ 
                    emoji: result.priceAnalysis.emoji, 
                    text: result.priceAnalysis.classification, 
                    class: 'badge-price' 
                });
                additionalContent.push(createPriceAnalysis(result.priceAnalysis));
            }
            
            if (result.aiAdvice) {
                additionalContent.push(createAIAdvice(result.aiAdvice));
            }
            
            if (result.suggestedResponse) {
                additionalContent.push(createSuggestedResponse(result.suggestedResponse));
            }
            
            const interpreterMsg = createMessageElement(
                `🇬🇧 Translation: "${result.translationToGuest}"`,
                badges,
                additionalContent
            );
            
            interpreterMessages.appendChild(interpreterMsg);
            interpreterMessages.scrollTop = interpreterMessages.scrollHeight;
            
            // Show guest receives message
            const guestMsg = createMessageElement(result.translationToGuest);
            guestMessages.appendChild(guestMsg);
            guestMessages.scrollTop = guestMessages.scrollHeight;
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        loadingDiv.remove();
        alert(`Network error: ${error.message}`);
    }
}

/**
 * Handle demo button clicks
 */
function handleDemoClick(event) {
    const button = event.target.closest('.demo-btn');
    if (!button) return;
    
    const sender = button.dataset.sender;
    const message = button.dataset.message;
    
    if (sender === 'guest') {
        guestInput.value = message;
        sendGuestMessage();
    } else if (sender === 'landlord') {
        landlordInput.value = message;
        sendLandlordMessage();
    }
}

// Event Listeners
guestSend.addEventListener('click', sendGuestMessage);
guestInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendGuestMessage();
    }
});

landlordSend.addEventListener('click', sendLandlordMessage);
landlordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendLandlordMessage();
    }
});

document.querySelector('.demo-buttons').addEventListener('click', handleDemoClick);

// Initialize
console.log('🌐 AI 3-Way Professional Interpreter initialized');
console.log('Ready to facilitate diplomatic communication!');
