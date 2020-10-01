'use strict';

import {IUnlockedAchievement} from '../../types';

// @ts-ignore
import {SteamEmulatorParser} from './lib/SteamEmulatorParser';

const omit = require('lodash.omit');
const path = require('path');

class SSE extends SteamEmulatorParser {
    readonly source: string = 'SmartSteamEmu';

    private readonly appDataPath: string = <string>process.env['APPDATA'];

    constructor() {
        super();
    }

    // TODO
    normalizeUnlockedAchievementList(achievementList: any): IUnlockedAchievement[] {
        const unlockedAchievementList: IUnlockedAchievement[] = [];

        console.log(achievementList);

        return unlockedAchievementList;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.appDataPath, 'SmartSteamEmu')
        ];
    }
}

export {SSE};