# External Match Import Feature

## Overview

This feature allows users to automatically import match data from external sources (currently supporting dachcs.de) directly into OpenHud. The system fetches team information, player details, and match configuration, creating all necessary entities automatically.

## How It Works

### User Flow

1. **Navigate to Matches Page**
   - User clicks on "Matches" in the admin panel sidebar

2. **Open Match Creation Dialog**
   - Click the "Create Match" button in the top bar

3. **Import from External URL**
   - In the dialog, there's a new section at the top: "Import Match from External URL"
   - User enters a match URL (e.g., `https://dachcs.de/coverage/match/7792`)
   - Clicks the "Import" button

4. **Automatic Data Fetch**
   - The system validates the URL
   - Fetches the HTML from the external source
   - Parses team names, logos, player names, avatars, and Steam IDs
   - Creates teams in the database
   - Creates players linked to their respective teams
   - Creates a match with the correct format (BO1, BO3, etc.)

5. **Result**
   - Match is created and appears in the matches table
   - Teams and players are also available in their respective pages

### Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer (React)                      │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           MatchForm.tsx                                │  │
│  │  - URL input field                                     │  │
│  │  - Import button                                       │  │
│  │  - Calls matchApi.createFromExternal()                │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer (Express)                       │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │    POST /api/match/create-from-external               │  │
│  │    - matches.controller.ts                            │  │
│  │    - Validates request                                │  │
│  │    - Calls external-fetcher service                   │  │
│  │    - Calls match service                              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │    external-fetcher.service.ts                        │  │
│  │    - URL validation (domain whitelist)               │  │
│  │    - Match ID validation                             │  │
│  │    - Fetches HTML using axios                        │  │
│  │    - Parses with Cheerio                             │  │
│  │    - Returns structured data                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │    matches.service.ts                                 │  │
│  │    - createMatchFromExternalData()                   │  │
│  │    - Creates teams via team service                   │  │
│  │    - Creates players via player service              │  │
│  │    - Creates match with all relationships            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (SQLite)                       │
│                                                               │
│  - Teams table                                               │
│  - Players table                                             │
│  - Matches table                                             │
└─────────────────────────────────────────────────────────────┘
```

## Security Features

### URL Validation
- Only allows URLs from whitelisted domains (currently: dachcs.de)
- Validates URL format using Node's URL parser
- Checks path structure matches expected pattern

### Match ID Validation
- Extracts match ID using regex
- Ensures match ID is numeric
- Validates ID is within reasonable bounds (1-999999)
- Reconstructs URL from validated parts to prevent SSRF attacks

### Request Protection
- 10-second timeout on HTTP requests
- 5MB content length limit
- Custom User-Agent header

## Supported Data Sources

### dachcs.de
- **URL Pattern**: `https://dachcs.de/coverage/match/{match_id}`
- **Extracted Data**:
  - Team names
  - Team logos (if available)
  - Player usernames
  - Player avatars (if available)
  - Player Steam IDs (if available)
  - Match type (BO1, BO2, BO3, BO5)

## Future Enhancements

Potential additions to the feature:

1. **Additional Sources**
   - HLTV.org support
   - Liquipedia support
   - Custom CSV/JSON import

2. **Enhanced Parsing**
   - Player roles/positions
   - Team rankings
   - Match date/time
   - Tournament information

3. **UI Improvements**
   - Preview parsed data before importing
   - Edit parsed data before saving
   - Import history/log

4. **Validation**
   - Check for duplicate teams/players
   - Merge with existing data option
   - Conflict resolution UI

## Code Files

### Backend
- `src/electron/api/v2/matches/external-fetcher.service.ts` - HTML fetching and parsing
- `src/electron/api/v2/matches/matches.service.ts` - Match creation from external data
- `src/electron/api/v2/matches/matches.controller.ts` - API endpoint handlers
- `src/electron/api/v2/matches/matches.routes.ts` - Route definitions

### Frontend
- `src/UI/pages/Matches/MatchForm.tsx` - Import UI
- `src/UI/pages/Matches/matchApi.ts` - API client methods

## Dependencies

- **axios**: HTTP client for fetching external pages (v1.12.0 for security)
- **cheerio**: HTML parsing library (v1.0.0)
