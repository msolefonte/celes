'use strict';

import * as path from 'path';
import {Source, UnlockedOrInProgressAchievement} from '../../types';
import {SteamEmulatorScraper} from './lib/SteamEmulatorScraper';

class CreamAPI extends SteamEmulatorScraper {
    readonly source: Source = 'CreamAPI';

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
            path.join(this.appDataPath, 'CreamAPI')
        ];
    }
}

export {CreamAPI};