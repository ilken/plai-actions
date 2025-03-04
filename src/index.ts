import axios, { AxiosResponse } from 'axios';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import {
  StandingEntry,
  Match,
  FormattedStanding,
  PredictionResponse
} from './types';

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
        const response: AxiosResponse = await axios.get(
            `${FOOTBALL_API_BASE}/competitions/${PREMIER_LEAGUE_ID}/matches`,
            {
                headers: {
                    'X-Auth-Token': process.env.FOOTBALL_API_KEY
                },
                params: {
                    status: 'SCHEDULED',
                    limit: 10
                }
            }
        );
        return response.data.matches;
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
    return fixtures.map(match => 
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
    const genAI: GoogleGenerativeAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model: GenerativeModel = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const result = await model.generateContent(prompt);
    const predictions = result.response.text();
    return JSON.parse(predictions) as PredictionResponse;
}

async function main(): Promise<void> {
    try {
        // Get current standings and fixtures
        const standings = await getStandings();
        const fixtures = await getFixtures();
        
        // Format data
        const formattedStandings = formatStandingsTable(standings);
        const formattedFixtures = formatFixtures(fixtures);
        
        // Generate prompt
        const prompt = generatePrompt(formattedStandings, formattedFixtures);
        
        // Get predictions from Gemini
        const predictions = await getPredictions(prompt);
        
        // Log the results
        console.log('Predictions:', JSON.stringify(predictions, null, 2));
        
    } catch (error) {
        console.error('Error in main process:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}

main(); 