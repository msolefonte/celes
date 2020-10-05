'use strict';

import {Source, UnlockedOrInProgressAchievement} from '../../types';

// @ts-ignore
import {SteamEmulatorScraper} from './lib/SteamEmulatorScraper';

const path = require('path');

class Goldberg extends SteamEmulatorScraper {
    readonly source: Source = 'Goldberg';

    private readonly appDataPath: string = <string>process.env['APPDATA'];

    constructor() {
        super();
    }

    // TODO
    normalizeUnlockedOrInProgressAchievementList(achievementList: any): UnlockedOrInProgressAchievement[] {
        const UnlockedOrInProgressAchievementList: UnlockedOrInProgressAchievement[] = [];

        console.log(achievementList);

        return UnlockedOrInProgressAchievementList;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.appDataPath, 'Goldberg SteamEmu Saves')
        ];
    }
}

export {Goldberg};