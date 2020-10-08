import * as path from 'path';
import {ApiServerSchema, GameSchema} from '../../../types';
import {existsAndIsYoungerThan} from './Common';
import {promises as fs} from 'fs';
import got from 'got';
import mkdirp from 'mkdirp';

class SteamUtils {
    private static apiVersion = 'v1';
    static async getGameSchemaFromCache(gameCachePath: string): Promise<GameSchema> {
        return JSON.parse(await fs.readFile(gameCachePath, 'utf8'));
    }

    static async getGameSchemaFromApiServer(appId: string, lang: string): Promise<GameSchema> {
        const url = `https://api.xan105.com/steam/ach/${appId}?lang=${lang}`;
        const response: string = (await got(url)).body;

        const apiServerSchema: ApiServerSchema = JSON.parse(response).data;
        const gameSchema: GameSchema = {
            apiVersion: SteamUtils.apiVersion,
            appId: apiServerSchema.appid.toString(),
            platform: 'Steam',
            name: apiServerSchema.name,
            img: apiServerSchema.img,
            achievement: apiServerSchema.achievement
        };

        if ('binary' in apiServerSchema) {
            gameSchema.binary = apiServerSchema.binary;
        }

        return gameSchema;
    }

    static async getGameSchema(achievementWatcherRootPath: string, appId: string, lang: string): Promise<GameSchema> {
        // TODO WHAT IF NOT appId
        // TODO WHAT IF NOT LANG
        let gameSchema: GameSchema;
        const gameCachePath = SteamUtils.getGameCachePath(achievementWatcherRootPath, appId, lang);

        if (await SteamUtils.validSteamGameSchemaCacheExists(gameCachePath)) {
            gameSchema = await SteamUtils.getGameSchemaFromCache(gameCachePath);
        } else {
            gameSchema = await SteamUtils.getGameSchemaFromApiServer(appId, lang);
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
        return path.join(`${cachePath}`, `${appId}.db`);
    }
}

export {
    SteamUtils
};
