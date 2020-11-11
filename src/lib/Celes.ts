import * as path from 'path';
import {
    ExportableGameStats,
    ExportableGameStatsCollection,
    GameData,
    Platform,
    ScrapResult,
    Source,
    SteamPluginMode,
} from '../types';
import {
    FileNotFoundError,
    InvalidApiVersionError
} from './utils/errors';
import {
    checkThatAchievementExistsInSchema,
    generateManualGame,
    removeManuallyUnlockedGameAchievement,
    unlockGameAchievement,
    updateGameAchievementUnlockTime
} from './utils/gameDataUtils';
import {CelesDbConnector} from './utils/CelesDbConnector';
import {CelesMutex} from './utils/CelesMutex';
import {CelesScraper} from './utils/CelesScraper';
import {promises as fs} from 'fs';
import {getGameSchema} from './utils/utils';
import {mergeGameDataCollections} from './utils/merger';

export class Celes {
    private readonly achievementWatcherRootPath: string;
    private readonly additionalFoldersToScan: string[];
    private readonly enabledPlugins: string[];
    private readonly celesMutex: CelesMutex;
    private readonly steamPluginMode: SteamPluginMode;
    private readonly systemLanguage: string;
    private readonly useOldestUnlockTime: boolean;

    private readonly apiVersion: string = 'v1';

    /**
     * Celes constructor.
     *
     * @param achievementWatcherRootPath - Root path of the data folder of the Achievement Watcher project. It should
     * be created in the installation of Achievement Watcher and, usually, it defaults to
     * `%APPDATA%/Achievement Watcher`. Inside of it, caches and schemas and user stats are stored.
     * @param additionalFoldersToScan - List of folders defined by the user to scan. Used by some plugins to try to
     * scrap achievement data from there.
     * @param enabledPlugins - List of plugin names that have to be used. The plugin names are defined by the name of
     * the files stored under `src/lib/plugins`. By deafault, all of them are enabled.
     * @param steamPluginMode - Work mode of the Steam plugin:
     *    0 -> Disabled.
     *    1 -> Enabled. Only Installed games are shown.
     *    2 -> Enabled. All games are shown.
     * @param systemLanguage - User defined language. Defaults to english.
     * @param useOldestUnlockTime - Method to be used when merging same achievements from different sources. By default,
     * oldest unlock time is used, which means that, under collision, the unlock time stored is the most ancient one.
     */
    constructor(
        achievementWatcherRootPath: string,
        additionalFoldersToScan: string[] = [],
        enabledPlugins: string[] = [
            '3DM',
            'Ali213',
            'Codex',
            'CreamAPI',
            'Darksiders',
            'Goldberg',
            'GreenLuma',
            'Reloaded',
            'Skidrow',
            'Steam',
            'SSE'
        ],
        steamPluginMode: SteamPluginMode = 0,
        systemLanguage = 'english',
        useOldestUnlockTime = true
    ) {
        this.achievementWatcherRootPath = achievementWatcherRootPath;
        this.additionalFoldersToScan = additionalFoldersToScan;
        this.enabledPlugins = enabledPlugins;
        this.systemLanguage = systemLanguage;
        this.steamPluginMode = steamPluginMode;
        this.useOldestUnlockTime = useOldestUnlockTime;

        this.celesMutex = new CelesMutex(achievementWatcherRootPath);
    }

    /**
     * Scraps the local filesystem to detect games and their unlocked achievements. For each game, its schema is also
     * obtained from cache or downloaded from the server.
     *
     * Once the scrap ends, the local database is read and updated with the merge of the old and the new data.
     *
     * A collection of games, formed by schemas and unlocked achievements, result from the merge, is returned.
     *
     * @param callbackProgress - Function to be invoked every time there is a change in the progress.
     */
    async pull(callbackProgress?: (progress: number) => void): Promise<ScrapResult> {
        let mergedData: GameData[] = [];

        const celesDbConnector = new CelesDbConnector(this.achievementWatcherRootPath);
        const celesScraper = new CelesScraper(this.achievementWatcherRootPath, this.additionalFoldersToScan,
            this.apiVersion, this.enabledPlugins, this.steamPluginMode,
            this.systemLanguage);
        const scrapResult: ScrapResult = await celesScraper.scrap(50, 0, callbackProgress);
        const scrapedData: GameData[] = scrapResult.data;

        const lockId: number = await this.celesMutex.lock();
        try {
            const databaseData: GameData[] = await celesDbConnector.getAll(this.systemLanguage, callbackProgress, 50, 50);
            mergedData = mergeGameDataCollections([scrapedData, databaseData], this.useOldestUnlockTime);
            await celesDbConnector.updateAll(mergedData);
            // TODO ADD CATCH -> SOME OF THESE METHODS CAN FAIL
        } finally {
            this.celesMutex.unlock(lockId);
        }

        const result: ScrapResult = {
            data: mergedData
        };

        if (scrapResult.error !== undefined) {
            result.error = scrapResult.error;
        }

        return scrapResult;
    }

    /**
     * Reads the local database and return the stored collection of games, formed by schemas and unlocked achievements.
     *
     * Note that this call does not detect any filesystem changes.
     *
     * @param callbackProgress - Function to be invoked every time there is a change in the progress.
     */
    async load(callbackProgress?: (progress: number) => void): Promise<GameData[]> {
        const celesDbConnector = new CelesDbConnector(this.achievementWatcherRootPath);
        return celesDbConnector.getAll(this.systemLanguage, callbackProgress, 100);
    }

    /**
     * Reads the local database and stores the list of unlocked achievements into a defined path.
     *
     * Note that schemas are not exported.
     *
     * @param filePath - Path of the file to export to.
     */
    async export(filePath: string): Promise<void> {
        const gameDataCollection: GameData[] = await this.load();

        const exportableGameData: ExportableGameStatsCollection = {
            apiVersion: this.apiVersion,
            data: gameDataCollection.map((gameData: GameData) => {
                return {
                    appId: gameData.appId,
                    platform: gameData.platform,
                    stats: {
                        sources: gameData.stats.sources,
                        playtime: gameData.stats.playtime
                    }
                };
            })
        };

        await fs.mkdir(path.dirname(filePath), {recursive: true});
        await fs.writeFile(filePath, JSON.stringify(exportableGameData));
    }

    /**
     * Given the path of an exported file, read its content and update the local database. Games schemas are downloaded
     * if required.
     *
     * If the force boolean is enabled, local database is replaced with the new data. Else, the database is updated with
     * the result of the merge of the old and the new lists.
     *
     * A collection of games, formed by schemas and unlocked achievements, result from the merge or the push, is
     * returned.
     *
     * @param filePath - Path of the file to import from.
     * @param force - If false, imported dats is merged with the existent one. Else, existent data is replaced.
     */
    async import(filePath: string, force = false): Promise<GameData[]> {
        const celesDbConnector = new CelesDbConnector(this.achievementWatcherRootPath);
        let importedData: ExportableGameStatsCollection;
        let newData: GameData[] = [];

        try {
            importedData = await JSON.parse(await fs.readFile(filePath, 'utf8'));
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new FileNotFoundError(filePath);
            } else {
                throw error;
            }
        }

        newData = await this.parseImportedData(importedData);

        const lockId: number = await this.celesMutex.lock();
        try {
            if (!force) {
                const localData: GameData[] = await celesDbConnector.getAll(this.systemLanguage);
                newData = mergeGameDataCollections([newData, localData],
                    this.useOldestUnlockTime);
            }

            await celesDbConnector.updateAll(newData);
        } finally {
            this.celesMutex.unlock(lockId);
        }

        return newData;
    }

    /**
     * Sets the achievement unlock time for one game. The game has to exist in the Celes Database.
     *
     * If achievement already has unlock time set, it is replaced.
     *
     * @param appId - Identifier of the game.
     * @param source - Source of the game.
     * @param platform - Platform of the game.
     * @param achievementId - Identifier of the achievmeent.
     * @param unlockTime - Unlock time to be set.
     */
    async setAchievementUnlockTime(appId: string, source: Source, platform: Platform, achievementId: string,
                                   unlockTime: number): Promise<void> {
        const celesDbConnector = new CelesDbConnector(this.achievementWatcherRootPath);

        const lockId: number = await this.celesMutex.lock();
        try {
            const gameData: GameData = await celesDbConnector.getGame(appId, platform, this.systemLanguage);
            updateGameAchievementUnlockTime(gameData, source, achievementId, unlockTime);
            await celesDbConnector.updateGame(gameData);
        } finally {
            this.celesMutex.unlock(lockId);
        }
    }

    /**
     * Adds a game manually. A default source 'Manual' is created.
     *
     * @param appId - Identifier of the game.
     * @param platform - Platform of the game.
     */
    async addGame(appId: string, platform: Platform): Promise<void> {
        const celesDbConnector = new CelesDbConnector(this.achievementWatcherRootPath);
        const gameData: GameData = await generateManualGame(this.achievementWatcherRootPath, appId, platform, this.apiVersion, this.systemLanguage);

        const lockId: number = await this.celesMutex.lock();
        try {
            await celesDbConnector.updateGame(gameData);
        } finally {
            this.celesMutex.unlock(lockId);
        }
    }

    /**
     * Removes a game added manually. If more than one source exists, only 'Manual' source is removed.
     *
     * A GameNotInDatabaseError is thrown if the game does not exist.
     *
     * @param appId - Identifier of the game.
     * @param platform - Platform of the game.
     */
    async removeManuallAddedGame(appId: string, platform: Platform): Promise<void> {
        const celesDbConnector = new CelesDbConnector(this.achievementWatcherRootPath);

        const lockId: number = await this.celesMutex.lock();
        try {
            await celesDbConnector.removeManuallAddedGame(appId, platform);
        } finally {
            this.celesMutex.unlock(lockId);
        }
    }

    /**
     * Marks a game achievement as unlocked. The game has to exist in the Celes Database.
     *
     *
     * @param appId - Identifier of the game.
     * @param platform - Platform of the game.
     * @param achievementId - Identifier of the achievmeent.
     * @param unlockTime - Unlock time to be set. Defaults to 0.
     */
    async unlockAchievement(appId: string, platform: Platform, achievementId: string, unlockTime = 0): Promise<void> {
        const celesDbConnector = new CelesDbConnector(this.achievementWatcherRootPath);

        const lockId: number = await this.celesMutex.lock();
        try {
            const gameData: GameData = await celesDbConnector.getGame(appId, platform, this.systemLanguage);
            checkThatAchievementExistsInSchema(gameData, appId, platform, achievementId);

            unlockGameAchievement(gameData, achievementId, unlockTime);
            await celesDbConnector.updateGame(gameData);
        } finally {
            this.celesMutex.unlock(lockId);
        }
    }

    /**
     * Removes a manually unlocked achievement from a game. The game has to exist in the Celes Database.
     *
     * @param appId - Identifier of the game.
     * @param platform - Platform of the game.
     * @param achievementId - Identifier of the achievmeent.
     */
    async removeManuallyUnlockedAchievement(appId: string, platform: Platform, achievementId: string): Promise<void> {
        const celesDbConnector = new CelesDbConnector(this.achievementWatcherRootPath);

        const lockId: number = await this.celesMutex.lock();
        try {
            const gameData: GameData = await celesDbConnector.getGame(appId, platform, this.systemLanguage);
            removeManuallyUnlockedGameAchievement(gameData, achievementId);
            await celesDbConnector.updateGame(gameData);
        } finally {
            this.celesMutex.unlock(lockId);
        }
    }

    /**
     * Given a game, adds or sets playtime to it. Game has to exist in the database.
     *
     * @param appId - Identifier of the game.
     * @param platform - Platform of the game.
     * @param playtime - Playtime to be set or increased.
     * @param force - If true, existent playtime is replaced. Else, the result is the sum of the existent and the new
     * value.
     */
    async addGamePlaytime(appId: string, platform: Platform, playtime: number, force = false): Promise<void> {
        const celesDbConnector = new CelesDbConnector(this.achievementWatcherRootPath);

        const lockId: number = await this.celesMutex.lock();
        try {
            const gameData: GameData = await celesDbConnector.getGame(appId, platform, this.systemLanguage);

            if (force) {
                gameData.stats.playtime = playtime;
            } else {
                gameData.stats.playtime += playtime;
            }

            await celesDbConnector.updateGame(gameData);
        } finally {
            this.celesMutex.unlock(lockId);
        }
    }

    private async parseImportedData(importedData: ExportableGameStatsCollection) {
        const gameDataCollection: GameData[] = [];

        if (importedData.apiVersion !== this.apiVersion) {
            throw new InvalidApiVersionError(this.apiVersion, importedData.apiVersion);
        }

        for (let i = 0; i < importedData.data.length; i++) {
            const exportableGameStats: ExportableGameStats = importedData.data[i];

            const gameData: GameData = {
                apiVersion: this.apiVersion,
                appId: exportableGameStats.appId,
                platform: exportableGameStats.platform,
                schema: await getGameSchema(
                    this.achievementWatcherRootPath,
                    exportableGameStats.appId,
                    exportableGameStats.platform,
                    this.systemLanguage
                ),
                stats: {
                    sources: exportableGameStats.stats.sources,
                    playtime: exportableGameStats.stats.playtime
                }
            };

            gameDataCollection.push(gameData);
        }

        return gameDataCollection;
    }
}