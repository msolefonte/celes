'use strict';

import * as path from 'path';
import {
    ExportableGameStats,
    ExportableGameStatsCollection,
    GameData,
    GameSchema,
    Platform,
    ScanResult,
    ScrapError, ScrapResult,
    Source,
    UnlockedOrInProgressAchievement
} from '../types';
import {
    FileNotFoundError,
    InvalidApiVersionError
} from './utils/Errors';
import {AchievementsScraper} from './plugins/utils/AchievementsScraper';
import {CelesDbConnector} from './utils/CelesDbConnector';
import {CelesMutex} from './utils/CelesMutex';
import {Merger} from './utils/Merger';
import {promises as fs} from 'fs';
import {getGameSchema} from './utils/utils';
import mkdirp from 'mkdirp';

class Celes {
    private static generateScrapError(error: Error, pluginName?: string, platform?: Platform, source?: Source,
                                      appId?: string): ScrapError {
        const scrapError: ScrapError = {
            message: error.message,
            type: error.constructor.name
        };

        if (pluginName !== undefined) {
            scrapError.plugin = pluginName;
        }

        if (platform !== undefined) {
            scrapError.platform = platform;
        }

        if (source !== undefined) {
            scrapError.source = source;
        }

        if (appId !== undefined) {
            scrapError.appId = appId;
        }

        return scrapError;
    }

    private static generateScrapResult(gameDataCollection: GameData[], scrapErrors: ScrapError[]): ScrapResult {
        const scrapResult: ScrapResult = {
            data: gameDataCollection
        };

        if (scrapErrors.length > 0) {
            scrapResult.error = scrapErrors;
        }

        return scrapResult;
    }

    private readonly achievementWatcherRootPath: string;
    private readonly additionalFoldersToScan: string[];
    private readonly enabledPlugins: string[];
    private readonly celesMutex: CelesMutex;
    private readonly steamPluginMode: 0 | 1 | 2;
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
            'Reloaded',
            'Skidrow',
            'Steam',
            'SSE'
        ],
        steamPluginMode: 0 | 1 | 2 = 0,
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
        const scrapResult: ScrapResult = await this.scrap(50, 0, callbackProgress);
        const scrapedData: GameData[] = scrapResult.data;

        const lockId: number = await this.celesMutex.lock();
        try {
            const databaseData: GameData[] = await celesDbConnector.getAll(this.systemLanguage, callbackProgress,
                50, 50);
            mergedData = Merger.mergeGameDataCollections([scrapedData, databaseData],
                this.useOldestUnlockTime);
            await celesDbConnector.updateAll(mergedData);
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

        await mkdirp(path.dirname(filePath));
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

            newData.push(gameData);
        }

        const lockId: number = await this.celesMutex.lock();
        try {
            if (!force) {
                const localData: GameData[] = await celesDbConnector.getAll(this.systemLanguage);
                newData = Merger.mergeGameDataCollections([localData, newData],
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
            sourcesForTag: for (let i = 0; i < gameData.stats.sources.length; i++) {
                if (gameData.stats.sources[i].source === source) {
                    for (let j = 0; j < gameData.stats.sources[i].achievements.active.length; j++) {
                        if (gameData.stats.sources[i].achievements.active[j].name === achievementId) {
                            gameData.stats.sources[i].achievements.active[j].unlockTime = unlockTime;
                            continue sourcesForTag;
                        }
                    }
                }
            }
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

    private generateGameData(gameSchema: GameSchema, source: Source,
                             activeAchievements: UnlockedOrInProgressAchievement[]): GameData {
        return {
            apiVersion: this.apiVersion,
            appId: gameSchema.appId,
            platform: gameSchema.platform,
            schema: {
                name: gameSchema.name,
                img: gameSchema.img,
                achievements: gameSchema.achievement
            },
            stats: {
                sources: [
                    {
                        source: source,
                        achievements: {
                            active: activeAchievements
                        }
                    }
                ],
                playtime: 0
            }
        };
    }

    private async scrapPluginGame(scraper: AchievementsScraper, scanResult: ScanResult, pluginsProgress: number,
                                  gamesProgress: number, maxProgress: number, baseProgress: number, callbackProgress?: (progress: number) => void
    ): Promise<GameData | ScrapError> {
        const platform: Platform = scraper.getPlatform();
        const source: Source = scraper.getSource();
        let gameSchema: GameSchema;
        let activeAchievements: UnlockedOrInProgressAchievement[];

        try {
            gameSchema = await scraper.getGameSchema(scanResult.appId, this.systemLanguage);
        } catch (error) {
            // if (!(error instanceof InternalError)) { // TODO ADD BLACKLISTED I.E. 17515
            //     scrapErrors.push(Celes.generateScrapError(error, undefined, platform, source, listOfGames[j].appId));
            // }
            return Celes.generateScrapError(error, undefined, platform, source, scanResult.appId);
        }

        try {
            activeAchievements = await scraper.getUnlockedOrInProgressAchievements(scanResult);

            typeof callbackProgress === 'function' && callbackProgress(baseProgress +
                Math.floor((pluginsProgress * gamesProgress * maxProgress)));
            return this.generateGameData(gameSchema, source, activeAchievements);
        } catch (error) {
            return Celes.generateScrapError(error, undefined, platform, source, scanResult.appId);
        }
    }

    private async scrapPlugin(pluginName: string, pluginsProgress: number, maxProgress: number, baseProgress: number,
                              callbackProgress?: (progress: number) => void): Promise<ScrapResult> {
        const gameDataCollection: GameData[] = [];
        const scrapErrors: ScrapError[] = [];

        const plugin = await import('./plugins/' + pluginName);
        let scraper: AchievementsScraper;
        if (pluginName === 'Steam') {
            scraper = new plugin[Object.keys(plugin)[0]](this.achievementWatcherRootPath, this.steamPluginMode);
        } else {
            scraper = new plugin[Object.keys(plugin)[0]](this.achievementWatcherRootPath);
        }
        const listOfGames: ScanResult[] = await scraper.scan(this.additionalFoldersToScan);

        for (let j = 0; j < listOfGames.length; j++) {
            const scrapGameResult: GameData | ScrapError = await this.scrapPluginGame(scraper, listOfGames[j],
                pluginsProgress,(j + 1) / listOfGames.length, maxProgress, baseProgress, callbackProgress);

            if ('apiVersion' in scrapGameResult && scrapGameResult.apiVersion !== undefined) {
                gameDataCollection.push(scrapGameResult);
            } else {
                if ((<ScrapError>scrapGameResult).type !== 'WrongSourceDetectedError') {
                    scrapErrors.push(<ScrapError>scrapGameResult);
                }
            }
        }

        return Celes.generateScrapResult(gameDataCollection, scrapErrors);
    }

    private async scrap(maxProgress: number, baseProgress: number, callbackProgress?: (progress: number) => void):
        Promise<ScrapResult> {
        let gameDataCollection: GameData[] = [];
        let scrapErrors: ScrapError[] = [];

        for (let i = 0; i < this.enabledPlugins.length; i++) {
            try {
                const pluginScrapResult: ScrapResult = await this.scrapPlugin(this.enabledPlugins[i],
                    (i + 1) / this.enabledPlugins.length, maxProgress, baseProgress, callbackProgress);
                gameDataCollection = gameDataCollection.concat(pluginScrapResult.data);
                if (pluginScrapResult.error !== undefined) {
                    scrapErrors = scrapErrors.concat(pluginScrapResult.error);
                }
            } catch (error) {
                scrapErrors.push(Celes.generateScrapError(error, this.enabledPlugins[i]));
            }

            if (typeof callbackProgress === 'function') {
                callbackProgress(baseProgress + maxProgress);
            }
        }
        return Celes.generateScrapResult(gameDataCollection, scrapErrors);
    }
}

export {Celes};