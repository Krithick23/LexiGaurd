import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: 'g:/My Drive/LexiGuard/server/.env' });

const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
const mongoUri = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : '';

console.log('API Key length:', apiKey.length);
console.log('MongoDB URI starts with:', mongoUri.substring(0, 15) + '...');

async function runDiagnostics() {
  console.log('\n--- 1. TESTING GEMINI API ---');
  if (!apiKey) {
    console.log('Result: GEMINI_API_KEY is empty');
  } else {
    const candidateModels = [
      'gemini-flash-latest',
      'gemini-pro-latest',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-pro'
    ];

    let geminiSuccess = false;
    for (const modelName of candidateModels) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        const res = await model.generateContent('Say OK');
        const text = await res.response.text();
        console.log(`SUCCESS with model [${modelName}]:`, text.trim());
        geminiSuccess = true;
        break;
      } catch (err) {
        console.log(`Failed with model [${modelName}]:`, err.message.substring(0, 120));
      }
    }
    if (!geminiSuccess) {
      console.log('Gemini check: None of the tested models succeeded.');
    }
  }

  console.log('\n--- 2. TESTING MONGODB CONNECTION ---');
  if (!mongoUri) {
    console.log('Result: MONGODB_URI is empty');
  } else {
    // Try standard DNS first
    try {
      console.log('Connecting with default DNS...');
      const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log('SUCCESS: Connected to MongoDB host:', conn.connection.host);
      await mongoose.disconnect();
    } catch (err1) {
      console.log('Default DNS failed:', err1.message);

      // Try Google Public DNS 8.8.8.8
      try {
        console.log('Retrying with Google DNS 8.8.8.8...');
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        const conn2 = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log('SUCCESS with 8.8.8.8 DNS: Connected to MongoDB host:', conn2.connection.host);
        await mongoose.disconnect();
      } catch (err2) {
        console.log('Google DNS retry failed:', err2.message);
      }
    }
  }
}

runDiagnostics().then(() => process.exit(0));
