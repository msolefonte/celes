import {
    Ali213AchievementData,
    Ali213AchievementList,
    Source,
    UnlockedOrInProgressAchievement
} from '../../types';
import {SteamEmulatorScraper} from './utils/SteamEmulatorScraper';
import {generateActiveAchievement} from '../utils/generator';

export class Ali213 extends SteamEmulatorScraper {
    readonly source: Source = 'Ali213';
    readonly achievementWatcherRootPath: string;
    readonly achievementLocationFiles: string[] = [
        'Achievements.Bin'
    ];

    constructor(achievementWatcherRootPath: string) {
        super();
        this.achievementWatcherRootPath = achievementWatcherRootPath;
    }

    normalizeActiveAchievements(achievementList: Ali213AchievementList): UnlockedOrInProgressAchievement[] {
        const activeAchievements: UnlockedOrInProgressAchievement[] = [];

        Object.keys(achievementList).forEach((achievementName: string) => {
            const achievementData: Ali213AchievementData = achievementList[achievementName];
            activeAchievements.push(
                generateActiveAchievement(
                    achievementName,
                    parseInt(achievementData.HaveAchievedTime) * 1000
                )
            );
        });

        return activeAchievements;
    }

    getSpecificFoldersToScan(): string[] {
        return [];
    }
}