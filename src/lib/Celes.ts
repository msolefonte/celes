import {IGameData, IGameMetadata, IExportableGameData, IUnlockedAchievement} from '../types';
import {Parser} from './plugin/lib/Parser';

const path = require('path');
const fs = require('fs').promises;

class Celes {
    private readonly systemLanguage: string;

    constructor(systemLanguage: string = 'english') {
        this.systemLanguage = systemLanguage;
    }

    async scrap(callbackProgress?: Function): Promise<IExportableGameData[]> {
        const pluginsFolder = path.join(__dirname, 'plugin');
        const exportableGames: IExportableGameData[] = [];

        const pluginsFolderFiles: string[] = await fs.readdir(pluginsFolder);
        for (let i = 0; i < pluginsFolderFiles.length; i++) {
            const progressPercentage: number = Math.floor((i / pluginsFolderFiles.length) * 100);

            try {
                if (pluginsFolderFiles[i].endsWith('.js')) {
                    const plugin = require('./plugin/' + pluginsFolderFiles[i]);
                    const parser: Parser = new plugin[Object.keys(plugin)[0]]();

                    const listOfGames: IGameMetadata[] = await parser.scan();

                    for (let j = 0; j < listOfGames.length; j++) {
                        const gameData: IGameData = await parser.getGameData(listOfGames[j].appId, this.systemLanguage);
                        const unlockedAchievements: IUnlockedAchievement[] = await parser.getAchievements(listOfGames[j]);

                        const exportableGameDataSkeleton: any = gameData;
                        exportableGameDataSkeleton.achievement.unlocked = unlockedAchievements;

                        const exportableGameData: IExportableGameData = exportableGameDataSkeleton;

                        exportableGames.push(exportableGameData);
                    }
                }
            } catch (error) {
                // console.debug('Error loading plugin', pluginsFolderFiles[i] + ":", error);
            }

            if (callbackProgress instanceof Function) {
                callbackProgress(progressPercentage);
            }
        }
        return exportableGames;
    }

    // Load Local Folder + Scrap. Merge. Update Folder with new data
    async load(callbackProgress?: Function) {
        // load local
        // scrap
        // merge
        // update local
    }

    // Load. Read Local Folder. Store it in path
    async export(path: string) {
        // load
        // a = load local
        // store a in path
    }

    // Read path. Read local. If not force, merge with local. Store local
    async import(path: string, force: boolean = false) {
        // a = read path
        // if not force
            // b = load local
            // c = merge(a, b)
            // store c in path
        // else
            // store a in path
    }
}

export {Celes}