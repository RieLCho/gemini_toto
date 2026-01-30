import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generatePredictions() {
  try {
    // 1. Read matches from the scraped file
    const dataPath = path.join(__dirname, "../src/data/predictions.json");
    const existingData = JSON.parse(await fs.readFile(dataPath, "utf-8"));
    const matches = existingData.matches;

    console.log(`Found ${matches.length} matches in ${dataPath}`);

    // Filter for matches that need prediction (optional, but good for cost saving)
    // For now, we will regenerate all to ensure freshest analysis.

    // 2. Prepare Prompt
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
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

    // 3. Call API
    console.log("Asking Gemini to analyze matches...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
    // 4. Validate and Save
    const predictions = JSON.parse(text);
    
    // Update the existing data object with new predictions but keep other metadata if any
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
