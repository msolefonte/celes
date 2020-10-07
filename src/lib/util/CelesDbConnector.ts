const fs = require('fs').promises;
const path = require('path');
import {GameData, GameStats, Platform, Source} from '../../types';
import {getGameSchema} from './utils';

const mkdirp = require('mkdirp');

/**
 * Important note: CelesDb is not prepared to prevent concurrency problems. This may be addressed in the future but it
 * is not a priority right now.
 */
class CelesDb {
    private readonly achievementWatcherRootPath: string = path.join(<string>process.env['APPDATA'], 'Achievement Watcher');
    private readonly apiVersion: string = "v1";
    private readonly celesDatabasePath: string = path.join(this.achievementWatcherRootPath, 'celes/db/');
    private readonly systemLanguage: string;

    constructor(systemLanguage: string) {
        this.systemLanguage = systemLanguage;
    }

    async pull(callbackProgress?: Function, maxProgress: number = 100): Promise<GameData[]> {
        const gameDataCollection: GameData[] = [];

        try {
            const localDatabasePlatforms: string[] = await fs.readdir(this.celesDatabasePath);

            for (let i = 0; i < localDatabasePlatforms.length; i++) {
                const platformGames: string[] = await fs.readdir(path.join(this.celesDatabasePath, localDatabasePlatforms[i]));

                for (let j = 0; j < platformGames.length; j++) {
                    const progressPercentage: number = Math.floor(((i + 1) / localDatabasePlatforms.length) * ((j + 1) / platformGames.length) * maxProgress);
                    const gameName: string = platformGames[j];
                    const gameStats: GameStats = JSON.parse(
                        await fs.readFile(path.join(this.celesDatabasePath, localDatabasePlatforms[i] + '/' + gameName))
                    );

                    if (gameStats.apiVersion !== this.apiVersion) {
                        console.warn("Config version not valid. Expected " + this.apiVersion + ", found " + gameStats.apiVersion + ".");
                    }

                    const gameData: GameData = {
                        apiVersion: this.apiVersion,
                        appid: gameStats.appid,
                        platform: <Platform>localDatabasePlatforms[i],
                        schema: await getGameSchema(gameStats.appid, <Platform>localDatabasePlatforms[i], this.systemLanguage),
                        stats: {
                            sources: gameStats.sources,
                            playtime: gameStats.playtime
                        }
                    }

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

    async push(gameData: GameData[]): Promise<void> {
        try {
            await mkdirp(this.celesDatabasePath);

            for (let i = 0; i < gameData.length; i++) {
                const gamePlatform: Platform = gameData[i].platform;
                const gameStats: GameStats = {
                    apiVersion: this.apiVersion,
                    appid: gameData[i].appid,
                    sources: gameData[i].stats.sources,
                    playtime: gameData[i].stats.playtime
                };

                await mkdirp(path.join(this.celesDatabasePath, gamePlatform + '/'));
                await fs.writeFile(path.join(this.celesDatabasePath, gamePlatform + '/' + gameData[i].appid + '.json'), JSON.stringify(gameStats));
            }
        } catch (error) {
            console.debug(error);
        }
    }
}

export {CelesDb};