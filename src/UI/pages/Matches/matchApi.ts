import { apiUrl as API_BASE_URL } from "../../api/api";

interface ExternalPlayerData {
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  steamid?: string;
}

interface ExternalMatchData {
  team1: { name: string; logo?: string; players: ExternalPlayerData[] };
  team2: { name: string; logo?: string; players: ExternalPlayerData[] };
  matchType?: "bo1" | "bo2" | "bo3" | "bo5";
}

export const matchApi = {
  getAll: async (): Promise<Match[]> => {
    const response = await fetch(`${API_BASE_URL}/match`);
    if (!response.ok) throw new Error("Failed to fetch match");
    return response.json();
  },

  getById: async (id: string): Promise<Match> => {
    const response = await fetch(`${API_BASE_URL}/match/id/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch match with id: ${id}`);
    return response.json();
  },
  
  getCurrent: async (): Promise<Match | null> => {
    const response = await fetch(`${API_BASE_URL}/match/current`);
    // If server returns 204 No Content, treat as no current match
    if (response.status === 204) return null;
    if (!response.ok) throw new Error(`Failed to fetch current match`);

    // Some responses may have an empty body; guard against calling .json() on empty
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
  },

  create: async (matchData: Match): Promise<Match> => {
    const response = await fetch(`${API_BASE_URL}/match`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(matchData),
    });

    if (!response.ok) throw new Error("Failed to create match");
    return response.json();
  },

  update: async (id: string, matchData: Match): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/match/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(matchData),
    });
    if (!response.ok) throw new Error("Failed to update match");
    return response.json();
  },

  remove: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/match/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to remove match");
  },
  setCurrent: async (id: string, current: boolean): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/match/current/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ current }),
    });
    if (!response.ok) throw new Error("Failed to set current team");
  },

  fetchExternalData: async (url: string): Promise<ExternalMatchData> => {
    const response = await fetch(`${API_BASE_URL}/match/fetch-external`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) throw new Error("Failed to fetch external match data");
    return response.json();
  },

  createFromExternal: async (url: string): Promise<Match> => {
    const response = await fetch(`${API_BASE_URL}/match/create-from-external`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) throw new Error("Failed to create match from external URL");
    return response.json();
  },
};
