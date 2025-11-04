// test-gemini.js
const fs = require('fs');
const path = require('path');

// Manual load .env.local
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    
    const envVars = {};
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        envVars[key] = value.replace(/['"]/g, '').trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.log('❌ Cannot read .env.local');
    return {};
  }
}

const envVars = loadEnv();
const API_KEY = envVars.GEMINI_API_KEY;

async function testGemini() {
  console.log('🔍 Testing Gemini API...');
  console.log('API Key from .env.local:', API_KEY ? '✅ Found' : '❌ Not found');
  
  if (!API_KEY) {
    console.log('❌ GEMINI_API_KEY not found in .env.local');
    console.log('   Make sure .env.local exists and contains: GEMINI_API_KEY=your_key_here');
    return;
  }

  try {
    // Test 1: Cek models available
    console.log('\n1. Testing Models API...');
    const modelsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`
    );
    
    console.log('   Status:', modelsResponse.status);
    
    if (!modelsResponse.ok) {
      const errorText = await modelsResponse.text();
      console.log('   ❌ Failed:', errorText);
      return;
    }
    
    const modelsData = await modelsResponse.json();
    console.log('   ✅ Success! Available models:');
    modelsData.models.slice(0, 3).forEach(model => {
      console.log(`      - ${model.name} (${model.displayName})`);
    });

    // Test 2: Coba generate content
    console.log('\n2. Testing Generate Content...');
    const generateResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Jawab singkat dalam 1 kalimat: halo, apa kabar?"
            }]
          }],
          generationConfig: {
            maxOutputTokens: 50,
            temperature: 0.7,
          }
        }),
      }
    );
    
    console.log('   Status:', generateResponse.status);
    
    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.log('   ❌ Failed:', errorText);
      return;
    }
    
    const generateData = await generateResponse.json();
    const responseText = generateData.candidates[0].content.parts[0].text;
    console.log('   ✅ Success! Response:', responseText);
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testGemini();