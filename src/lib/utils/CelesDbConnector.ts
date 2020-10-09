import * as path from 'path';
import {GameData, GameStats, Platform} from '../../types';
import {promises as fs} from 'fs';
import {getGameSchema} from './utils';
import mkdirp from 'mkdirp';

/**
 * Important note: CelesDb is not prepared to prevent concurrency problems. This has to be addressed where used.
 */
class CelesDbConnector {
    private readonly apiVersion: string = 'v1';
    private readonly achievementWatcherRootPath: string;
    private readonly celesDatabasePath: string;

    constructor(achievementWatcherRootPath: string) {
        this.achievementWatcherRootPath = achievementWatcherRootPath;
        this.celesDatabasePath = path.join(achievementWatcherRootPath, 'celes/db/');
    }

    async getAll(schemaLanguage: string, callbackProgress?: (progress:number) => void, maxProgress = 100, baseProgress = 0): Promise<GameData[]> {
        const gameDataCollection: GameData[] = [];

        try {
            const localDatabasePlatforms: Platform[] = <Platform[]> await fs.readdir(this.celesDatabasePath);

            for (let i = 0; i < localDatabasePlatforms.length; i++) {
                const platformGames: string[] = await fs.readdir(path.join(this.celesDatabasePath, localDatabasePlatforms[i]));

                for (let j = 0; j < platformGames.length; j++) {
                    const appId = platformGames[j].split('.').slice(0, -1).join('.');

                    const progressPercentage: number = baseProgress + Math.floor(((i + 1) / localDatabasePlatforms.length) * ((j + 1) / platformGames.length) * maxProgress);
                    const gameData: GameData = await this.getGame(appId, localDatabasePlatforms[i], schemaLanguage);

                    gameDataCollection.push(gameData);

                    if (callbackProgress instanceof Function) {
                        callbackProgress(progressPercentage);
                    }
                }
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.debug('Local database does not exist');
                return [];
            } else {
                console.debug('Error loading local database:', error);
            }
        }

        if (callbackProgress instanceof Function) {
            callbackProgress(baseProgress + maxProgress);
        }

        return gameDataCollection;
    }

    async updateAll(gameData: GameData[]): Promise<void> {
        try {
            await mkdirp(this.celesDatabasePath);

            for (let i = 0; i < gameData.length; i++) {
                await this.updateGame(gameData[i]);
            }
        } catch (error) {
            console.debug(error);
        }
    }

    async getGame(appId: string, platform: Platform, schemaLanguage: string): Promise<GameData> {
        const gameStats: GameStats = JSON.parse(
            await fs.readFile(path.join(this.celesDatabasePath, platform + '/' + appId + '.json'), 'utf8')
        );

        if (gameStats.apiVersion !== this.apiVersion) {
            throw new Error('API version not valid. Expected ' + this.apiVersion + ', found ' + gameStats.apiVersion + '.');
        }

        return <GameData> {
            apiVersion: this.apiVersion,
            appId: gameStats.appId,
            platform: platform,
            schema: await getGameSchema(this.achievementWatcherRootPath, gameStats.appId, platform, schemaLanguage),
            stats: {
                sources: gameStats.sources,
                playtime: gameStats.playtime
            }
        }
    }

    async updateGame(gameData: GameData): Promise<void> {
        // TODO PATCH WHAT IF appId NOT VALID
        // TODO PATCH WHAT IF GAME PLATFORM NOT VALID
        const gamePlatform: Platform = gameData.platform;
        const gameStats: GameStats = {
            apiVersion: this.apiVersion,
            appId: gameData.appId,
            sources: gameData.stats.sources,
            playtime: gameData.stats.playtime
        };

        await mkdirp(path.join(this.celesDatabasePath, gamePlatform + '/'));
        await fs.writeFile(path.join(this.celesDatabasePath, gamePlatform + '/' + gameData.appId + '.json'), JSON.stringify(gameStats));
    }
}

export {CelesDbConnector};