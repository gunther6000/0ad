/**
 * Highlights the victory condition in the game-description.
 */
var g_DescriptionHighlight = "orange";

/**
 * Returns map description and preview image or placeholder.
 */
function getMapDescriptionAndPreview(mapType, mapName)
{
	let mapData;
	if (mapType == "random" && mapName == "random")
		mapData = { "settings": { "Description": translate("A randomly selected map.") } };
	else if (mapType == "random" && Engine.FileExists(mapName + ".json"))
		mapData = Engine.ReadJSONFile(mapName + ".json");
	else if (Engine.FileExists(mapName + ".xml"))
		mapData = Engine.LoadMapSettings(mapName + ".xml");

	return {
		"description": mapData && mapData.settings && mapData.settings.Description ? translate(mapData.settings.Description) : translate("Sorry, no description available."),
		"preview": mapData && mapData.settings && mapData.settings.Preview ? mapData.settings.Preview : "nopreview.png"
	};
}

/**
 * Sets the mappreview image correctly.
 * It needs to be cropped as the engine only allows loading square textures.
 *
 * @param {string} guiObject
 * @param {string} filename
 */
function setMapPreviewImage(guiObject, filename)
{
	let path = "session/icons/mappreview/";
	Engine.GetGUIObjectByName(guiObject).sprite =
		"cropped:" + 400/512 + "," + 300/512 + ":" +
		path + (Engine.FileExists("art/textures/ui/" + path + filename) ? filename : "nopreview.png");
}

/**
 * Returns a formatted string describing the player assignments.
 * Needs g_CivData to translate!
 *
 * @param {object} playerDataArray - As known from gamesetup and simstate.
 * @param {(string[]|false)} playerStates - One of "won", "defeated", "active" for each player.
 * @returns {string}
 */
function formatPlayerInfo(playerDataArray, playerStates)
{
	let playerDescriptions = {};
	let playerIdx = 0;

	for (let playerData of playerDataArray)
	{
		if (playerData == null || playerData.Civ && playerData.Civ == "gaia")
			continue;

		++playerIdx;
		let teamIdx = playerData.Team;
		let isAI = playerData.AI && playerData.AI != "";
		let playerState = playerStates && playerStates[playerIdx] || playerData.State;
		let isActive = !playerState || playerState == "active";

		let playerDescription;
		if (isAI)
		{
			if (playerData.Civ)
			{
				if (isActive)
					// Translation: Describe a player in a selected game, f.e. in the replay- or savegame menu
					playerDescription = translate("%(playerName)s (%(civ)s, %(AIdifficulty)s %(AIname)s)");
				else
					// Translation: Describe a player in a selected game, f.e. in the replay- or savegame menu
					playerDescription = translate("%(playerName)s (%(civ)s, %(AIdifficulty)s %(AIname)s, %(state)s)");
			}
			else
			{
				if (isActive)
					// Translation: Describe a player in a selected game, f.e. in the replay- or savegame menu
					playerDescription = translate("%(playerName)s (%(AIdifficulty)s %(AIname)s)");
				else
					// Translation: Describe a player in a selected game, f.e. in the replay- or savegame menu
					playerDescription = translate("%(playerName)s (%(AIdifficulty)s %(AIname)s, %(state)s)");
			}
		}
		else
		{
			if (playerData.Offline)
			{
				// Can only occur in the lobby for now, so no strings with civ needed
				if (isActive)
					// Translation: Describe a player in a selected game, f.e. in the replay- or savegame menu
					playerDescription = translate("%(playerName)s (OFFLINE)");
				else
					// Translation: Describe a player in a selected game, f.e. in the replay- or savegame menu
					playerDescription = translate("%(playerName)s (OFFLINE, %(state)s)");
			}
			else
			{
				if (playerData.Civ)
					if (isActive)
						// Translation: Describe a player in a selected game, f.e. in the replay- or savegame menu
						playerDescription = translate("%(playerName)s (%(civ)s)");
					else
						// Translation: Describe a player in a selected game, f.e. in the replay- or savegame menu
						playerDescription = translate("%(playerName)s (%(civ)s, %(state)s)");
				else
					if (isActive)
						// Translation: Describe a player in a selected game, f.e. in the replay- or savegame menu
						playerDescription = translate("%(playerName)s");
					else
						// Translation: Describe a player in a selected game, f.e. in the replay- or savegame menu
						playerDescription = translate("%(playerName)s (%(state)s)");
			}
		}

		// Sort player descriptions by team
		if (!playerDescriptions[teamIdx])
			playerDescriptions[teamIdx] = [];

		playerDescriptions[teamIdx].push(sprintf(playerDescription, {
			"playerName":
				'[color="' +
				(typeof getPlayerColor == 'function' ?
					(isAI ? "white" : getPlayerColor(playerData.Name)) :
					rgbToGuiColor(playerData.Color || g_Settings.PlayerDefaults[playerIdx].Color)) +
				'"]' + escapeText(playerData.Name) + "[/color]",

			"civ":
				!playerData.Civ ?
					translate("Unknown Civilization") :
					g_CivData && g_CivData[playerData.Civ] && g_CivData[playerData.Civ].Name ?
						translate(g_CivData[playerData.Civ].Name) :
						playerData.Civ,

			"state":
				playerState == "defeated" ?
					translateWithContext("playerstate", "defeated") :
					translateWithContext("playerstate", "won"),

			"AIname": isAI ? translateAIName(playerData.AI) : "",
			"AIdifficulty": isAI ? translateAIDifficulty(playerData.AIDiff) : ""
		}));
	}

	let teams = Object.keys(playerDescriptions);
	if (teams.indexOf("observer") > -1)
		teams.splice(teams.indexOf("observer"), 1);

	let teamDescription = [];

	// If there are no teams, merge all playersDescriptions
	if (teams.length == 1)
		teamDescription.push(playerDescriptions[teams[0]].join("\n"));

	// If there are teams, merge "Team N:" + playerDescriptions
	else
		teamDescription = teams.map(team => {

			let teamCaption = team == -1 ?
				translate("No Team") :
				sprintf(translate("Team %(team)s"), { "team": +team + 1 });

			// Translation: Describe players of one team in a selected game, f.e. in the replay- or savegame menu or lobby
			return sprintf(translate("%(team)s:\n%(playerDescriptions)s"), {
				"team": '[font="sans-bold-14"]' + teamCaption + "[/font]",
				"playerDescriptions": playerDescriptions[team].join("\n")
			});
		});

	if (playerDescriptions.observer)
		teamDescription.push(sprintf(translate("%(team)s:\n%(playerDescriptions)s"), {
			"team": '[font="sans-bold-14"]' + translatePlural("Observer", "Observers", playerDescriptions.observer.length) + "[/font]",
			"playerDescriptions": playerDescriptions.observer.join("\n")
		}));

	return teamDescription.join("\n\n");
}

/**
 * Sets an additional map label, map preview image and describes the chosen gamesettings more closely.
 *
 * Requires g_GameAttributes and g_VictoryConditions.
 */
function getGameDescription(extended = false)
{
	let titles = [];

	let victoryIdx = g_VictoryConditions.Name.indexOf(g_GameAttributes.settings.GameType || g_VictoryConditions.Default);
	if (victoryIdx != -1)
	{
		let title = g_VictoryConditions.Title[victoryIdx];
		if (g_VictoryConditions.Name[victoryIdx] == "wonder")
			title = sprintf(
				translatePluralWithContext(
					"victory condition",
					"Wonder (%(min)s minute)",
					"Wonder (%(min)s minutes)",
					g_GameAttributes.settings.WonderDuration
				),
				{ "min": g_GameAttributes.settings.WonderDuration }
			);
		titles.push({
			"label": title,
			"value": g_VictoryConditions.Description[victoryIdx]
		});
	}

	if (g_GameAttributes.settings.RatingEnabled &&
	    g_GameAttributes.settings.PlayerData.length == 2)
		titles.push({
			"label": translate("Rated game"),
			"value": translate("When the winner of this match is determined, the lobby score will be adapted.")
		});

	if (g_GameAttributes.settings.LockTeams)
		titles.push({
			"label": translate("Locked Teams"),
			"value": translate("Players can't change the initial teams.")
		});
	else
		titles.push({
			"label": translate("Diplomacy"),
			"value": translate("Players can make alliances and declare war on allies.")
		});

	if (g_GameAttributes.settings.LastManStanding)
		titles.push({
			"label": translate("Last Man Standing"),
			"value": translate("Only one player can win the game. If the remaining players are allies, the game continues until only one remains.")
		});
	else
		titles.push({
			"label": translate("Allied Victory"),
			"value": translate("If one player wins, his or her allies win too. If one group of allies remains, they win.")
		});

	if (extended)
	{
		titles.push({
			"label": translate("Ceasefire"),
			"value":
				g_GameAttributes.settings.Ceasefire == 0 ?
					translate("disabled") :
					sprintf(translatePlural(
						"For the first minute, enemies will stay neutral.",
						"For the first %(min)s minutes, enemies will stay neutral.",
						g_GameAttributes.settings.Ceasefire),
					{ "min": g_GameAttributes.settings.Ceasefire })
		});

		titles.push({
			"label": translate("Map Name"),
			"value": translate(g_GameAttributes.settings.Name)
		});

		titles.push({
			"label": translate("Map Type"),
			"value": g_MapTypes.Title[g_MapTypes.Name.indexOf(g_GameAttributes.mapType)]
		});

		if (g_GameAttributes.mapType == "random")
		{
			let mapSize = g_MapSizes.Name[g_MapSizes.Tiles.indexOf(g_GameAttributes.settings.Size)];
			if (mapSize)
				titles.push({
					"label": translate("Map Size"),
					"value": mapSize
				});
		}
	}

	titles.push({
		"label": translate("Map Description"),
		"value":
			g_GameAttributes.map == "random" ?
				translate("Randomly selects a map from the list") :
			g_GameAttributes.settings.Description ?
				translate(g_GameAttributes.settings.Description) :
				translate("Sorry, no description available."),
	});

	if (extended)
	{
		titles.push({
			"label": translate("Starting Resources"),
			"value": sprintf(translate("%(startingResourcesTitle)s (%(amount)s)"), {
				"startingResourcesTitle":
					g_StartingResources.Title[
						g_StartingResources.Resources.indexOf(
							g_GameAttributes.settings.StartingResources)],
				"amount": g_GameAttributes.settings.StartingResources
			})
		});

		titles.push({
			"label": translate("Population Limit"),
			"value":
				g_PopulationCapacities.Title[
					g_PopulationCapacities.Population.indexOf(
						g_GameAttributes.settings.PopulationCap)]
		});

		titles.push({
			"label": translate("Disable Treasure"),
			"value": g_GameAttributes.settings.DisableTreasure
		});

		titles.push({
			"label": translate("Revealed Map"),
			"value": g_GameAttributes.settings.RevealMap
		});

		titles.push({
			"label": translate("Explored Map"),
			"value": g_GameAttributes.settings.ExploreMap
		});

		titles.push({
			"label": translate("Cheats"),
			"value": g_GameAttributes.settings.CheatsEnabled
		});
	}

	return titles.map(title => sprintf(translate("%(label)s %(details)s"), {
		"label": "[color=\"" + g_DescriptionHighlight + "\"]" + title.label + ":" + "[/color]",
		"details":
			title.value === true ? translateWithContext("gamesetup option", "enabled") :
			!title.value ? translateWithContext("gamesetup option", "disabled") :
			title.value
	})).join("\n");
}
