import { useState } from "react";
import { ButtonContained, Dialog } from "../../components";
import { faceitApi } from "./faceitApi";
import { useTeams } from "../../hooks";

interface FaceitImportDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onImportSuccess: (data: {
    leftTeamId: string;
    rightTeamId: string;
    matchType: "bo1" | "bo3" | "bo5";
    maps: string[];
  }) => void;
}

export const FaceitImportDialog = ({
  open,
  setOpen,
  onImportSuccess,
}: FaceitImportDialogProps) => {
  const [matchIdOrUrl, setMatchIdOrUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { fetchTeams } = useTeams();

  const handleImport = async () => {
    if (!matchIdOrUrl.trim()) {
      setErrorMessage("Please enter a Faceit match URL or ID");
      return;
    }

    setIsImporting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Import the match data
      const result = await faceitApi.importMatch(matchIdOrUrl, apiKey || undefined);

      if (result.success && result.teams.length === 2) {
        // Refresh teams to get the newly created teams
        await fetchTeams();

        // Set success message
        setSuccessMessage(
          `Successfully imported match: ${result.teams[0].name} vs ${result.teams[1].name}`
        );

        // Wait a bit to show the success message
        setTimeout(() => {
          // Pass the imported data back to parent
          onImportSuccess({
            leftTeamId: result.teams[0]._id,
            rightTeamId: result.teams[1]._id,
            matchType: result.matchType,
            maps: result.maps,
          });

          // Close the dialog
          handleClose();
        }, 1500);
      } else {
        setErrorMessage("Invalid response from server");
      }
    } catch (error) {
      console.error("Error importing Faceit match:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to import Faceit match"
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setMatchIdOrUrl("");
    setApiKey("");
    setErrorMessage("");
    setSuccessMessage("");
    setOpen(false);
  };

  return (
    <Dialog onClose={handleClose} open={open}>
      <div className="flex flex-1 border-b border-border">
        <h3 className="px-6 py-4 font-semibold">Import Match from Faceit</h3>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4">
          <label
            htmlFor="faceitMatchUrl"
            className="mb-2 block text-sm font-medium"
          >
            Faceit Match URL or ID
          </label>
          <input
            id="faceitMatchUrl"
            type="text"
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="https://www.faceit.com/en/cs2/room/1-xxx-xxx or match ID"
            value={matchIdOrUrl}
            onChange={(e) => setMatchIdOrUrl(e.target.value)}
            disabled={isImporting}
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter the full Faceit match URL or just the match ID
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="faceitApiKey" className="mb-2 block text-sm font-medium">
            Faceit API Key (Optional)
          </label>
          <input
            id="faceitApiKey"
            type="password"
            className="w-full rounded border border-gray-300 px-3 py-2"
            placeholder="Your Faceit API key (if needed)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isImporting}
          />
          <p className="mt-1 text-xs text-gray-500">
            Optional: Add your Faceit API key for private matches
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded bg-green-100 p-3 text-green-700">
            {successMessage}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <ButtonContained
            onClick={handleImport}
            disabled={isImporting || !matchIdOrUrl.trim()}
          >
            {isImporting ? "Importing..." : "Import"}
          </ButtonContained>
          <ButtonContained color="secondary" onClick={handleClose} disabled={isImporting}>
            Cancel
          </ButtonContained>
        </div>
      </div>
    </Dialog>
  );
};
