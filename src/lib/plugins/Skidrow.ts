'use strict';

import * as path from 'path';
import {Source, UnlockedOrInProgressAchievement} from '../../types';
import {SteamEmulatorScraper} from './lib/SteamEmulatorScraper';


class Skidrow extends SteamEmulatorScraper {
    readonly source: Source = 'Skidrow';

    private readonly localAppDataPath: string = <string>process.env['LOCALAPPDATA'];

    constructor() {
        super();
    }

    // TODO TEST
    normalizeUnlockedOrInProgressAchievementList(achievementList: any): UnlockedOrInProgressAchievement[] {
        const UnlockedOrInProgressAchievementList: UnlockedOrInProgressAchievement[] = [];

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
        //     UnlockedOrInProgressAchievementList.push({
        //         name: achievementName,
        //         achieved: <0 | 1>+(achievementData.Achieved === '1'),
        //         currentProgress: currentProgress,
        //         maxProgress: maxProgress,
        //         unlockTime: achievementData.UnlockTime,
        //     });
        // });

        return UnlockedOrInProgressAchievementList;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.localAppDataPath, 'SKIDROW')
        ];
    }
}

export {Skidrow};