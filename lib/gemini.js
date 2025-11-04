// lib/gemini.js - OPTIMIZED VERSION
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Smart rate limiting
let requestCount = 0;
const MAX_REQUESTS_PER_HOUR = 15; // Free tier estimate
let lastResetTime = Date.now();
const HOUR_MS = 3600000;

// Cache untuk pertanyaan yang sering ditanya
const responseCache = new Map();
const CACHE_DURATION = 300000; // 5 menit

function canMakeRequest() {
  const now = Date.now();
  
  // Reset counter setiap jam
  if (now - lastResetTime > HOUR_MS) {
    requestCount = 0;
    lastResetTime = now;
    console.log('🔄 Rate limit counter reset');
  }
  
  return requestCount < MAX_REQUESTS_PER_HOUR;
}

export async function generateAIResponse(userMessage, context = {}) {
  if (!genAI) {
    console.log('❌ Gemini AI not configured');
    return null;
  }

  // Check cache dulu
  const cacheKey = userMessage.toLowerCase().trim();
  const cached = responseCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    console.log('✅ Using cached AI response');
    return cached.response;
  }

  // Check rate limit
  if (!canMakeRequest()) {
    console.log('🚫 Rate limit reached for this hour');
    return null;
  }

  requestCount++;
  console.log(`🔄 Gemini Request #${requestCount}/${MAX_REQUESTS_PER_HOUR}: "${userMessage}"`);

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        maxOutputTokens: 150, // Lebih hemat
        temperature: 0.7,
      }
    });
    
    // Prompt yang lebih hemat token
    const prompt = `Asisten Perpustakaan Nasional. Jawab singkat 1-2 kalimat: ${userMessage}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini Response successful');
    
    // Cache the response
    responseCache.set(cacheKey, {
      response: text,
      timestamp: Date.now()
    });
    
    return text;
    
  } catch (error) {
    console.error('❌ Gemini Error:', error.message);
    
    if (error.message.includes('429')) {
      console.log('💡 Tips: Gemini free tier has hourly limits');
      console.log('💡 Using enhanced rule-based as fallback');
    }
    
    return null;
  }
}