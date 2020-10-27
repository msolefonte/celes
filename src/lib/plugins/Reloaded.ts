import * as path from 'path';
import {
    ReloadedAchievementData,
    ReloadedAchievementList,
    Source,
    UnlockedOrInProgressAchievement
} from '../../types';
import {normalizeProgress, normalizeTimestamp} from './utils/common';
import {SteamEmulatorScraper} from './utils/SteamEmulatorScraper';
import {WrongSourceDetectedError} from '../utils/errors';
import {generateActiveAchievement} from '../utils/generator';
import {omit} from 'lodash';

export class Reloaded extends SteamEmulatorScraper {
    private static is3dmAchievementList(achievementList: ReloadedAchievementList) {
        return 'State' in achievementList;
    }

    readonly source: Source = 'Reloaded';
    readonly achievementWatcherRootPath: string;
    readonly achievementLocationFiles: string[] = [
        'stats/achievements.ini'
    ];

    private readonly programDataPath: string = <string>process.env['PROGRAMDATA'];

    constructor(achievementWatcherRootPath: string) {
        super();
        this.achievementWatcherRootPath = achievementWatcherRootPath;
    }

    normalizeActiveAchievements(achievementList: ReloadedAchievementList): UnlockedOrInProgressAchievement[] {
        const activeAchievements: UnlockedOrInProgressAchievement[] = [];

        if (Reloaded.is3dmAchievementList(achievementList)) {
            throw new WrongSourceDetectedError();
        }

        const filter: string[] = ['Steam', 'Steam64'];
        achievementList = omit(achievementList, filter);

        Object.keys(achievementList).forEach((achievementName: string) => {
            const achievementData: ReloadedAchievementData = achievementList[achievementName];
            const normalizedProgress = normalizeProgress(achievementData.CurProgress.toString(), achievementData.MaxProgress.toString());

            if (achievementData.State.toString() === '100000001') {
                activeAchievements.push(
                    generateActiveAchievement(
                        achievementName,
                        normalizeTimestamp(achievementData.Time.toString()),
                        1,
                        normalizedProgress.currentProgress,
                        normalizedProgress.maximProgress
                    )
                );
            } else if (normalizedProgress.maximProgress > 0) {
                activeAchievements.push(
                    generateActiveAchievement(
                        achievementName,
                        normalizeTimestamp(achievementData.Time.toString()),
                        0,
                        normalizedProgress.currentProgress,
                        normalizedProgress.maximProgress
                    )
                );
            }
        });

        return activeAchievements;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.programDataPath, 'Steam') + '/*'
        ];
    }
}