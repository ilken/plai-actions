import axios, { AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
import {
    FormattedStanding,
    Match,
    PredictionResponse,
    StandingEntry
} from './types';

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['FOOTBALL_API_KEY', 'GOOGLE_API_KEY'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

const FOOTBALL_API_BASE = 'http://api.football-data.org/v4';
const PREMIER_LEAGUE_ID = 'PL';

async function getStandings(): Promise<StandingEntry[]> {
    try {
        const response: AxiosResponse = await axios.get(
            `${FOOTBALL_API_BASE}/competitions/${PREMIER_LEAGUE_ID}/standings`,
            {
                headers: {
                    'X-Auth-Token': process.env.FOOTBALL_API_KEY
                }
            }
        );
        return response.data.standings[0].table;
    } catch (error) {
        console.error('Error fetching standings:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
}

async function getFixtures(): Promise<Match[]> {
    try {
        // Get today's date and date 10 days from now
        const today = new Date();
        const tenDaysFromNow = new Date(today);
        tenDaysFromNow.setDate(today.getDate() + 10);

        // Format dates to YYYY-MM-DD as required by the API
        const dateFrom = today.toISOString().split('T')[0];
        const dateTo = tenDaysFromNow.toISOString().split('T')[0];

        console.log(`📅 Fetching fixtures from ${dateFrom} to ${dateTo}`);

        const response: AxiosResponse = await axios.get(
            `${FOOTBALL_API_BASE}/competitions/${PREMIER_LEAGUE_ID}/matches`,
            {
                headers: {
                    'X-Auth-Token': process.env.FOOTBALL_API_KEY
                },
                params: {
                    dateFrom,
                    dateTo,
                    status: 'SCHEDULED'
                }
            }
        );

        if (!response.data.matches || response.data.matches.length === 0) {
            console.warn('⚠️ No fixtures found in the specified date range');
        }

        return response.data.matches || [];
    } catch (error) {
        console.error('Error fetching fixtures:', error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
}

function formatStandingsTable(standings: StandingEntry[]): FormattedStanding[] {
    return standings.map(team => ({
        position: team.position,
        team: team.team.name,
        MP: team.playedGames,
        W: team.won,
        D: team.draw,
        L: team.lost,
        F: team.goalsFor,
        A: team.goalsAgainst,
        GD: team.goalDifference,
        P: team.points,
        form: team.form
    }));
}

function formatFixtures(fixtures: Match[]): string {
    if(!fixtures?.length) return "";

    const matchday = fixtures[0].matchday;
    return fixtures.filter(match => match.matchday === matchday).map(match => 
        `${match.homeTeam.name} - ${match.awayTeam.name}`
    ).join('\n');
}

function generatePrompt(standings: FormattedStanding[], fixtures: string): string {
    return `Use this example football league table.
${JSON.stringify(standings, null, 2)}

Table headers are:
MP means Matches Played
W means number of wins
D means number of draws
L means number of losses
F means goals scored
A means goals conceded
D is the goals difference
P is the number of points

Assume that these are the fixtures:

${fixtures}

Act like a professional football match predictor and analyse these fixtures.
For each match provide
- A potential score
- 90 minute result Win/Draw/Lose
- Over or Under 2.5 goals
- Both teams to score Yes/No
- Probably of each of these predictions happening separately

Print in JSON format as shown in the example below:
{
  "predictions": [
    {
      "match": "Team A v Team B",
      "potentialScore": "2-1",
      "result": {
        "prediction": "Team A Win",
        "probability": 65,
        "analysis": "Analysis here"
      },
      "overUnder": {
        "prediction": "Over 2.5 Goals",
        "probability": 60,
        "analysis": "Analysis here"
      },
      "bothTeamsToScore": {
        "prediction": "Yes",
        "probability": 75,
        "analysis": "Analysis here"
      }
    }
  ]
}`;
}

async function getPredictions(prompt: string): Promise<PredictionResponse> {
    try {
        console.log('🔄 Preparing AI request...');
        
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 1,
                    topP: 1,
                    maxOutputTokens: 2048,
                }
            }
        );

        if (response.data.candidates && response.data.candidates[0].content) {
            const predictions = response.data.candidates[0].content.parts[0].text;
            return predictions as PredictionResponse;
        } else {
            throw new Error('Invalid response format from Gemini API');
        }
    } catch (error) {
        console.error('❌ Error generating AI prediction:', error instanceof Error ? error.message : 'Unknown error');
        if (axios.isAxiosError(error)) {
            console.error('API Response:', error.response?.data);
        }
        throw error;
    }
}

async function main(): Promise<void> {
    try {
        console.log('🚀 Starting PLAI predictions...');
        
        // Get current standings and fixtures
        console.log('📊 Fetching Premier League standings...');
        const standings = await getStandings();
        console.log('✅ Standings fetched successfully!');
        
        console.log('📅 Fetching upcoming fixtures...');
        const fixtures = await getFixtures();
        console.log('✅ Fixtures fetched successfully!');
        
        // Format data
        console.log('🔄 Formatting data...');
        const formattedStandings = formatStandingsTable(standings);
        const formattedFixtures = formatFixtures(fixtures);
        console.log('✅ Data formatted successfully!');
        
        // Generate prompt
        console.log('📝 Generating AI prompt...');
        const prompt = generatePrompt(formattedStandings, formattedFixtures);
        console.log('✅ Prompt generated successfully!');
        
        // Get predictions from Gemini
        console.log('🤖 Getting predictions from AI...');
        const predictions = await getPredictions(prompt);
        console.log('✅ AI predictions received!');
        
        // Write predictions to a JSON file
        const fs = require('fs');
        const outputPath = './output/data.json';

        // Ensure output directory exists
        if (!fs.existsSync('./output')) {
            fs.mkdirSync('./output');
        }

        // Clear existing data by writing an empty array
        fs.writeFileSync(outputPath, "");

        // Write the new predictions to file with proper formatting
        fs.writeFileSync(outputPath, predictions);
        console.log(`✅ Predictions have been saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('❌ Error in main process:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}

main(); 