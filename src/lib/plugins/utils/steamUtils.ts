import * as path from 'path';
import {CloudClient} from 'cloud-client';
import {
    GameSchema
} from '../../../types';
import {existsAndIsYoungerThan} from './common';
import {promises as fs} from 'fs';

const steamLanguages: string[] = [
    'arabic', 'bulgarian', 'schinese', 'tchinese', 'czech', 'danish', 'dutch', 'english', 'finnish', 'french',
    'german', 'greek', 'hungarian', 'italian', 'japanese', 'korean', 'norwegian', 'polish', 'portuguese',
    'brazilian', 'romanian', 'russian', 'spanish', 'latam', 'swedish', 'thai', 'turkish', 'ukrainian', 'vietnamese'
];

export async function getGameSchemaFromCache(gameCachePath: string): Promise<GameSchema> {
    return JSON.parse(await fs.readFile(gameCachePath, 'utf8'));
}

export async function getGameSchema(achievementWatcherRootPath: string, appId: string, language: string): Promise<GameSchema> {
    if (!steamLanguages.includes(language)) {
        language = 'english';
    }

    let gameSchema: GameSchema;
    const gameCachePath = getGameCachePath(achievementWatcherRootPath, appId, language);

    if (await validSteamGameSchemaCacheExists(gameCachePath)) {
        gameSchema = await getGameSchemaFromCache(gameCachePath);
    } else {
        gameSchema = await CloudClient.getGameSchema(appId, language);
        await updateGameSchemaCache(gameCachePath, gameSchema);
    }

    return gameSchema;
}

export async function updateGameSchemaCache(gameCachePath: string, gameData: GameSchema): Promise<void> {
    await fs.mkdir(path.dirname(gameCachePath), { recursive: true });
    await fs.writeFile(gameCachePath, JSON.stringify(gameData, null, 2));
}

export async function validSteamGameSchemaCacheExists(gameCachePath: string): Promise<boolean> {
    return await existsAndIsYoungerThan(gameCachePath, 1, 'month');
}

export function getGameCachePath(achievementWatcherRootPath: string, appId: string, language: string): string {
    const cachePath: string = path.join(achievementWatcherRootPath, 'steam_cache/schema', language);
    return path.join(`${cachePath}`, `${appId}.json`);
}
