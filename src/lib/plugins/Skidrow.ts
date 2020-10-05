'use strict';

import {ISource, IUnlockedAchievement} from '../../types';

// @ts-ignore
import {SteamEmulatorScraper} from './lib/SteamEmulatorScraper';

// const omit = require('lodash.omit');
const path = require('path');

class Skidrow extends SteamEmulatorScraper {
    readonly source: ISource = 'Skidrow';

    private readonly localAppDataPath: string = <string>process.env['LOCALAPPDATA'];

    constructor() {
        super();
    }

    // TODO TEST
    normalizeUnlockedAchievementList(achievementList: any): IUnlockedAchievement[] {
        const unlockedAchievementList: IUnlockedAchievement[] = [];

        console.log(achievementList);

        // const filter: string[] = ['SteamAchievements', 'Steam64', 'Steam'];
        // achievementList = omit(achievementList.ACHIEVE_DATA || achievementList, filter);
        //
        // Object.keys(achievementList).forEach((achievementName) => {
        //     const achievementData: any = achievementList[achievementName];
        //
        //     let currentProgress: number, maxProgress: number;
        //     if (Number.parseInt(achievementData.MaxProgress) === 0) {
        //         currentProgress = 0;
        //         maxProgress = 0;
        //     } else {
        //         currentProgress = Math.floor(Number.parseFloat(achievementData.CurProgress) /
        //             Number.parseFloat(achievementData.MaxProgress) * 100);
        //         maxProgress = 100;
        //     }
        //
        //     unlockedAchievementList.push({
        //         name: achievementName,
        //         achieved: <0 | 1>+(achievementData.Achieved === '1'),
        //         currentProgress: currentProgress,
        //         maxProgress: maxProgress,
        //         unlockTime: achievementData.UnlockTime,
        //     });
        // });

        return unlockedAchievementList;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.localAppDataPath, 'SKIDROW')
        ];
    }
}

export {Skidrow};