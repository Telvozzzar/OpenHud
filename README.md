# OpenHud - An open source CS2 Custom Hud.

Join the community [Discord](https://discord.gg/HApB9HyaWM)!

- Tech: Electron, React, Typescript, NodeJS, Express, Socketio, SQLite3
- Styling: TailwindCSS (admin panel) / Sass (hud)

## License

This software is licensed under a custom license that allows free use and modification — including in monetized streams and videos — but **forbids resale** of the program or modified versions.

If you redistribute modified versions, you must provide proper credit and disclose what changes were made.

See [LICENSE](./LICENSE) for full details.

# Getting Started:

- Download the latest .zip form the releases page and unzip it.
- Copy the gamestate_integration_openhud.cfg file from the .zip /resources/src/assets to your CS config folder (the same folder you'd put an autoexec.cfg). (Will make it automatic in the future)
- Launch openhud.exe and run CS2 in WindowedFullscreen mode.
- You're done! Create your players, teams, and matches. Start CS2 and join a match (or demo) as a spectator.
- For the Spectator overlay, click the overlay button in the side menu of the app.
- For OBS overlay, create a Browser Source, delete all of the custom css, and use the url: http://localhost:1349/api/hud

## Faceit Match Import

OpenHud now supports importing match data directly from Faceit, which automatically creates teams and players based on the Faceit match information.

### How to use Faceit Import:

1. Go to the **Matches** page in the admin panel
2. Click on the **"Match"** button to create a new match
3. In the match creation dialog, click **"Import from Faceit"**
4. Enter a Faceit match URL or ID:
   - Full URL example: `https://www.faceit.com/en/cs2/room/1-xxx-xxx-xxx`
   - Match ID example: `1-xxx-xxx-xxx` (UUID format)
5. (Optional) Enter your Faceit API key if you need to access private matches
6. Click **"Import"**
7. The system will automatically:
   - Create teams if they don't exist
   - Create players if they don't exist
   - Set up the match with the correct teams
   - Pre-populate map information if available

### Notes:
- Existing teams and players will be reused based on name matching
- Player Steam IDs will be imported from Faceit
- Team logos and player avatars will be imported from Faceit
- The import process does not require a Faceit API key for public matches

Hopefully it ends up looking very nice and lets a lot of people use it in their streams!

# OpenHud React Hud based on [Lexogrine react hud](https://github.com/lexogrine/cs2-react-hud)

![Custom CS2 Hud](https://i.imgur.com/tWK5Bqj.jpeg)

# Admin Panel

![AdminPanel/Matches](https://i.imgur.com/kr1SMvB.png)
![AdminPanel/Players](https://i.imgur.com/nkBt4Kn.png)
![AdminPanel/Teams](https://i.imgur.com/tQVVFAJ.png)
![AdminPanel/Dashboard](https://i.imgur.com/JNg9Gw8.png)
