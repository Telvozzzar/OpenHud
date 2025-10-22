/**
 * Faceit API Service
 * Handles fetching match data from Faceit API
 */

export interface FaceitPlayer {
  player_id: string;
  nickname: string;
  avatar: string;
  country: string;
  game_player_id: string; // Steam ID
}

export interface FaceitTeam {
  team_id: string;
  name: string;
  avatar: string;
  roster: FaceitPlayer[];
}

export interface FaceitMatch {
  match_id: string;
  game: string;
  region: string;
  competition_id: string;
  competition_name: string;
  teams: {
    faction1: FaceitTeam;
    faction2: FaceitTeam;
  };
  voting?: {
    map?: {
      pick?: string[];
      entities?: Array<{
        class_name: string;
        game_map_id: string;
        guid: string;
        image_lg: string;
        image_sm: string;
        name: string;
      }>;
    };
  };
}

const FACEIT_API_BASE = "https://open.faceit.com/data/v4";

/**
 * Extract match ID from Faceit URL or return the ID directly
 */
export function extractMatchId(input: string): string | null {
  // If it's already a match ID (UUID format), return it
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(input)) {
    return input;
  }

  // Try to extract from URL patterns
  // Pattern 1: https://www.faceit.com/en/cs2/room/{match-id}
  const roomPattern = /faceit\.com\/[^/]+\/[^/]+\/room\/([0-9a-f-]+)/i;
  const roomMatch = input.match(roomPattern);
  if (roomMatch) {
    return roomMatch[1];
  }

  // Pattern 2: https://www.faceit.com/en/cs2/match/{match-id}
  const matchPattern = /faceit\.com\/[^/]+\/[^/]+\/match\/([0-9a-f-]+)/i;
  const matchMatch = input.match(matchPattern);
  if (matchMatch) {
    return matchMatch[1];
  }

  return null;
}

/**
 * Fetch match data from Faceit API
 */
export async function fetchFaceitMatch(
  matchIdOrUrl: string,
  apiKey?: string
): Promise<FaceitMatch> {
  const matchId = extractMatchId(matchIdOrUrl);
  
  if (!matchId) {
    throw new Error("Invalid Faceit match ID or URL");
  }

  // Additional validation: Ensure matchId is a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(matchId)) {
    throw new Error("Invalid match ID format");
  }

  const headers: Record<string, string> = {
    "Accept": "application/json",
  };

  // Add API key if provided (optional for public endpoints)
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  // Construct URL with validated matchId - matchId is validated to be UUID format only
  const url = `${FACEIT_API_BASE}/matches/${matchId}`;
  const response = await fetch(url, {
    headers,
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Match not found on Faceit");
    } else if (response.status === 401) {
      throw new Error("Invalid Faceit API key");
    } else {
      throw new Error(`Faceit API error: ${response.status} ${response.statusText}`);
    }
  }

  const data = await response.json();
  return data as FaceitMatch;
}

/**
 * Convert Faceit match data to OpenHud format
 */
export function convertFaceitMatchToOpenHud(faceitMatch: FaceitMatch): {
  teams: Array<{
    name: string;
    country: string;
    shortName: string;
    logo: string;
  }>;
  players: Array<{
    firstName: string;
    lastName: string;
    username: string;
    avatar: string;
    country: string;
    steamid: string;
    teamName: string;
  }>;
  matchType: "bo1" | "bo3" | "bo5";
  maps: string[];
} {
  const faction1 = faceitMatch.teams.faction1;
  const faction2 = faceitMatch.teams.faction2;

  // Convert teams
  const teams = [
    {
      name: faction1.name,
      country: faction1.roster[0]?.country || "",
      shortName: faction1.name.substring(0, 3).toUpperCase(),
      logo: faction1.avatar || "",
    },
    {
      name: faction2.name,
      country: faction2.roster[0]?.country || "",
      shortName: faction2.name.substring(0, 3).toUpperCase(),
      logo: faction2.avatar || "",
    },
  ];

  // Convert players
  const players: Array<{
    firstName: string;
    lastName: string;
    username: string;
    avatar: string;
    country: string;
    steamid: string;
    teamName: string;
  }> = [];

  // Add faction1 players
  faction1.roster.forEach((player) => {
    players.push({
      firstName: "",
      lastName: "",
      username: player.nickname,
      avatar: player.avatar || "",
      country: player.country || "",
      steamid: player.game_player_id || "",
      teamName: faction1.name,
    });
  });

  // Add faction2 players
  faction2.roster.forEach((player) => {
    players.push({
      firstName: "",
      lastName: "",
      username: player.nickname,
      avatar: player.avatar || "",
      country: player.country || "",
      steamid: player.game_player_id || "",
      teamName: faction2.name,
    });
  });

  // Extract maps from voting if available
  const maps: string[] = [];
  if (faceitMatch.voting?.map?.entities) {
    faceitMatch.voting.map.entities.forEach((entity) => {
      if (entity.game_map_id) {
        maps.push(entity.game_map_id);
      }
    });
  }

  // Determine match type (default to bo3 if not clear)
  const matchType: "bo1" | "bo3" | "bo5" = "bo3";

  return {
    teams,
    players,
    matchType,
    maps,
  };
}
