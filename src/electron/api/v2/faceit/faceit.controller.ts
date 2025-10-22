import { Request, Response } from "express";
import * as FaceitService from "./faceit.service.js";
import * as TeamService from "../teams/teams.service.js";
import * as PlayerService from "../players/players.service.js";

/**
 * Controller for importing match data from Faceit
 * @returns Match data with created teams and players
 */
export const importFaceitMatchHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchIdOrUrl, apiKey } = req.body;

    if (!matchIdOrUrl) {
      res.status(400).json({ error: "Match ID or URL is required" });
      return;
    }

    // Fetch match data from Faceit
    const faceitMatch = await FaceitService.fetchFaceitMatch(matchIdOrUrl, apiKey);

    // Convert to OpenHud format
    const convertedData = FaceitService.convertFaceitMatchToOpenHud(faceitMatch);

    // Create or update teams
    const createdTeams = [];
    for (const teamData of convertedData.teams) {
      const existingTeams = await TeamService.getAllTeams();
      const existingTeam = existingTeams.find(
        (t) => t.name.toLowerCase() === teamData.name.toLowerCase()
      );

      if (existingTeam) {
        createdTeams.push(existingTeam);
      } else {
        const teamId = await TeamService.createTeam({
          ...teamData,
          _id: "",
          extra: {},
        } as Team);
        const createdTeam = await TeamService.getTeamByID(teamId);
        createdTeams.push(createdTeam);
      }
    }

    // Create or update players
    const createdPlayers = [];
    for (const playerData of convertedData.players) {
      const existingPlayers = await PlayerService.getAllPlayers();
      const existingPlayer = existingPlayers.find(
        (p) => p.username.toLowerCase() === playerData.username.toLowerCase() ||
              (playerData.steamid && p.steamid === playerData.steamid)
      );

      if (existingPlayer) {
        // Update player's team if needed
        const playerTeam = createdTeams.find(
          (t) => t.name === playerData.teamName
        );
        if (playerTeam && existingPlayer.team !== playerTeam._id) {
          await PlayerService.updatePlayer({
            ...existingPlayer,
            team: playerTeam._id,
          });
        }
        createdPlayers.push(existingPlayer);
      } else {
        // Find team ID for this player
        const playerTeam = createdTeams.find(
          (t) => t.name === playerData.teamName
        );
        
        const playerId = await PlayerService.createPlayer({
          _id: "",
          firstName: playerData.firstName,
          lastName: playerData.lastName,
          username: playerData.username,
          avatar: playerData.avatar,
          country: playerData.country,
          steamid: playerData.steamid,
          team: playerTeam?._id || "",
          extra: {},
        } as Player);
        const createdPlayer = await PlayerService.getPlayerByID(playerId);
        createdPlayers.push(createdPlayer);
      }
    }

    res.status(200).json({
      success: true,
      teams: createdTeams,
      players: createdPlayers,
      matchType: convertedData.matchType,
      maps: convertedData.maps,
      faceitMatchId: faceitMatch.match_id,
      competitionName: faceitMatch.competition_name,
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error occurred" });
    }
  }
};

/**
 * Controller for validating a Faceit match ID or URL
 * @returns Whether the match ID/URL is valid
 */
export const validateFaceitMatchHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchIdOrUrl } = req.body;

    if (!matchIdOrUrl) {
      res.status(400).json({ error: "Match ID or URL is required" });
      return;
    }

    const matchId = FaceitService.extractMatchId(matchIdOrUrl);
    
    if (!matchId) {
      res.status(400).json({ 
        valid: false, 
        error: "Invalid Faceit match ID or URL format" 
      });
      return;
    }

    res.status(200).json({ 
      valid: true, 
      matchId 
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: "Unknown error occurred" });
    }
  }
};
