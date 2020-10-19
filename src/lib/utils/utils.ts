'use strict';

import {GameSchema, GameSchemaBody, Platform} from '../../types';
import {PlatformNotAvailableError} from './Errors';
import {SteamUtils} from '../plugins/utils/SteamUtils';

async function getGameSchema(achievementWatcherRootPath: string, appId: string, platform: Platform, language: string): Promise<GameSchemaBody> {
    if (platform === 'Steam') {
        const gameSchema: GameSchema = await SteamUtils.getGameSchema(achievementWatcherRootPath, appId, language);
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

export {getGameSchema};