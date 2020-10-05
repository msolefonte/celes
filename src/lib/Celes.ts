'use strict';

import {
    IExportableGameData,
    IExportableUnlockedAchievements,
    IGameMetadata,
    IGameSchema,
    IUnlockedAchievement
} from '../types';
import {AchievementsScraper} from './plugins/lib/AchievementsScraper';
import plugins from './plugins/plugins.json';

const fs = require('fs').promises;
const mkdirp = require('mkdirp');
const path = require('path');

class Celes {
    private readonly additionalFoldersToScan: string[];
    private readonly ignoreSourceAtMerge: boolean;
    private readonly systemLanguage: string;
    private readonly useOldestUnlockTime: boolean;

    private readonly achievementWatcherRootPath: string = path.join(<string>process.env['APPDATA'], 'Achievement Watcher');
    private readonly celesDatabasePath: string = path.join(this.achievementWatcherRootPath, 'celes/db/');

    constructor(
        additionalFoldersToScan: string[] = [],
        systemLanguage = 'english',
        ignoreSourceAtMerge = true,
        useOldestUnlockTime = true
    ) {
        this.additionalFoldersToScan = additionalFoldersToScan;
        this.ignoreSourceAtMerge = ignoreSourceAtMerge;
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
    async pull(callbackProgress?: Function): Promise<IExportableGameData[]> {
        const databaseData: IExportableGameData[] = await this.loadLocalDatabase(callbackProgress, 50);
        const scrappedData: IExportableGameData[] = await this.scrapGameDataFromLocalFolders(callbackProgress, 50, 50);

        const mergedData: IExportableGameData[] = this.mergeExportableGameData(scrappedData, databaseData);
        await this.updateLocalDatabase(mergedData);

        return mergedData;
    }

    /**
     * Obtains the list of unlocked achievements by scrapping the local filesystem. Fast and useful to detect changes.
     *
     * @param callbackProgress
     */
    async scrap(callbackProgress?: Function): Promise<IExportableUnlockedAchievements[]> {
        return this.scrapUnlockedAchievementsFromLocalFolders(callbackProgress, 100);
    }

    /**
     * Reads the local database and return the stored collection of games, formed by schemas and unlocked achievements.
     *
     * Note that this call does not detect any filesystem changes.
     *
     * @param callbackProgress
     */
    async load(callbackProgress?: Function): Promise<IExportableGameData[]> {
        return this.loadLocalDatabase(callbackProgress, 100);
    }

    // TODO STORE ONLY UNLOCKED ACHIEVEMENTS NOT GAME DATA
    // TODO ADD VERSION
    /**
     * Reads the local database and stores the list of unlocked achievements into a defined path.
     *
     * Note that schemas are not exported.
     *
     * @param filePath
     */
    async export(filePath: string): Promise<void> {
        const exportableGameData: IExportableGameData[] = await this.load();

        await mkdirp(path.dirname(filePath));
        await fs.writeFile(filePath, JSON.stringify(exportableGameData, undefined, 2));
    }

    // TODO LOAD ONLY UNLOCKED ACHIEVEMENTS NOT GAME DATA
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
    async import(filePath: string, force = false): Promise<IExportableGameData[]> {
        const importedData: IExportableGameData[] = await JSON.parse(await fs.readFile(filePath));

        let newData: IExportableGameData[] = importedData;
        if (!force) {
            const localData: IExportableGameData[] = await this.loadLocalDatabase();
            newData = this.mergeExportableGameData(localData, importedData);
        }

        await this.updateLocalDatabase(newData);
        return newData;
    }

    private mergeUnlockedAchievements(ua1: IUnlockedAchievement[], ua2: IUnlockedAchievement[]): IUnlockedAchievement[] {
        const mergedUnlockedAchievements: { [key: string]: IUnlockedAchievement } = {};

        for (let k = 0; k < ua1.length; k++) {
            mergedUnlockedAchievements[ua1[k].name] = ua1[k];
        }

        for (let j = 0; j < ua2.length; j++) {
            if (!(ua2[j].name in mergedUnlockedAchievements)) {
                mergedUnlockedAchievements[ua2[j].name] = ua2[j];
            } else {
                if (ua2[j].currentProgress > mergedUnlockedAchievements[ua2[j].name].currentProgress) {
                    mergedUnlockedAchievements[ua2[j].name] = ua2[j];
                } else if (this.useOldestUnlockTime) {
                    if (ua2[j].unlockTime < mergedUnlockedAchievements[ua2[j].name].unlockTime) {
                        mergedUnlockedAchievements[ua2[j].name] = ua2[j];
                    }
                } else {
                    if (ua2[j].unlockTime > mergedUnlockedAchievements[ua2[j].name].unlockTime) {
                        mergedUnlockedAchievements[ua2[j].name] = ua2[j];
                    }
                }
            }
        }

        return Object.keys(mergedUnlockedAchievements).map(function (name) {
            return mergedUnlockedAchievements[name];
        });
    }

    private mergeExportableGameData(egd1: IExportableGameData[], egd2: IExportableGameData[]): IExportableGameData[] {
        const mergedGames: { [key: string]: IExportableGameData } = {};

        for (let i = 0; i < egd1.length; i++) {
            let sortKey: string = egd1[i].appid + egd1[i].platform;
            if (!this.ignoreSourceAtMerge) {
                sortKey += egd1[i].source;
            }

            mergedGames[sortKey] = egd1[i];
        }

        for (let j = 0; j < egd2.length; j++) {
            let sortKey: string = egd2[j].appid + egd2[j].platform;
            if (!this.ignoreSourceAtMerge) {
                sortKey += egd2[j].source;
            }

            if (!(sortKey in mergedGames)) {
                mergedGames[sortKey] = egd2[j];
            } else {
                if (egd2[j].achievement.total > mergedGames[sortKey].achievement.total) {
                    mergedGames[sortKey].achievement.total = egd2[j].achievement.total;
                    mergedGames[sortKey].achievement.list = egd2[j].achievement.list;
                }

                mergedGames[sortKey].achievement.unlocked = this.mergeUnlockedAchievements(
                    mergedGames[sortKey].achievement.unlocked,
                    egd2[j].achievement.unlocked
                );
            }
        }

        return Object.keys(mergedGames).map(function (appId: string) {
            return mergedGames[appId];
        });
    }

    // TODO THIS METHOD AND scrapUnlockedAchievementsFromLocalFolders ARE TOO SIMILAR
    private async scrapGameDataFromLocalFolders(callbackProgress?: Function, maxProgress = 100, baseProgress = 0): Promise<IExportableGameData[]> {
        const exportableGames: IExportableGameData[] = [];

        for (let i = 0; i < plugins.length; i++) {
            const progressPercentage: number = baseProgress + Math.floor((i / plugins.length) * maxProgress);

            try {
                const plugin = require('./plugins/' + plugins[i]);
                const scraper: AchievementsScraper = new plugin[Object.keys(plugin)[0]]();

                const listOfGames: IGameMetadata[] = await scraper.scan(this.additionalFoldersToScan);

                for (let j = 0; j < listOfGames.length; j++) {
                    const gameSchema: IGameSchema = await scraper.getGameSchema(listOfGames[j].appId, this.systemLanguage);
                    const unlockedAchievements: IUnlockedAchievement[] = await scraper.getUnlockedAchievements(listOfGames[j]);

                    const exportableGameDataSkeleton: any = gameSchema;
                    exportableGameDataSkeleton.achievement.unlocked = unlockedAchievements;

                    const exportableGameData: IExportableGameData = exportableGameDataSkeleton;

                    exportableGames.push(exportableGameData);
                }
            } catch (error) {
                console.debug('DEBUG: Error loading plugin', plugins[i] + ':', error);
            }

            if (callbackProgress instanceof Function) {
                callbackProgress(progressPercentage);
            }
        }

        return exportableGames;
    }

    // TODO THIS METHOD AND scrapGameDataFromLocalFolders ARE TOO SIMILAR
    private async scrapUnlockedAchievementsFromLocalFolders(callbackProgress?: Function, maxProgress = 100, baseProgress = 0): Promise<IExportableUnlockedAchievements[]> {
        const exportableUnlockedAchievementsCollection: IExportableUnlockedAchievements[] = [];

        for (let i = 0; i < plugins.length; i++) {
            const progressPercentage: number = baseProgress + Math.floor((i / plugins.length) * maxProgress);

            try {
                const plugin = require('./plugins/' + plugins[i]);
                const scraper: AchievementsScraper = new plugin[Object.keys(plugin)[0]]();

                const listOfGames: IGameMetadata[] = await scraper.scan(this.additionalFoldersToScan);

                for (let j = 0; j < listOfGames.length; j++) {
                    const unlockedAchievements: IUnlockedAchievement[] = await scraper.getUnlockedAchievements(listOfGames[j]);
                    const exportableUnlockedAchievements: IExportableUnlockedAchievements = {
                        appid: listOfGames[j].appId,
                        source: listOfGames[j].source,
                        platform: listOfGames[j].platform,
                        unlockedAchievements: unlockedAchievements
                    };

                    exportableUnlockedAchievementsCollection.push(exportableUnlockedAchievements);
                }
            } catch (error) {
                console.debug('DEBUG: Error loading plugin', plugins[i] + ':', error);
            }

            if (callbackProgress instanceof Function) {
                callbackProgress(progressPercentage);
            }
        }

        return exportableUnlockedAchievementsCollection;
    }

    // TODO SEPARE SCHEMAS AND ACHIEVEMENTS
    private async loadLocalDatabase(callbackProgress?: Function, maxProgress = 100): Promise<IExportableGameData[]> {
        const localData: IExportableGameData[] = [];

        try {
            const localDatabaseFiles: string[] = await fs.readdir(this.celesDatabasePath);

            for (let i = 0; i < localDatabaseFiles.length; i++) {
                const progressPercentage: number = Math.floor((i / localDatabaseFiles.length) * maxProgress);

                try {
                    const localGameData: IExportableGameData = JSON.parse(await fs.readFile(this.celesDatabasePath + localDatabaseFiles[i]));
                    localData.push(localGameData);
                } catch (error) {
                    console.debug('DEBUG: Error loading local database', localDatabaseFiles[i] + ':', error);
                }

                if (callbackProgress instanceof Function) {
                    callbackProgress(progressPercentage);
                }
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.debug('DEBUG: Local database does not exist');
            } else {
                console.debug('DEBUG: Error loading local database:', error);
            }
        }

        return localData;
    }

    // TODO SEPARE SCHEMAS AND ACHIEVEMENTS
    private async updateLocalDatabase(gameData: IExportableGameData[]): Promise<void> {
        try {
            await mkdirp(this.celesDatabasePath);

            for (let i = 0; i < gameData.length; i++) {
                await fs.writeFile(path.join(this.celesDatabasePath, gameData[i].appid + '.json'), JSON.stringify(gameData[i]));
            }
        } catch (error) {
            console.debug(error);
        }
    }
}

export {Celes};