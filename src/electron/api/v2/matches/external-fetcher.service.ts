import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Interface for external match data
 */
export interface ExternalMatchData {
  team1: {
    name: string;
    logo?: string;
    players: {
      username: string;
      firstName?: string;
      lastName?: string;
      avatar?: string;
      steamid?: string;
    }[];
  };
  team2: {
    name: string;
    logo?: string;
    players: {
      username: string;
      firstName?: string;
      lastName?: string;
      avatar?: string;
      steamid?: string;
    }[];
  };
  matchType?: "bo1" | "bo2" | "bo3" | "bo5";
}

/**
 * Fetches and parses match data from dachcs.de
 * @param url - The URL of the match page
 * @returns Parsed match data
 */
export const fetchDachCSMatchData = async (
  url: string
): Promise<ExternalMatchData> => {
  try {
    // Validate URL - only allow specific domains
    const allowedDomains = ["dachcs.de"];
    let urlObj: URL;
    
    try {
      urlObj = new URL(url);
    } catch {
      throw new Error("Invalid URL format");
    }

    // Check if domain is allowed
    if (!allowedDomains.some(domain => urlObj.hostname === domain || urlObj.hostname === `www.${domain}`)) {
      throw new Error("URL must be from dachcs.de");
    }

    // Validate URL path structure
    if (!urlObj.pathname.startsWith("/coverage/match/")) {
      throw new Error("Invalid dachcs.de match URL - must be in format /coverage/match/{id}");
    }

    // Extract match ID and validate it's numeric
    const matchIdMatch = urlObj.pathname.match(/\/coverage\/match\/(\d+)$/);
    if (!matchIdMatch) {
      throw new Error("Invalid match ID in URL");
    }

    const matchId = matchIdMatch[1];
    
    // Additional validation: ensure match ID is within reasonable bounds (1-999999)
    const matchIdNum = parseInt(matchId, 10);
    if (matchIdNum < 1 || matchIdNum > 999999) {
      throw new Error("Match ID out of valid range");
    }

    // Reconstruct the URL from validated parts to prevent SSRF
    const safeUrl = `https://dachcs.de/coverage/match/${matchIdNum}`;

    // Fetch the page using the validated URL
    const response = await axios.get(safeUrl, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      maxContentLength: 5 * 1024 * 1024, // 5MB limit
      maxBodyLength: 5 * 1024 * 1024,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Initialize result object
    const matchData: ExternalMatchData = {
      team1: { name: "", players: [] },
      team2: { name: "", players: [] },
    };

    // Parse team names
    const teamNames = $(".team-name, .team-title, h2.team, .teamname")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((name) => name.length > 0);

    if (teamNames.length >= 2) {
      matchData.team1.name = teamNames[0];
      matchData.team2.name = teamNames[1];
    }

    // Try alternative selectors for team names if not found
    if (!matchData.team1.name || !matchData.team2.name) {
      const altTeamNames = $("h1, h2, h3")
        .filter((_, el) => {
          const text = $(el).text().toLowerCase();
          return text.includes("vs") || text.includes("gegen");
        })
        .first()
        .text()
        .split(/vs|gegen/i)
        .map((t) => t.trim());

      if (altTeamNames.length >= 2) {
        matchData.team1.name = altTeamNames[0];
        matchData.team2.name = altTeamNames[1];
      }
    }

    // Parse team logos
    const teamLogos = $(
      ".team-logo img, .team-image img, img[alt*='logo'], img[alt*='Logo']"
    )
      .map((_, el) => $(el).attr("src"))
      .get()
      .filter((src) => src && src.length > 0);

    if (teamLogos.length >= 2) {
      matchData.team1.logo = teamLogos[0];
      matchData.team2.logo = teamLogos[1];
    }

    // Parse players
    // This is a generic approach - selectors may need to be adjusted based on actual HTML structure
    const playerCards = $(
      ".player-card, .player-item, .player, .lineup-player, .roster-player"
    );

    const allPlayers: Array<{
      username: string;
      firstName?: string;
      lastName?: string;
      avatar?: string;
      steamid?: string;
    }> = [];

    playerCards.each((_, card) => {
      const $card = $(card);
      const username =
        $card.find(".player-name, .username, .nick").text().trim() ||
        $card.find("h3, h4").first().text().trim();
      const avatar =
        $card.find("img").attr("src") || $card.find("img").attr("data-src");
      const steamid = $card.attr("data-steamid") || $card.attr("data-steam-id");

      if (username) {
        allPlayers.push({
          username,
          avatar: avatar || undefined,
          steamid: steamid || undefined,
        });
      }
    });

    // Alternative: Parse from table structure
    if (allPlayers.length === 0) {
      $("table tr, .roster-table tr").each((_, row) => {
        const $row = $(row);
        const cells = $row.find("td");
        if (cells.length > 0) {
          const username = cells.first().text().trim();
          const avatar = $row.find("img").attr("src");
          if (username && username.length > 0) {
            allPlayers.push({
              username,
              avatar: avatar || undefined,
            });
          }
        }
      });
    }

    // Distribute players between teams (assuming equal split or first half to team1)
    const halfPoint = Math.ceil(allPlayers.length / 2);
    matchData.team1.players = allPlayers.slice(0, halfPoint);
    matchData.team2.players = allPlayers.slice(halfPoint);

    // Try to determine match type (best of)
    const pageText = $("body").text().toLowerCase();
    if (pageText.includes("best of 5") || pageText.includes("bo5")) {
      matchData.matchType = "bo5";
    } else if (pageText.includes("best of 3") || pageText.includes("bo3")) {
      matchData.matchType = "bo3";
    } else if (pageText.includes("best of 2") || pageText.includes("bo2")) {
      matchData.matchType = "bo2";
    } else {
      matchData.matchType = "bo1"; // default
    }

    return matchData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch match data: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Generic external match data fetcher that can handle different sources
 * @param url - The URL of the match page
 * @returns Parsed match data
 */
export const fetchExternalMatchData = async (
  url: string
): Promise<ExternalMatchData> => {
  // Route to appropriate fetcher based on URL
  if (url.includes("dachcs.de")) {
    return fetchDachCSMatchData(url);
  }

  // Can add more sources here in the future
  // else if (url.includes("hltv.org")) { return fetchHLTVMatchData(url); }

  throw new Error("Unsupported match data source");
};
