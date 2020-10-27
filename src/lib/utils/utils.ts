import {
    GameSchema,
    GameSchemaBody,
    Platform
} from '../../types';
import {PlatformNotAvailableError} from './errors';
import {promises as fs} from 'fs';
import {getGameSchema as getSteamGameSchema} from '../plugins/utils/steamUtils';
import moment from 'moment';

export async function getGameSchema(achievementWatcherRootPath: string, appId: string, platform: Platform, language: string): Promise<GameSchemaBody> {
    if (platform === 'Steam') {
        const gameSchema: GameSchema = await getSteamGameSchema(achievementWatcherRootPath, appId, language);
        const gameSchemaBody: GameSchemaBody = {
            name: gameSchema.name,
            img: gameSchema.img,
            achievements: gameSchema.achievement
        }

        /* istanbul ignore else */
        if (gameSchema.binary !== undefined) {
            gameSchemaBody.binary = gameSchema.binary;
        }

        return gameSchemaBody;
    } else {
        throw new PlatformNotAvailableError(platform);
    }
}

export function concatIfExists(base: unknown[], addition: unknown[] | undefined): unknown[] {
    if (addition !== undefined) {
        return base.concat(addition);
    }

    return base;
}

export async function getFileMtime(filePath: string): Promise<number> {
    const localCacheStats = await fs.stat(filePath);
    return moment(localCacheStats.mtime).valueOf();
}
