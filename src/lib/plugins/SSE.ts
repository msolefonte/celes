'use strict';

import {ISource, IUnlockedAchievement} from '../../types';

// @ts-ignore
import {SteamEmulatorScraper} from './lib/SteamEmulatorScraper';

const path = require('path');

class SSE extends SteamEmulatorScraper {
    readonly source: ISource = 'SmartSteamEmu';

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