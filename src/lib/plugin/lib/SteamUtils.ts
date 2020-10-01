import {IGameData} from '../../../types';

const got = require('got');
const regedit = require('regodit');
const sse = require('../../util/sse');
const path = require('path');
const normalize = require('normalize-path');
const ini = require('ini');
const fs = require('fs').promises;
const Common = require('Common')

// const htmlParser = require('node-html-parser').parse;

class SteamUtils {
    private static readonly achievementWatcherRootPath: string = path.join(<string>process.env['APPDATA'],
        'Achievement Watcher');

    static async getGameDataFromCache(gameCachePath: string): Promise<IGameData> {
        return JSON.parse(await fs.readFile(gameCachePath));
    }

    static async getGameDataFromServer(appId: string, lang: string, source: string): Promise<IGameData> {
        const url = `https://api.xan105.com/steam/ach/${appId}?lang=${lang}`;
        const response = (await got(url)).body;

        const gameData: any = JSON.parse(response).data;

        gameData.platform = "Steam";
        gameData.source = source;

        return <IGameData>gameData;
    }

    // TODO DEBATE WITH ANTHONY
    // static async getGameDataUsingOwnApiKey(appId: string, lang: string, key: string): Promise<IGameData> {
    //     const url = {
    //         api: `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v0002/?key=${key}&appid=${appId}&l=${lang}&format=json`,
    //         store: `https://store.steampowered.com/api/appdetails?appids=${appId}`
    //     };
    //
    //     return new Promise((resolve, reject) => {
    //
    //         Promise.all([request.getJson(url.api), request.getJson(url.store, {headers: {'Accept-Language': 'en-US;q=1.0'}}), this.scrapSteamDb(appId)]).then(function (data) {
    //
    //             try {
    //
    //                 let schema = data[0].game.availableGameStats;
    //                 let appdetail = data[1][appId].data;
    //                 let steamdb = data[2];
    //
    //                 let result = {
    //                     name: (data[1][appId].success) ? appdetail.name : steamdb.name, //If the game is no longer available in the store fallback to steamdb
    //                     appid: appId,
    //                     binary: path.parse(steamdb.binary).base,
    //                     img: {
    //                         header: (data[1][appId].success) ? appdetail.header_image.split('?')[0] : steamdb.header, //If the game is no longer available in the store fallback to steamdb
    //                         background: (data[1][appId].success) ? appdetail.background.split('?')[0] : null,
    //                         icon: steamdb.icon
    //                     },
    //                     achievement: {
    //                         total: schema.achievements.length,
    //                         list: schema.achievements
    //                     }
    //                 };
    //
    //                 return resolve(result);
    //
    //             } catch (err) {
    //                 return reject(err);
    //             }
    //
    //         }).catch((err) => {
    //             return reject(err);
    //         });
    //     });
    // }

    static async updateGameDataCache(gameCachePath: string, gameData: IGameData): Promise<void> {
        await fs.writeFile(gameCachePath, JSON.stringify(gameData, null, 2));
    }

    static async validSteamGameDataCacheExists(gameCachePath: string): Promise<boolean> {
        return await Common.existsAndIsYoungerThan(gameCachePath, {timeUnit: 'month', time: 1});
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
        for (let file of achievementLocationFiles) {
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

    // TODO DEBATE WITH ANTHONY
    // Note this one does not work anymore
    // private static async scrapSteamDb(appId: string): Promise<ISteamDbData> {
    //     const url = `https://steamdb.info/app/${appId}/`
    //
    //     const response = await got(url);
    //     const html = htmlParser(response.body);
    //
    //     const binaries = html.querySelector('#config table tbody').innerHTML.split('</tr>\n<tr>').map((tr: string) => {
    //         const data = tr.split('</td>\n');
    //
    //         return <ISteamDbBinary>{
    //             executable: data[1].replace(/<\/?[^>]+>/gi, '').replace(/[\r\n]/g, ''),
    //             windows: data[4].includes(`aria-label="windows"`) || (!data[4].includes(`aria-label="macOS"`) && !data[4].includes(`aria-label="Linux"`)),
    //         };
    //     });
    //
    //     return <ISteamDbData>{
    //         binary: binaries.find((binary: ISteamDbBinary) => {
    //             return binary.windows
    //         }).executable.match(/([^\\\/:*?"<>|])+$/)[0],
    //         icon: html.querySelector('.app-icon.avatar').attributes.src,
    //         header: html.querySelector('.app-logo').attributes.src,
    //         name: html.querySelector('.css-truncate').innerHTML
    //     };
    // }
}

export {
    SteamUtils
};
