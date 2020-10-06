'use strict';

import {
    GameData,
    ScanResult,
    GameSchema,
    GameStats,
    UnlockedOrInProgressAchievement,
    Platform,
    Achievement,
    SourceStats, Source, ExportableGameStatsCollection
} from '../types';
import {AchievementsScraper} from './plugins/lib/AchievementsScraper';
import plugins from './plugins.json';

const path = require('path');
const {CelesDb} = require('./util/CelesDb');
const {Merger} = require('./util/Merger');

const mkdirp = require('mkdirp');
const fs = require('fs').promises;

class Celes {
    private readonly additionalFoldersToScan: string[];
    private readonly systemLanguage: string;
    private readonly useOldestUnlockTime: boolean;

    private readonly apiVersion: string = "v1";

    constructor(
        additionalFoldersToScan: string[] = [],
        systemLanguage: string = 'english',
        useOldestUnlockTime: boolean = true
    ) {
        this.additionalFoldersToScan = additionalFoldersToScan;
        this.systemLanguage = systemLanguage;
        this.useOldestUnlockTime = useOldestUnlockTime;
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
    async pull(callbackProgress?: (progress:number) => void): Promise<GameData[]> {
        const celesDb: typeof CelesDb = new CelesDb(this.systemLanguage);

        const databaseData: GameData[] = await celesDb.load(callbackProgress, 50);
        const scrappedData: GameData[] = await this.scrapGameData(callbackProgress, 50, 50);

        const mergedData: GameData[] = Merger.mergeGameDataCollections([scrappedData, databaseData]);
        await celesDb.update(mergedData);

        return mergedData;
    }

    /**
     * Reads the local database and return the stored collection of games, formed by schemas and unlocked achievements.
     *
     * Note that this call does not detect any filesystem changes.
     *
     * @param callbackProgress
     */
    async load(callbackProgress?: (progress:number) => void): Promise<GameData[]> {
        return new CelesDb(this.systemLanguage).load(callbackProgress, 100);
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
                    apiVersion: gameData.apiVersion,
                    appid: gameData.appid,
                    sources: gameData.stats.sources,
                    playtime: gameData.stats.playtime
                }
            })
        }

        await mkdirp(path.dirname(filePath));
        await fs.writeFile(filePath, JSON.stringify(exportableGameData));
    }

    // TODO LOAD ONLY GAME STATS NOT GAME DATA
    // TODO ADD VERSION
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
    async import(filePath: string, force: boolean = false): Promise<GameData[]> {
        const importedData: GameData[] = await JSON.parse(await fs.readFile(filePath));
        const celesDb: typeof CelesDb = new CelesDb(this.systemLanguage);

        let newData: GameData[] = importedData;
        if (!force) {
            const localData: GameData[] = await celesDb.load();
            newData = Merger.mergeGameDataCollections(localData, importedData);
        }

        await celesDb.update(newData);
        return newData;
    }

    private async scrapGameData(callbackProgress?: (progress:number) => void, maxProgress = 100, baseProgress = 0): Promise<GameData[]> {
        const gameDataCollection: GameData[] = [];

        for (let i = 0; i < plugins.length; i++) {
            const progressPercentage: number = baseProgress + Math.floor(((i + 1) / plugins.length) * maxProgress);

            try {
                const plugin = require('./plugins/' + plugins[i]);
                const scraper: AchievementsScraper = new plugin[Object.keys(plugin)[0]]();

                const listOfGames: ScanResult[] = await scraper.scan(this.additionalFoldersToScan);

                for (let j = 0; j < listOfGames.length; j++) {
                    const gameSchema: GameSchema = await scraper.getGameSchema(listOfGames[j].appId, this.systemLanguage);
                    const unlockedOrInProgressAchievements: UnlockedOrInProgressAchievement[] = await scraper.getUnlockedOrInProgressAchievements(listOfGames[j]);

                    const gameData: GameData = {
                        apiVersion: this.apiVersion,
                        appid: gameSchema.appid,
                        platform: gameSchema.platform,
                        schema: {
                            name: gameSchema.name,
                            img: gameSchema.img,
                            achievements: gameSchema.achievement
                        },
                        stats: {
                            sources: [
                                {
                                    source: scraper.getSource(),
                                    achievements: {
                                        active: unlockedOrInProgressAchievements
                                    }
                                }
                            ],
                            playtime: 0
                        }
                    }

                    gameDataCollection.push(gameData);
                }
            } catch (error) {
                console.debug('Error loading plugin', plugins[i] + ':', error);
            }

            if (typeof callbackProgress === 'function') {
                callbackProgress(progressPercentage);
            }
        }

        return gameDataCollection;
    }

    async setAchievementUnlockTime(appid: string, source: Source, platform: Platform, achievementId: string, unlockTime: number): Promise<void> {
        return;
    }

    async addGamePlayTime(appid: string, source: Source, playTime: number, force: boolean = false): Promise<void> {
        return;
    }
}

export {Celes};