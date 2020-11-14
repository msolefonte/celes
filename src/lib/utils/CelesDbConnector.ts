import * as path from 'path';
import {GameData, GameStats, Platform, SourceStats} from '../../types';
import {GameNotInDatabaseError, InvalidApiVersionError} from './errors';
import {promises as fs} from 'fs';
import {getGameSchema} from './utils';

/**
 * Important note: CelesDb is not prepared to prevent concurrency problems. This has to be addressed where used.
 */
export class CelesDbConnector {
    private readonly apiVersion: string = 'v1';
    private readonly achievementWatcherRootPath: string;
    private readonly celesDatabasePath: string;

    constructor(achievementWatcherRootPath: string) {
        this.achievementWatcherRootPath = achievementWatcherRootPath;
        this.celesDatabasePath = path.join(achievementWatcherRootPath, 'celes/db/');
    }

    private async removeGameStatsFromDb(appId: string, platform: Platform): Promise<void> {
        await fs.unlink(path.join(this.celesDatabasePath, platform + '/' + appId + '.json'));
    }

    private async readGameStatsFromDb(appId: string, platform: Platform): Promise<GameStats> {
        try {
            return JSON.parse(await fs.readFile(path.join(this.celesDatabasePath, platform + '/' + appId + '.json'), 'utf8'));
        } catch (e) {
            throw new GameNotInDatabaseError(appId, platform)
        }
    }

    private async writeGameStatsToDb(appId: string, platform: Platform, gameStats: GameStats): Promise<void> {
        await fs.mkdir(path.join(this.celesDatabasePath, platform + '/'), { recursive: true });
        await fs.writeFile(path.join(this.celesDatabasePath, platform + '/' + appId + '.json'), JSON.stringify(gameStats));
    }

    async getAll(schemaLanguage: string, callbackProgress?: (progress:number) => void, maxProgress = 100, baseProgress = 0): Promise<GameData[]> {
        const gameDataCollection: GameData[] = [];

        try {
            const localDatabasePlatforms: Platform[] = <Platform[]> await fs.readdir(this.celesDatabasePath);

            for (let i = 0; i < localDatabasePlatforms.length; i++) {
                const platformGames: string[] = await fs.readdir(path.join(this.celesDatabasePath, localDatabasePlatforms[i]));

                for (let j = 0; j < platformGames.length; j++) {
                    const progressPercentage: number = baseProgress + Math.floor(((i + 1) / localDatabasePlatforms.length) * ((j + 1) / platformGames.length) * maxProgress);
                    const appId = platformGames[j].split('.').slice(0, -1).join('.');

                    try {
                        const gameData: GameData = await this.getGame(appId, localDatabasePlatforms[i], schemaLanguage);
                        gameDataCollection.push(gameData);
                    } finally {
                        typeof callbackProgress === 'function' && callbackProgress(progressPercentage);
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
        await fs.mkdir(this.celesDatabasePath, { recursive: true });

        for (let i = 0; i < gameData.length; i++) {
            await this.updateGame(gameData[i]);
        }
    }

    async getGame(appId: string, platform: Platform, schemaLanguage: string): Promise<GameData> {
        const gameStats: GameStats = await this.readGameStatsFromDb(appId, platform);

        if (gameStats.apiVersion !== this.apiVersion) {
            throw new InvalidApiVersionError(this.apiVersion, gameStats.apiVersion);
        }

        return <GameData>{
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

    async removeManuallAddedGame(appId: string, platform: Platform): Promise<void> {
        const gameStats: GameStats = await this.readGameStatsFromDb(appId, platform);

        const newSources: SourceStats[] = [];
        for (const sourceStats of gameStats.sources) {
            if (sourceStats.source !== 'Manual') {
                newSources.push(sourceStats);
            }
        }

        if (newSources.length === 0) {
            await this.removeGameStatsFromDb(appId, platform);
        } else {
            await this.writeGameStatsToDb(appId, platform, {
                apiVersion: gameStats.apiVersion,
                appId: appId,
                sources: newSources,
                playtime: gameStats.playtime
            });
        }
    }

    async updateGame(gameData: GameData): Promise<void> {
        const gameStats: GameStats = {
            apiVersion: this.apiVersion,
            appId: gameData.appId,
            sources: gameData.stats.sources,
            playtime: gameData.stats.playtime
        };

        await this.writeGameStatsToDb(gameData.appId, gameData.platform, gameStats);
    }
}