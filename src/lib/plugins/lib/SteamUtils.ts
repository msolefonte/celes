import {IGameSchema} from '../../../types';

const got = require('got');
const regedit = require('regodit');
const sse = require('../../util/sse');
const path = require('path');
const normalize = require('normalize-path');
const ini = require('ini');
const fs = require('fs').promises;
const existsAndIsYoungerThan = require('./Common').existsAndIsYoungerThan;

class SteamUtils {
    private static readonly achievementWatcherRootPath: string = path.join(<string>process.env['APPDATA'],
        'Achievement Watcher');

    static async getGameSchemaFromCache(gameCachePath: string): Promise<IGameSchema> {
        return JSON.parse(await fs.readFile(gameCachePath));
    }

    static async getGameSchemaFromServer(appId: string, lang: string, source: string): Promise<IGameSchema> {
        const url = `https://api.xan105.com/steam/ach/${appId}?lang=${lang}`;
        const response = (await got(url)).body;

        const gameData: any = JSON.parse(response).data;

        gameData.platform = "Steam";
        gameData.source = source;

        return <IGameSchema>gameData;
    }

    static async updateGameSchemaCache(gameCachePath: string, gameData: IGameSchema): Promise<void> {
        await fs.writeFile(gameCachePath, JSON.stringify(gameData, null, 2));
    }

    static async validSteamGameSchemaCacheExists(gameCachePath: string): Promise<boolean> {
        return await existsAndIsYoungerThan(gameCachePath, {timeUnit: 'month', time: 1});
    }

    static getGameCachePath(appId: string, language: string): string {
        const cachePath: string = path.join(SteamUtils.achievementWatcherRootPath, 'steam_cache/schema', language);
        return path.join(`${cachePath}`, `${appId}.db`);
    }

    static async getFoldersToScan(specificFolders: string[], additionalFolders: string[]): Promise<string[]> {
        let foldersToScan: string[] = specificFolders;

        const DocsFolderPath: string = await regedit.promises.RegQueryStringValue('HKCU',
            'Software/Microsoft/Windows/CurrentVersion/Explorer/User Shell Folders', 'Personal');
        if (DocsFolderPath) {
            foldersToScan = foldersToScan.concat([
                path.join(DocsFolderPath, 'Skidrow')
            ]);
        }

        if (additionalFolders.length > 0) {
            foldersToScan = foldersToScan.concat(additionalFolders);
        }

        foldersToScan = foldersToScan.map((dir) => {
            return normalize(dir) + '/([0-9]+)';
        });

        return foldersToScan;
    }

    static async getAchievementListFromGameFolder(gameFolder: string) {
        const achievementLocationFiles: string[] = [
            'achievements.ini',
            'achievements.json',
            'achiev.ini',
            'stats.ini',
            'Achievements.Bin',
            'achieve.dat',
            'Achievements.ini',
            'stats/achievements.ini',
            'stats.bin',
            'stats/CreamAPI.Achievements.cfg'
        ];

        let local: any;
        for (const file of achievementLocationFiles) {
            try {
                const achievementFile: string = path.join(gameFolder, file);
                if (path.parse(file).ext == '.json') {
                    local = JSON.parse(await fs.readFile(achievementFile, 'utf8'));
                } else if (file === 'stats.bin') {
                    local = sse.parse(await fs.readFile(achievementFile));
                } else {
                    local = ini.parse(await fs.readFile(achievementFile, 'utf8'));
                }
                break;
            } catch (e) {
                // TODO ADD DEBUG VERBOSE
                // console.debug(e);
            }
        }
        if (!local) {
            // TODO ADD PROPER LOGGER
            // console.debug(`No achievement files found in '${gameFolder}'`);
            local = {}
        }

        return local;
    }
}

export {
    SteamUtils
};
