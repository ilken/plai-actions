# PLAI Actions 🎯

Premier League AI Predictions using GitHub Actions. Automatically fetches Premier League data and generates match predictions using Google's Gemini AI.

## Setup 🚀

1. **Install dependencies**
   ```bash
   yarn install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Add your API keys to `.env`:
   ```env
   FOOTBALL_API_KEY=your_football_data_api_key
   GOOGLE_API_KEY=your_google_gemini_api_key
   ```

## Usage 💻

**Development mode:**
```bash
yarn dev
```

**Production mode:**
```bash
yarn build
yarn start
```

## Features ⚡

- Fetches current Premier League standings
- Gets upcoming fixtures for next 10 days
- Generates AI predictions for each match:
  - Score prediction
  - Match result (Win/Draw/Loss)
  - Over/Under 2.5 goals
  - Both teams to score
  - Probability analysis

## GitHub Actions ⚙️

The workflow automatically runs:
- Every Monday at midnight
- Can be triggered manually from Actions tab

Required repository secrets:
- `FOOTBALL_API_KEY` - Get from [football-data.org](https://www.football-data.org/)
- `GOOGLE_API_KEY` - Get from [makersuite.google.com](https://makersuite.google.com/app/apikey)
