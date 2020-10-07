import * as path from 'path';
import * as sse from './SSEConfigParser'; // TODO REDO OR LOOK FOR ALTERNATIVES
import {GameSchema} from '../../../types';
import {existsAndIsYoungerThan} from './Common';
import {promises as fs} from 'fs';
import got from 'got';
import ini from 'ini';
import normalize from 'normalize-path';

class SteamUtils {
    private static readonly achievementWatcherRootPath: string = path.join(<string>process.env['APPDATA'],
        'Achievement Watcher');

    static async getGameSchemaFromCache(gameCachePath: string): Promise<GameSchema> {
        return JSON.parse(await fs.readFile(gameCachePath, 'utf8'));
    }

    static async getGameSchemaFromServer(appId: string, lang: string): Promise<GameSchema> {
        const url = `https://api.xan105.com/steam/ach/${appId}?lang=${lang}`;
        const response: string = (await got(url)).body;

        const gameSchema = JSON.parse(response).data;
        gameSchema.platform = 'Steam';

        return <GameSchema>gameSchema;
    }

    static async getGameSchema(appId: string, lang: string): Promise<GameSchema> {
        let gameSchema: GameSchema;
        const gameCachePath = SteamUtils.getGameCachePath(appId, lang);

        if (await SteamUtils.validSteamGameSchemaCacheExists(gameCachePath)) {
            gameSchema = await SteamUtils.getGameSchemaFromCache(gameCachePath);
        } else {
            gameSchema = await SteamUtils.getGameSchemaFromServer(appId, lang);
            await SteamUtils.updateGameSchemaCache(gameCachePath, gameSchema);
        }

        return gameSchema;
    }

    static async updateGameSchemaCache(gameCachePath: string, gameData: GameSchema): Promise<void> {
        await fs.writeFile(gameCachePath, JSON.stringify(gameData, null, 2));
    }

    static async validSteamGameSchemaCacheExists(gameCachePath: string): Promise<boolean> {
        return await existsAndIsYoungerThan(gameCachePath, 1, 'month');
    }

    static getGameCachePath(appId: string, language: string): string {
        const cachePath: string = path.join(SteamUtils.achievementWatcherRootPath, 'steam_cache/schema', language);
        return path.join(`${cachePath}`, `${appId}.db`);
    }
}

export {
    SteamUtils
};
