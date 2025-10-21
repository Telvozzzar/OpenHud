import { useEffect, useState } from "react";
import { MatchTypes } from "./MatchPage";
import { VetoRow } from "./VetoRow";
import { ButtonContained, Container, Dialog } from "../../components";
import { useMatches } from "./useMatches";
import { useTeams } from "../../hooks";
import { matchApi } from "./matchApi";

interface MatchFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const MatchForm = ({ open, setOpen }: MatchFormProps) => {
  const {
  isEditing,
  selectedMatch,
  setCurrentMatch,
    createMatch,
    updateMatch,
    setIsEditing,
    setSelectedMatch
  } = useMatches();
  const { teams } = useTeams();

  const [matchType, setMatchType] = useState<"bo1" | "bo2" | "bo3" | "bo5">(
    "bo1",
  );
  const [leftTeamId, setLeftTeamId] = useState<string | null>(null);
  const [leftTeamWins, setLeftTeamWins] = useState<number>(0);
  const [rightTeamId, setRightTeamId] = useState<string | null>(null);
  const [rightTeamWins, setRightTeamWins] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // Added for error message
  const [externalUrl, setExternalUrl] = useState(""); // Added for external URL
  const [isFetchingExternal, setIsFetchingExternal] = useState(false);
  const [vetos, setVetos] = useState<Veto[]>(
    Array(9)
      .fill(null)
      .map(() => ({
        teamId: "",
        mapName: "",
        side: "NO",
        type: "ban",
        mapEnd: false,
      })),
  );

  const leftTeam = teams.find((team) => team._id === leftTeamId);
  const rightTeam = teams.find((team) => team._id === rightTeamId);

  useEffect(() => {
    if (isEditing && selectedMatch) {
      setLeftTeamId(selectedMatch.left.id);
      setRightTeamId(selectedMatch.right.id);
      setLeftTeamWins(selectedMatch.left.wins);
      setRightTeamWins(selectedMatch.right.wins);
      setMatchType(selectedMatch.matchType);
      setCurrentMatch(selectedMatch);
      setVetos(selectedMatch.vetos);
    } else {
      handleReset();
    }
  }, [isEditing, selectedMatch]);

  const validateForm = () => {
    let isValid = true;
    setErrorMessage("");

    if (!leftTeamId || !rightTeamId) {
      setErrorMessage("Please select both teams.");
      isValid = false;
    }

    if (!["bo1", "bo2", "bo3", "bo5"].includes(matchType)) {
      setErrorMessage("Invalid match type selected.");
      isValid = false;
    }

    return isValid;
  };

  const handleVetoChange = (index: number, key: keyof Veto, value: string | boolean) => {
    const updatedVetos = [...vetos];
    updatedVetos[index] = { ...updatedVetos[index], [key]: value };
    setVetos(updatedVetos);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    const newMatch: Match = {
      id: selectedMatch?.id || "",
      left: { id: leftTeamId, wins: leftTeamWins },
      right: { id: rightTeamId, wins: rightTeamWins },
      matchType: matchType as "bo1" | "bo2" | "bo3" | "bo5",
      current: selectedMatch ? selectedMatch.current : false,
      vetos: vetos,
    };

    try {
      if (isEditing && selectedMatch) {
        await updateMatch(selectedMatch.id, newMatch);
      } else if (createMatch) {
        await createMatch(newMatch);
      }
    } catch (error) {
      console.error("Error creating/updating match:", error);
    } finally {
      setOpen(false);
      handleReset();
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    handleReset();
    setOpen(false);
  };

  const handleReset = () => {
    setIsEditing(false);
    setSelectedMatch(null);
    setLeftTeamId(null);
    setRightTeamId(null);
    setCurrentMatch(null);
    setMatchType("bo1");
    setLeftTeamWins(0);
    setRightTeamWins(0);
    setErrorMessage("");
    setExternalUrl("");
    const newVetos: Veto[] = vetos.map(() => ({
      type: "pick",
      teamId: "",
      mapName: "",
      side: "NO",
      reverseSide: false,
      mapEnd: false,
    }));
    setVetos(newVetos);
  };

  const handleFetchExternal = async () => {
    if (!externalUrl.trim()) {
      setErrorMessage("Please enter a valid URL");
      return;
    }

    setIsFetchingExternal(true);
    setErrorMessage("");

    try {
      // Create match from external URL - this will create teams and players automatically
      await matchApi.createFromExternal(externalUrl);
      
      setErrorMessage("");
      setOpen(false);
      handleReset();
      
      // Reload matches to show the new one
      window.location.reload();
    } catch (error) {
      console.error("Error fetching external match data:", error);
      setErrorMessage(
        error instanceof Error 
          ? error.message 
          : "Failed to fetch match data from URL. Please check the URL and try again."
      );
    } finally {
      setIsFetchingExternal(false);
    }
  };

  const vetoSource = selectedMatch?.vetos || vetos;

  return (
    <Dialog onClose={handleCancel} open={open}>
      <div className="flex flex-1 border-b border-border">
        <h3 className="px-6 py-4 font-semibold">
          {isEditing
            ? `Updating: ${leftTeam?.name} vs ${rightTeam?.name}`
            : "Create Match"}
        </h3>
      </div>
      <Container>
        <div className="flex flex-1 flex-col overflow-y-scroll p-6">
          {/* External URL Import Section */}
          {!isEditing && (
            <div className="mb-6 rounded-lg border border-border bg-background-secondary p-4">
              <h4 className="mb-3 font-semibold text-text">
                Import Match from External URL
              </h4>
              <p className="mb-2 text-sm text-gray-400">
                Enter a match URL (e.g., from dachcs.de) to automatically fetch
                team and player data
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://dachcs.de/coverage/match/7792"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
                  disabled={isFetchingExternal}
                />
                <ButtonContained
                  onClick={handleFetchExternal}
                  disabled={isFetchingExternal}
                >
                  {isFetchingExternal ? "Fetching..." : "Import"}
                </ButtonContained>
              </div>
            </div>
          )}

          {/* Divider */}
          {!isEditing && (
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background-primary px-2 text-gray-400">
                  Or create manually
                </span>
              </div>
            </div>
          )}

          <div className="my-2 flex items-center justify-center gap-4">
            <div className="bg-background-primary">
              <select
                value={leftTeamId || ""}
                onChange={(e) => setLeftTeamId(e.target.value)}
                name="Team One"
              >
                <option>Team One</option>
                {teams.map((team) => (
                  <option
                    key={team._id}
                    value={team._id}
                    className="p-4 text-text"
                  >
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <h2 className="font-semibold">VS</h2>

            <div className="bg-background-primary">
              <select
                value={rightTeamId || ""}
                onChange={(e) => setRightTeamId(e.target.value)}
                name="Team Two"
              >
                <option>Team Two</option>
                {teams.map((team) => (
                  <option
                    key={team._id}
                    value={team._id}
                    className="p-4 text-text"
                  >
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="my-2 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Left Wins</label>
              <input
                type="number"
                min={0}
                className="h-8 w-20 rounded border border-gray-300 px-2"
                value={leftTeamWins}
                onChange={(e) => setLeftTeamWins(Number(e.target.value || 0))}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Right Wins</label>
              <input
                type="number"
                min={0}
                className="h-8 w-20 rounded border border-gray-300 px-2"
                value={rightTeamWins}
                onChange={(e) => setRightTeamWins(Number(e.target.value || 0))}
              />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <form className="flex flex-col items-center justify-center bg-background-primary">
              <label
                htmlFor="Match Type"
                className="text-sm font-semibold uppercase text-gray-400"
              >
                Best of
              </label>
              <select
                value={matchType}
                onChange={(e) =>
                  setMatchType(e.target.value as "bo1" | "bo2" | "bo3" | "bo5")
                }
                name="Match Type"
              >
                {MatchTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </form>
          </div>

          <h5 className="mt-4 font-semibold">Set Vetos:</h5>
          {/* <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3"> */}
          <table className="min-w-full divide-y divide-slate-400">
            <thead className="bg-background-secondary">
              <tr>
                <TableTH title="veto" />
                <TableTH title="type" />
                <TableTH title="Team" />
                <TableTH title="Map" />
                <TableTH title="Side" />
                <TableTH title="Reverse side" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 p-4">
              {vetoSource.map((veto, index) => (
                <VetoRow
                  key={index}
                  index={index}
                  veto={veto}
                  leftTeamId={leftTeamId}
                  rightTeamId={rightTeamId}
                  teams={teams}
                  onVetoChange={handleVetoChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Container>
      <div className="inline-flex w-full justify-end gap-2 border-t border-border p-2">
        {errorMessage && (
          <p className="my-1 text-end text-red-500">{errorMessage}</p>
        )}
        <div className="mt-1 flex justify-end gap-1">
          {isSubmitting ? (
            <ButtonContained disabled>Submitting...</ButtonContained>
          ) : (
            <ButtonContained onClick={handleSubmit}>Submit</ButtonContained>
          )}
          <ButtonContained onClick={handleReset}>Reset</ButtonContained>
          {isEditing && (
            <ButtonContained color="secondary" onClick={handleCancel}>
              Cancel
            </ButtonContained>
          )}
        </div>
      </div>
    </Dialog>
  );
};

interface TableTHProps {
  title: string;
}

const TableTH: React.FC<TableTHProps> = ({ title }) => {
  return (
    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
      {title}
    </th>
  );
};
