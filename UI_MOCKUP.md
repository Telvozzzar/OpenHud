# UI Mockup - External Match Import Feature

## Match Creation Dialog - With External Import Option

```
┌──────────────────────────────────────────────────────────────────────┐
│  Create Match                                                      × │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Import Match from External URL                                │ │
│  │                                                                │ │
│  │  Enter a match URL (e.g., from dachcs.de) to automatically    │ │
│  │  fetch team and player data                                   │ │
│  │                                                                │ │
│  │  ┌──────────────────────────────────────────────┬───────────┐ │ │
│  │  │ https://dachcs.de/coverage/match/7792       │  [Import] │ │ │
│  │  └──────────────────────────────────────────────┴───────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ────────────────────── Or create manually ──────────────────────   │
│                                                                      │
│                       ┌────────────┐                                │
│                       │  Team One  │  VS  │ Team Two  │             │
│                       └────────────┘      └───────────┘             │
│                                                                      │
│                  Left Wins: [ 0 ]    Right Wins: [ 0 ]             │
│                                                                      │
│                            Best of                                   │
│                          ┌────────┐                                  │
│                          │  bo1   │                                  │
│                          └────────┘                                  │
│                                                                      │
│  Set Vetos:                                                         │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ Veto │ Type │  Team  │   Map   │  Side  │ Reverse Side        ││
│  ├────────────────────────────────────────────────────────────────┤│
│  │  1   │ pick │   []   │   []    │   []   │      []             ││
│  │  2   │ ban  │   []   │   []    │   []   │      []             ││
│  │  3   │ pick │   []   │   []    │   []   │      []             ││
│  │ ...  │ ...  │  ...   │  ...    │  ...   │     ...             ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                          [Submit] [Reset] [Cancel]  │
└──────────────────────────────────────────────────────────────────────┘
```

## When Fetching External Data

```
┌──────────────────────────────────────────────────────────────────────┐
│  Create Match                                                      × │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Import Match from External URL                                │ │
│  │                                                                │ │
│  │  Enter a match URL (e.g., from dachcs.de) to automatically    │ │
│  │  fetch team and player data                                   │ │
│  │                                                                │ │
│  │  ┌──────────────────────────────────────────────┬───────────┐ │ │
│  │  │ https://dachcs.de/coverage/match/7792       │[Fetching..]│ │
│  │  └──────────────────────────────────────────────┴───────────┘ │ │
│  │                                                                │ │
│  │                     ⏳ Fetching match data...                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## After Successful Import

```
┌──────────────────────────────────────────────────────────────────────┐
│                            Matches                                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                          [+ Match]    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Team A          vs          Team B          │ BO3  │ Waiting   │ │
│  │ [Logo A]                    [Logo B]        │      │ [Edit]    │ │
│  │                                             │      │ [Delete]  │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ • 5 players imported for Team A                               │ │
│  │ • 5 players imported for Team B                               │ │
│  │ • Match format: Best of 3                                     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Error Handling Example

```
┌──────────────────────────────────────────────────────────────────────┐
│  Create Match                                                      × │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Import Match from External URL                                │ │
│  │                                                                │ │
│  │  ❌ Error: Invalid dachcs.de match URL - must be in format    │ │
│  │     /coverage/match/{id}                                       │ │
│  │                                                                │ │
│  │  ┌──────────────────────────────────────────────┬───────────┐ │ │
│  │  │ https://invalid-url.com/match/123           │  [Import] │ │ │
│  │  └──────────────────────────────────────────────┴───────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Flow Visualization

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────┘

1. User enters URL:
   https://dachcs.de/coverage/match/7792
                    │
                    ▼
2. Frontend validates format and sends request
                    │
                    ▼
3. Backend validates URL security
   • Domain whitelist check ✓
   • Path pattern check ✓
   • Match ID validation ✓
                    │
                    ▼
4. Fetch HTML from external source
   • With timeout (10s)
   • With size limit (5MB)
                    │
                    ▼
5. Parse HTML with Cheerio
   • Extract team names ✓
   • Extract team logos ✓
   • Extract player data ✓
   • Extract match format ✓
                    │
                    ▼
6. Create database records
   • Create Team A with logo
   • Create Team B with logo
   • Create 5 players for Team A
   • Create 5 players for Team B
   • Create Match (Team A vs Team B, BO3)
                    │
                    ▼
7. Return success, refresh UI
   ✅ Match created successfully!
   ✅ 2 teams created
   ✅ 10 players created
```

## Supported URL Format

```
✅ VALID:
   https://dachcs.de/coverage/match/7792
   https://www.dachcs.de/coverage/match/1234
   http://dachcs.de/coverage/match/999999

❌ INVALID:
   https://other-site.com/match/7792        (Domain not whitelisted)
   https://dachcs.de/other/path/7792        (Invalid path)
   https://dachcs.de/coverage/match/abc     (Non-numeric ID)
   https://dachcs.de/coverage/match/9999999 (ID out of range)
```

## Feature Highlights

✨ **Automatic Data Import**
   - No manual team creation needed
   - No manual player creation needed
   - Logos and avatars automatically fetched

🔒 **Secure by Design**
   - Domain whitelisting
   - Input validation
   - Request limits

⚡ **Fast and Easy**
   - One URL, one click
   - Complete match setup in seconds
   - Ready to use immediately

🎯 **Smart Parsing**
   - Detects match format (BO1, BO3, etc.)
   - Extracts Steam IDs when available
   - Handles missing data gracefully
