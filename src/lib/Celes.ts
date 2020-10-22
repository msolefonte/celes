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
    InvalidApiVersionError,
    WrongSourceDetectedError
} from './utils/Errors';
import {AchievementsScraper} from './plugins/utils/AchievementsScraper';
import {CelesDbConnector} from './utils/CelesDbConnector';
import {CelesMutex} from './utils/CelesMutex';
import {Merger} from './utils/Merger';
import {promises as fs} from 'fs';
import {getGameSchema} from './utils/utils';
import mkdirp from 'mkdirp';

class Celes {
    private static generateScrapError(error: Error, pluginName?: string, platform?: Platform, source?: Source, appId?: string): ScrapError {
        const scrapError: ScrapError = {
            message: error.message,
            type: error.constructor.name
        }

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

    private readonly achievementWatcherRootPath: string;
    private readonly additionalFoldersToScan: string[];
    private readonly enabledPlugins: string[];
    private readonly celesMutex: CelesMutex;
    private readonly steamPluginMode: 0 | 1 | 2;
    private readonly systemLanguage: string;
    private readonly useOldestUnlockTime: boolean;

    private readonly apiVersion: string = 'v1';

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
     * @param callbackProgress
     */
    async pull(callbackProgress?: (progress: number) => void): Promise<ScrapResult> {
        let mergedData: GameData[] = [];

        const celesDbConnector = new CelesDbConnector(this.achievementWatcherRootPath);
        const scrapResult: ScrapResult = await this.scrap(50, 0, callbackProgress);
        const scrapedData: GameData[] = scrapResult.data;

        const lockId: number = await this.celesMutex.lock();
        try {
            const databaseData: GameData[] = await celesDbConnector.getAll(this.systemLanguage, callbackProgress, 50, 50);
            mergedData = Merger.mergeGameDataCollections([scrapedData, databaseData], this.useOldestUnlockTime);
            await celesDbConnector.updateAll(mergedData);
        } finally {
            this.celesMutex.unlock(lockId);
        }

        const result: ScrapResult = {
            data: mergedData
        }

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
     * @param callbackProgress
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
     * @param filePath
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
     * @param filePath
     * @param force
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
                newData = Merger.mergeGameDataCollections([localData, newData], this.useOldestUnlockTime);
            }

            await celesDbConnector.updateAll(newData);
        } finally {
            this.celesMutex.unlock(lockId);
        }

        return newData;
    }

    async setAchievementUnlockTime(appId: string, source: Source, platform: Platform, achievementId: string, unlockTime: number): Promise<void> {
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

    private async scrap(maxProgress: number, baseProgress: number, callbackProgress?: (progress: number) => void): Promise<ScrapResult> {
        const gameDataCollection: GameData[] = [];
        const scrapErrors: ScrapError[] = [];

        for (let i = 0; i < this.enabledPlugins.length; i++) {
            try {
                const plugin = await import('./plugins/' + this.enabledPlugins[i]);
                let scraper: AchievementsScraper
                if (this.enabledPlugins[i] === 'Steam') {
                    scraper = new plugin[Object.keys(plugin)[0]](this.achievementWatcherRootPath, this.steamPluginMode);
                } else {
                    scraper = new plugin[Object.keys(plugin)[0]](this.achievementWatcherRootPath);
                }

                const platform: Platform = scraper.getPlatform();
                const source: Source = scraper.getSource();
                const listOfGames: ScanResult[] = await scraper.scan(this.additionalFoldersToScan);

                for (let j = 0; j < listOfGames.length; j++) {
                    const progressPercentage: number = baseProgress + Math.floor(((i + 1) / this.enabledPlugins.length) * ((j + 1) / listOfGames.length) * maxProgress);
                    let gameSchema: GameSchema;
                    let activeAchievements: UnlockedOrInProgressAchievement[];

                    try {
                        gameSchema = await scraper.getGameSchema(listOfGames[j].appId, this.systemLanguage);
                    } catch (error) {
                        // if (!(error instanceof InternalError)) { // TODO ADD BLACKLISTED I.E. 17515
                        //     scrapErrors.push(Celes.generateScrapError(error, undefined, platform, source, listOfGames[j].appId));
                        // }
                        scrapErrors.push(Celes.generateScrapError(error, undefined, platform, source, listOfGames[j].appId));
                        continue;
                    }

                    try {
                        activeAchievements = await scraper.getUnlockedOrInProgressAchievements(listOfGames[j]);
                    } catch (error) {
                        if (!(error instanceof WrongSourceDetectedError)) {
                            scrapErrors.push(Celes.generateScrapError(error, undefined, platform, source, listOfGames[j].appId));
                        }
                        continue;
                    }

                    const gameData: GameData = {
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

                    gameDataCollection.push(gameData);

                    if (typeof callbackProgress === 'function') {
                        callbackProgress(progressPercentage);
                    }
                }
            } catch (error) {
                scrapErrors.push(Celes.generateScrapError(error, this.enabledPlugins[i]));
            }

            if (typeof callbackProgress === 'function') {
                callbackProgress(baseProgress + maxProgress);
            }
        }

        const scrapResult: ScrapResult = {
            data: gameDataCollection
        }

        if (scrapErrors.length > 0) {
            scrapResult.error = scrapErrors;
        }

        return scrapResult;
    }

    
}

export {Celes};