'use strict';

import {
    DarksidersAchievementList,
    Source,
    UnlockedOrInProgressAchievement
} from '../../types';
import {SteamEmulatorScraper} from './utils/SteamEmulatorScraper';

class Darksiders extends SteamEmulatorScraper {
    readonly source: Source = 'Darksiders';
    readonly achievementWatcherRootPath: string;
    readonly achievementLocationFiles: string[] = [
        'stats.ini'
    ];

    constructor(achievementWatcherRootPath: string) {
        super();
        this.achievementWatcherRootPath = achievementWatcherRootPath;
    }

    normalizeActiveAchievements(achievementList: DarksidersAchievementList): UnlockedOrInProgressAchievement[] {
        const activeAchievements: UnlockedOrInProgressAchievement[] = [];

        Object.keys(achievementList.Achievements).forEach((achievementName: string) => {
            activeAchievements.push({
                name: achievementName,
                achieved: 1,
                currentProgress: 0,
                maxProgress: 0,
                unlockTime: parseInt(achievementList.AchievementsUnlockTimes[achievementName]) * 1000
            });
        });

        return activeAchievements;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            // TODO CHECK
        ];
    }
}

export {Darksiders};