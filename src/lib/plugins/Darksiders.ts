'use strict';

import {
    DarksidersAchievementList,
    Source,
    UnlockedOrInProgressAchievement
} from '../../types';
import {SteamEmulatorScraper} from './utils/SteamEmulatorScraper';
import {generateActiveAchievement} from './utils/Common';

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
            activeAchievements.push(
                generateActiveAchievement(
                    achievementName,
                    parseInt(achievementList.AchievementsUnlockTimes[achievementName]) * 1000
                )
            );
        });

        return activeAchievements;
    }

    getSpecificFoldersToScan(): string[] {
        return [];
    }
}

export {Darksiders};