# Testing Guide for AI 3-Way Professional Interpreter

## Quick Test Scenarios

### Test 1: Offensive Language Filter
**Goal:** Verify diplomatic filtering works

**Steps:**
1. Configure: City="Chiang Mai", Type="1BR"
2. Guest types: "fuck you, fix the AC now!"
3. Expected results:
   - Guest column: Shows original message
   - Interpreter: Shows 🛡️ Filtered badge + 😠 frustrated emotion
   - Landlord receives: Professional 3rd person message in Thai + English
   - No curse words reach landlord

**Success Criteria:**
- ✅ Yellow "Filtered" badge appears
- ✅ Emotion badge shows "frustrated" or "angry"
- ✅ Thai message is polite and professional
- ✅ Core complaint (AC issue) is preserved

---

### Test 2: Price Analysis - Good Deal
**Goal:** Test price intelligence with below-average price

**Steps:**
1. Configure: City="Chiang Mai", Type="1BR"
2. Landlord types: "ค่าเช่า 6000 บาทต่อเดือนครับ"
3. Expected results:
   - Translation: "The rent is 6,000 baht per month"
   - Price badge: 👍 or ✨ (Good/Very Good Deal)
   - Market comparison shows 6k vs 8k-15k range
   - Advice suggests checking property condition
   - Suggested response asks about viewing

**Success Criteria:**
- ✅ Price correctly extracted: 6000
- ✅ Classification: "Good price" or "Very good deal"
- ✅ Green/yellow color indicator
- ✅ Market range displayed correctly
- ✅ Smart advice about inspection

---

### Test 3: Price Analysis - High Price
**Goal:** Test price intelligence with above-average price

**Steps:**
1. Configure: City="Bangkok", Type="1BR"
2. Landlord types: "25,000 baht per month"
3. Expected results:
   - Price badge: 📈 or 🚨 (Quite high/Very expensive)
   - Deviation shows +35% or more above average
   - Advice suggests negotiation tactics
   - Suggested response includes counteroffer near market average

**Success Criteria:**
- ✅ Price correctly extracted: 25000
- ✅ Classification: "Quite high" or "Very expensive"
- ✅ Red/orange color indicator
- ✅ Negotiation tips provided
- ✅ Suggested counteroffer around 18,500฿

---

### Test 4: Cultural Advice
**Goal:** Test smart cultural advisor

**Steps:**
1. Landlord types: "ช่างจะมาพรุ่งนี้เช้าครับ" (Technician tomorrow morning)
2. Expected results:
   - Translation appears
   - AI Advice section with ⏰ Cultural Note
   - Explanation about "tomorrow" in Thai context
   - Suggested response asks for specific time

**Success Criteria:**
- ✅ Cultural note appears
- ✅ Explains Thai time customs
- ✅ Suggests polite follow-up
- ✅ Response template provided

---

### Test 5: Multi-Turn Conversation
**Goal:** Test context awareness across turns

**Steps:**
1. Guest: "How much for 3 months if I pay upfront?"
2. Landlord: "8000 baht per month"
3. Guest: "That sounds reasonable"
4. Expected results:
   - Step 1: Professional 3rd person question in Thai
   - Step 2: Price analysis + market comparison + advice
   - Step 3: Polite acknowledgment in Thai
   - Context maintained throughout

**Success Criteria:**
- ✅ Each turn processed correctly
- ✅ Context carries forward (3 months, upfront payment)
- ✅ Conversation history influences advice
- ✅ All messages appear in correct columns

---

## API Testing (Using cURL or Postman)

### Test API: Guest Message
```powershell
$body = @{
    message = "fuck you, this is terrible!"
    sender = "guest"
    context = @{
        city = "chiang mai"
        propertyType = "1br"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/interpret" -Method Post -Body $body -ContentType "application/json"
```

**Expected JSON Response:**
```json
{
  "success": true,
  "englishToLandlord": "The guest is experiencing dissatisfaction...",
  "thaiToLandlord": "แขก...",
  "guestEmotion": "angry",
  "interpretingNote": "Removed offensive language..."
}
```

---

### Test API: Landlord Message with Price
```powershell
$body = @{
    message = "ค่าเช่า 8000 บาทต่อเดือนครับ"
    sender = "landlord"
    context = @{
        city = "chiang mai"
        propertyType = "1br"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/interpret" -Method Post -Body $body -ContentType "application/json"
```

**Expected JSON Response:**
```json
{
  "success": true,
  "translationToGuest": "He said the rent is 8,000 baht per month.",
  "priceAnalysis": {
    "classification": "Fair price",
    "emoji": "⚖️",
    "detectedPrice": 8000,
    "marketRange": { "min": 8000, "max": 15000, "avg": 11500 }
  },
  "aiAdvice": "💡 Advice: Fair market price...",
  "suggestedResponse": "That's reasonable..."
}
```

---

### Test API: Price Analysis Only
```powershell
$body = @{
    price = 3000
    city = "chiang mai"
    propertyType = "1br"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/analyze-price" -Method Post -Body $body -ContentType "application/json"
```

**Expected JSON Response:**
```json
{
  "classification": "Excellent deal",
  "message": "🎉 This is EXCEPTIONALLY cheap!...",
  "deviation": -74,
  "marketRange": { "min": 8000, "max": 15000, "avg": 11500 },
  "emoji": "🎉",
  "color": "#00C853"
}
```

---

### Test API: Market Data Lookup
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/market-data/chiang%20mai"
```

**Expected JSON Response:**
```json
{
  "city": "chiang mai",
  "data": {
    "studio": { "min": 5000, "max": 10000, "avg": 7500 },
    "1br": { "min": 8000, "max": 15000, "avg": 11500 },
    "2br": { "min": 12000, "max": 25000, "avg": 18500 },
    "3br": { "min": 18000, "max": 35000, "avg": 26500 }
  }
}
```

---

## Edge Cases to Test

### 1. Multiple Prices in One Message
**Input:** "Studio is 5k, 1BR is 10k, 2BR is 15k"
**Expected:** AI extracts first mentioned price (5k) and analyzes it

### 2. Price Without City Context
**Input:** Landlord says "8000 baht" but no city configured
**Expected:** Message: "Market data not available for [undefined]. Please specify city."

### 3. Thai + English Mixed Message
**Input:** "ค่าเช่า 8000 baht per month ครับ"
**Expected:** Price extracted correctly, Thai portions translated

### 4. No Offensive Language
**Input:** "Hello, could you please fix the air conditioning?"
**Expected:** No filter badge, direct professional translation

### 5. Very Long Message
**Input:** 500+ word essay about property concerns
**Expected:** AI summarizes key points, preserves all legitimate concerns

### 6. Empty Message
**Input:** "" (empty string)
**Expected:** Frontend validation prevents sending, or API returns 400 error

---

## Performance Testing

### Response Time Targets
- **Guest → Landlord:** < 3 seconds
- **Landlord → Guest (no price):** < 3 seconds
- **Landlord → Guest (with price):** < 4 seconds
- **Price analysis only:** < 1 second

### Load Testing
```powershell
# Send 10 requests concurrently
1..10 | ForEach-Object -Parallel {
    $body = @{
        message = "Test message $_"
        sender = "guest"
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "http://localhost:3000/api/interpret" -Method Post -Body $body -ContentType "application/json"
}
```

---

## Checklist Before Production

- [ ] All 5 test scenarios pass
- [ ] API responses within target times
- [ ] All 6 cities have correct market data
- [ ] Offensive language filter catches common words
- [ ] Thai translation accuracy verified by native speaker
- [ ] Price extraction works with all formats (3000, 3,000, 3k, etc.)
- [ ] UI displays correctly on desktop
- [ ] UI displays correctly on mobile
- [ ] Error messages are user-friendly
- [ ] API key is in .env (not hardcoded)
- [ ] CORS configured for production domain
- [ ] Logs don't expose sensitive data

---

## Debugging Tips

### Issue: Price not detected
**Check:**
- Is city configured in context?
- Is price in reasonable range (1,000-200,000)?
- Try format: "8000 baht", "8,000฿", "8k"

### Issue: Thai translation incorrect
**Check:**
- Is AIML_API_KEY valid?
- Check API response in browser console
- Try simpler message first

### Issue: Frontend not loading
**Check:**
- Is server running? (npm start)
- Check browser console for errors
- Verify http://localhost:3000 is accessible

### Issue: API returns 500 error
**Check:**
- Check server console for error details
- Verify .env file exists with AIML_API_KEY
- Check API key has credits remaining

---

**Happy Testing! 🚀**
