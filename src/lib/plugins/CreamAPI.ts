import * as path from 'path';
import {
    CreamApiAchievementData,
    CreamApiAchievementList,
    Source,
    UnlockedOrInProgressAchievement
} from '../../types';
import {SteamEmulatorScraper} from './utils/SteamEmulatorScraper';
import {generateActiveAchievement} from '../utils/generator';

export class CreamAPI extends SteamEmulatorScraper {
    readonly source: Source = 'CreamAPI';
    readonly achievementWatcherRootPath: string;
    readonly achievementLocationFiles: string[] = [
        'CreamAPI.Achievements.cfg'
    ];

    private readonly appDataPath: string = <string>process.env['APPDATA'];

    constructor(achievementWatcherRootPath: string) {
        super();
        this.achievementWatcherRootPath = achievementWatcherRootPath;
    }

    normalizeActiveAchievements(achievementList: CreamApiAchievementList): UnlockedOrInProgressAchievement[] {
        const activeAchievements: UnlockedOrInProgressAchievement[] = [];

        Object.keys(achievementList).forEach((achievementName: string) => {
            const achievementData: CreamApiAchievementData = achievementList[achievementName];
            activeAchievements.push(
                generateActiveAchievement(
                    achievementName,
                    achievementData.unlocktime * 1000000
                )
            );
        });

        return activeAchievements;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.appDataPath, 'CreamAPI')
        ];
    }
}