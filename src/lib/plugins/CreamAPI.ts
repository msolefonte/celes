'use strict';

import * as path from 'path';
import {Source, UnlockedOrInProgressAchievement} from '../../types';
import {SteamEmulatorScraper} from './lib/SteamEmulatorScraper';

class CreamAPI extends SteamEmulatorScraper {
    readonly source: Source = 'CreamAPI';
    readonly achievementWatcherRootPath: string;

    private readonly appDataPath: string = <string>process.env['APPDATA'];

    constructor(achievementWatcherRootPath: string) {
        super();
        this.achievementWatcherRootPath = achievementWatcherRootPath;
    }

    // TODO
    normalizeUnlockedOrInProgressAchievementList(achievementList: any): UnlockedOrInProgressAchievement[] {
        const UnlockedOrInProgressAchievementList: UnlockedOrInProgressAchievement[] = [];

        return UnlockedOrInProgressAchievementList;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.appDataPath, 'CreamAPI')
        ];
    }
}

export {CreamAPI};