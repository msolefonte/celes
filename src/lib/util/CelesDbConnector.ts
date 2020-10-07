import * as path from 'path';
import {GameData, GameStats, Platform} from '../../types';
import {promises as fs} from 'fs';
import {getGameSchema} from './utils';
import mkdirp from 'mkdirp';

/**
 * Important note: CelesDb is not prepared to prevent concurrency problems. This has to be addressed where used.
 */
class CelesDbConnector {
    private static readonly achievementWatcherRootPath: string = path.join(<string>process.env['APPDATA'], 'Achievement Watcher');
    private static readonly apiVersion: string = 'v1';
    private static readonly celesDatabasePath: string = path.join(CelesDbConnector.achievementWatcherRootPath, 'celes/db/');

    static async getAll(schemaLanguage: string, callbackProgress?: (progress:number) => void, maxProgress = 100, baseProgress = 100): Promise<GameData[]> {
        const gameDataCollection: GameData[] = [];

        try {
            const localDatabasePlatforms: Platform[] = <Platform[]> await fs.readdir(CelesDbConnector.celesDatabasePath);

            for (let i = 0; i < localDatabasePlatforms.length; i++) {
                const platformGames: string[] = await fs.readdir(path.join(CelesDbConnector.celesDatabasePath, localDatabasePlatforms[i]));

                for (let j = 0; j < platformGames.length; j++) {
                    const progressPercentage: number = baseProgress + Math.floor(((i + 1) / localDatabasePlatforms.length) * ((j + 1) / platformGames.length) * maxProgress);
                    const gameData: GameData = await CelesDbConnector.getGame(platformGames[j], localDatabasePlatforms[i], schemaLanguage);

                    gameDataCollection.push(gameData);

                    if (callbackProgress instanceof Function) {
                        callbackProgress(progressPercentage);
                    }
                }
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.debug('Local database does not exist');
            } else {
                console.debug('Error loading local database:', error);
            }
        }

        return gameDataCollection;
    }

    static async updateAll(gameData: GameData[]): Promise<void> {
        try {
            await mkdirp(CelesDbConnector.celesDatabasePath);

            for (let i = 0; i < gameData.length; i++) {
                await CelesDbConnector.updateGame(gameData[i]);
            }
        } catch (error) {
            console.debug(error);
        }
    }

    static async getGame(appId: string, platform: Platform, schemaLanguage: string): Promise<GameData> {
        const gameStats: GameStats = JSON.parse(
            await fs.readFile(path.join(CelesDbConnector.celesDatabasePath, platform + '/' + appId), 'utf8')
        );

        if (gameStats.apiVersion !== CelesDbConnector.apiVersion) {
            throw new Error('API version not valid. Expected ' + CelesDbConnector.apiVersion + ', found ' + gameStats.apiVersion + '.');
        }

        return <GameData> {
            apiVersion: CelesDbConnector.apiVersion,
            appid: gameStats.appid,
            platform: platform,
            schema: await getGameSchema(gameStats.appid, platform, schemaLanguage),
            stats: {
                sources: gameStats.sources,
                playtime: gameStats.playtime
            }
        }
    }

    static async updateGame(gameData: GameData): Promise<void> {
        const gamePlatform: Platform = gameData.platform;
        const gameStats: GameStats = {
            apiVersion: CelesDbConnector.apiVersion,
            appid: gameData.appid,
            sources: gameData.stats.sources,
            playtime: gameData.stats.playtime
        };

        await mkdirp(path.join(CelesDbConnector.celesDatabasePath, gamePlatform + '/'));
        await fs.writeFile(path.join(CelesDbConnector.celesDatabasePath, gamePlatform + '/' + gameData.appid + '.json'), JSON.stringify(gameStats));
    }
}

export {CelesDbConnector};