import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini with new SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generatePredictions() {
  try {
    // 1. Read matches from the scraped file
    const dataPath = path.join(__dirname, "../src/data/predictions.json");
    // Ensure file exists before trying to read
    try {
      await fs.access(dataPath);
    } catch {
      console.log("No data file found at", dataPath);
      return;
    }

    const existingData = JSON.parse(await fs.readFile(dataPath, "utf-8"));
    const matches = existingData.matches || [];

    if (matches.length === 0) {
        console.log("No matches found to analyze.");
        return;
    }

    console.log(`Found ${matches.length} matches in ${dataPath}`);

    // 2. Prepare Prompt
    const prompt = `
      Act as a professional sports analyst. I will provide a list of upcoming matches.
      For each match, predict the winner (or Draw), a likely score, and a one-sentence reasoning.
      
      Matches to Analyze:
      ${JSON.stringify(matches, null, 2)}
      
      Output ONLY a valid JSON object with the following structure, keeping the same IDs:
      {
        "matches": [
          {
            "id": "original_match_id",
            "league": "original_league",
            "homeTeam": "Home Team",
            "awayTeam": "Away Team",
            "time": "Time",
            "prediction": {
              "pick": "Home Team" or "Away Team" or "Draw",
              "score": "2-1",
              "reason": "Reasoning here."
            }
          }
        ]
      }
      Do not include markdown formatting like \`\`\`json. Just the raw JSON string.
    `;

    // 3. Call API with new SDK
    console.log("Asking Gemini (gemini-1.5-flash) to analyze matches...");
    
    // Simple retry logic for 429 errors
    const maxRetries = 3;
    let response;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: prompt,
            });
            break; // Success
        } catch (err) {
            if (i === maxRetries - 1) throw err; // Throw on last attempt
            
            // Check if it's a 429 or similar transient error
            if (err.status === 429 || err.code === 429 || (err.message && err.message.includes('429'))) {
                console.log(`Rate limited (429). Retrying in ${(i + 1) * 2} seconds...`);
                await new Promise(resolve => setTimeout(resolve, (i + 1) * 2000));
            } else {
                throw err; // Throw other errors immediately
            }
        }
    }

    // The new SDK response object has a .text property (getter) that extracts the text
    const text = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // 4. Validate and Save
    const predictions = JSON.parse(text);
    
    // Update the existing data object
    existingData.matches = predictions.matches;
    existingData.lastUpdated = new Date().toISOString().split('T')[0];

    await fs.writeFile(dataPath, JSON.stringify(existingData, null, 2));
    
    console.log("Success! Predictions updated in src/data/predictions.json");

  } catch (error) {
    console.error("Error generating predictions:", error);
    process.exit(1);
  }
}

generatePredictions();
