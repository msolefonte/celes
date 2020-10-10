'use strict';

import {GameSchema, GameSchemaBody, Platform} from '../../types';
import {SteamUtils} from '../plugins/lib/SteamUtils';

async function getGameSchema(achievementWatcherRootPath: string, appId: string, platform: Platform, language: string): Promise<GameSchemaBody> {
    if (platform === 'Steam') {
        const gameSchema: GameSchema = await SteamUtils.getGameSchema(achievementWatcherRootPath, appId, language);
        const gameSchemaBody: GameSchemaBody = {
            name: gameSchema.name,
            img: gameSchema.img,
            achievements: gameSchema.achievement
        }

        if ('binary' in gameSchemaBody) { // TODO THIS DOES NOT PASS TEST?
            gameSchemaBody.binary = gameSchema.binary;
        }

        return gameSchemaBody;
    } else {
        throw new Error('Platform schema not available for ' + platform); // TODO ADD BETTER ERROR // TODO ADD TEST
    }
}

export {getGameSchema};