'use strict';

import {IUnlockedAchievement} from '../../types';

// @ts-ignore
import {SteamEmulatorScraper} from './lib/SteamEmulatorScraper';

const path = require('path');

class CreamAPI extends SteamEmulatorScraper {
    readonly source: string = 'CreamAPI';

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
            path.join(this.appDataPath, 'CreamAPI')
        ];
    }
}

export {CreamAPI};