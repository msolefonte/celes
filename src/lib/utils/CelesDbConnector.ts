import * as path from 'path';
import {GameData, GameStats, Platform} from '../../types';
import {InvalidApiVersionError} from './Errors';
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
                    try {
                        const progressPercentage: number = baseProgress + Math.floor(((i + 1) / localDatabasePlatforms.length) * ((j + 1) / platformGames.length) * maxProgress);
                        const appId = platformGames[j].split('.').slice(0, -1).join('.');

                        const gameData: GameData = await this.getGame(appId, localDatabasePlatforms[i], schemaLanguage);

                        gameDataCollection.push(gameData);

                        typeof callbackProgress === 'function' && callbackProgress(progressPercentage);
                    } catch (error) {
                        throw error;
                    }
                }
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                typeof callbackProgress === 'function' && callbackProgress(baseProgress + maxProgress);
                return [];
            } else {
                throw error
            }
        }

        typeof callbackProgress === 'function' && callbackProgress(baseProgress + maxProgress);

        return gameDataCollection;
    }

    async updateAll(gameData: GameData[]): Promise<void> {
        await mkdirp(this.celesDatabasePath);

        for (let i = 0; i < gameData.length; i++) {
            await this.updateGame(gameData[i]);
        }
    }

    async getGame(appId: string, platform: Platform, schemaLanguage: string): Promise<GameData> {
        const gameStats: GameStats = JSON.parse(
            await fs.readFile(path.join(this.celesDatabasePath, platform + '/' + appId + '.json'), 'utf8')
        );

        if (gameStats.apiVersion !== this.apiVersion) {
            throw new InvalidApiVersionError(this.apiVersion, gameStats.apiVersion);
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