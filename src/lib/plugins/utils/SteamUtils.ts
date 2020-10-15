import * as path from 'path';
import {CloudClient} from 'cloud-client';
import {
    GameSchema
} from '../../../types';
import {existsAndIsYoungerThan} from './Common';
import {promises as fs} from 'fs';
import mkdirp from 'mkdirp';

class SteamUtils {
    private static readonly steamLanguages: string[] = [
        'arabic', 'bulgarian', 'schinese', 'tchinese', 'czech', 'danish', 'dutch', 'english', 'finnish', 'french',
        'german', 'greek', 'hungarian', 'italian', 'japanese', 'korean', 'norwegian', 'polish', 'portuguese',
        'brazilian', 'romanian', 'russian', 'spanish', 'latam', 'swedish', 'thai', 'turkish', 'ukrainian', 'vietnamese'
    ];

    static async getGameSchemaFromCache(gameCachePath: string): Promise<GameSchema> {
        return JSON.parse(await fs.readFile(gameCachePath, 'utf8'));
    }

    static async getGameSchema(achievementWatcherRootPath: string, appId: string, language: string): Promise<GameSchema> {
        if (!SteamUtils.steamLanguages.includes(language)) {
            language = 'english';
        }

        let gameSchema: GameSchema;
        const gameCachePath = SteamUtils.getGameCachePath(achievementWatcherRootPath, appId, language);

        if (await SteamUtils.validSteamGameSchemaCacheExists(gameCachePath)) {
            gameSchema = await SteamUtils.getGameSchemaFromCache(gameCachePath);
        } else {
            gameSchema = await CloudClient.getGameSchema(appId, language);
            await SteamUtils.updateGameSchemaCache(gameCachePath, gameSchema);
        }

        return gameSchema;
    }

    static async updateGameSchemaCache(gameCachePath: string, gameData: GameSchema): Promise<void> {
        await mkdirp(path.dirname(gameCachePath));
        await fs.writeFile(gameCachePath, JSON.stringify(gameData, null, 2));
    }

    static async validSteamGameSchemaCacheExists(gameCachePath: string): Promise<boolean> {
        return await existsAndIsYoungerThan(gameCachePath, 1, 'month');
    }

    static getGameCachePath(achievementWatcherRootPath: string, appId: string, language: string): string {
        const cachePath: string = path.join(achievementWatcherRootPath, 'steam_cache/schema', language);
        return path.join(`${cachePath}`, `${appId}.json`);
    }
}

export {
    SteamUtils
};
