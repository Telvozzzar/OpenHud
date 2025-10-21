import { run_transaction } from "../helpers/utilities.js";
import * as MatchData from "./matches.data.js";
import { v4 as uuidv4 } from "uuid";
import * as TeamService from "../teams/teams.service.js";
import * as PlayerService from "../players/players.service.js";
import type { ExternalMatchData } from "./external-fetcher.service.js";

/* ====================== Notes: ======================*/
// Use the run_transaction function for inserts/updates (future proofing and looks more uniform)

/**
 * Service for selecting all matches.
 * @returns An array of matches
 */
export const getAllMatches = async (): Promise<Match[]> => {
  return await MatchData.selectAll();
};

/**
 * Service for selecting a match by their id.
 * @returns A single match
 */
export const getMatchByID = async (id: string): Promise<Match> => {
  return await MatchData.selectByID(id);
};

/**
 * Service for creating a match
 * @returns The id of newly created match
 */
export const createMatch = async (match: Match): Promise<string> => {
  const newmatch: Match = {
    ...match,
    id: uuidv4(),
  };
  return run_transaction(async () => {
    return await MatchData.insert(newmatch);
  });
};

/**
 * Service for updating a match
 * @returns The id of newly created match
 */
export const updateMatch = (match: Match) => {
  return run_transaction(async () => {
    return await MatchData.update(match);
  });
};

/**
 * Service getting the current match. 
 * @returns A single match or null
 */
export const getCurrentMatch = async (): Promise<Match | null> => {
  return await MatchData.selectCurrent();
};

/**
 * Service setting the current match.
 * @returns Id of the updated match
 */
export const setCurrentMatch = async (id: string, current: boolean): Promise<string> => {
  return await MatchData.setCurrent(id, current);
};

/**
 * Service for removing a match
 * @returns The id of the removed match
 */
export const removeMatch = (id: string) => {
  return run_transaction(async () => {
    return await MatchData.remove(id);
  });
};

/**
 * Service for creating a match from external data
 * Creates teams and players if they don't exist
 * @returns The complete match object with team and player IDs
 */
export const createMatchFromExternalData = async (
  externalData: ExternalMatchData
): Promise<Match> => {
  return run_transaction(async () => {
    // Create or find team 1
    const team1: Team = {
      _id: uuidv4(),
      name: externalData.team1.name,
      shortName: externalData.team1.name.substring(0, 10),
      country: "",
      logo: externalData.team1.logo || "",
      extra: {},
    };
    const team1Id = await TeamService.createTeam(team1);

    // Create or find team 2
    const team2: Team = {
      _id: uuidv4(),
      name: externalData.team2.name,
      shortName: externalData.team2.name.substring(0, 10),
      country: "",
      logo: externalData.team2.logo || "",
      extra: {},
    };
    const team2Id = await TeamService.createTeam(team2);

    // Create players for team 1
    for (const playerData of externalData.team1.players) {
      const player: Player = {
        _id: uuidv4(),
        firstName: playerData.firstName || "",
        lastName: playerData.lastName || "",
        username: playerData.username,
        avatar: playerData.avatar || "",
        country: "",
        steamid: playerData.steamid || "",
        team: team1Id,
        extra: {},
      };
      await PlayerService.createPlayer(player);
    }

    // Create players for team 2
    for (const playerData of externalData.team2.players) {
      const player: Player = {
        _id: uuidv4(),
        firstName: playerData.firstName || "",
        lastName: playerData.lastName || "",
        username: playerData.username,
        avatar: playerData.avatar || "",
        country: "",
        steamid: playerData.steamid || "",
        team: team2Id,
        extra: {},
      };
      await PlayerService.createPlayer(player);
    }

    // Create the match
    const match: Match = {
      id: uuidv4(),
      current: false,
      left: { id: team1Id, wins: 0 },
      right: { id: team2Id, wins: 0 },
      matchType: externalData.matchType || "bo3",
      vetos: Array(9)
        .fill(null)
        .map(() => ({
          teamId: "",
          mapName: "",
          side: "NO",
          type: "pick",
          mapEnd: false,
        })),
    };

    await MatchData.insert(match);
    return match;
  });
};

