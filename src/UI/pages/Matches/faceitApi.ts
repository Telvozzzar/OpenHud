import { apiUrl } from "../../api/api";

export interface FaceitImportResponse {
  success: boolean;
  teams: Team[];
  players: Player[];
  matchType: "bo1" | "bo3" | "bo5";
  maps: string[];
  faceitMatchId: string;
  competitionName: string;
}

export interface FaceitValidateResponse {
  valid: boolean;
  matchId?: string;
  error?: string;
}

export const faceitApi = {
  /**
   * Import match data from Faceit
   */
  importMatch: async (
    matchIdOrUrl: string,
    apiKey?: string
  ): Promise<FaceitImportResponse> => {
    const response = await fetch(`${apiUrl}/faceit/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ matchIdOrUrl, apiKey }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to import Faceit match");
    }

    return response.json();
  },

  /**
   * Validate a Faceit match ID or URL
   */
  validateMatch: async (matchIdOrUrl: string): Promise<FaceitValidateResponse> => {
    const response = await fetch(`${apiUrl}/faceit/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ matchIdOrUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to validate Faceit match");
    }

    return response.json();
  },
};
