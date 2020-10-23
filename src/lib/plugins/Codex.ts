'use strict';

import * as path from 'path';
import {
    CodexAchievementData,
    CodexAchievementList,
    GoldbergAchievementDataIni,
    GoldbergAchievementListIni,
    Source,
    UnlockedOrInProgressAchievement
} from '../../types';
import {generateActiveAchievement, normalizeProgress} from './utils/Common';
import {SteamEmulatorScraper} from './utils/SteamEmulatorScraper';
import {WrongSourceDetectedError} from '../utils/Errors';
import {omit} from 'lodash';

class Codex extends SteamEmulatorScraper {
    readonly source: Source = 'Codex';
    readonly achievementWatcherRootPath: string;
    readonly achievementLocationFiles: string[] = [
        'achievements.ini'
    ];

    private readonly publicDataPath: string = <string>process.env['Public'];
    private readonly appDataPath: string = <string>process.env['APPDATA'];

    constructor(achievementWatcherRootPath: string) {
        super();
        this.achievementWatcherRootPath = achievementWatcherRootPath;
    }

    normalizeActiveAchievements(achievementList: CodexAchievementList | GoldbergAchievementListIni): UnlockedOrInProgressAchievement[] {
        const activeAchievements: UnlockedOrInProgressAchievement[] = [];

        const filter: string[] = ['SteamAchievements'];
        achievementList = <CodexAchievementList | GoldbergAchievementListIni> omit(achievementList, filter);

        Object.keys(achievementList).forEach((achievementName: string) => {
            const achievementData: CodexAchievementData | GoldbergAchievementDataIni = achievementList[achievementName];

            if (!('CurProgress' in achievementData || 'MaxProgress' in achievementData)) {
                throw new WrongSourceDetectedError();
            }

            const normalizedProgress = normalizeProgress(achievementData.CurProgress, achievementData.MaxProgress);

            if (achievementData.Achieved == '1') {
                activeAchievements.push(
                    generateActiveAchievement(
                        achievementName,
                        parseInt(achievementData.UnlockTime) * 1000,
                        1,
                        normalizedProgress.currentProgress,
                        normalizedProgress.maximProgress
                    )
                );
            } else if (normalizedProgress.maximProgress > 0) {
                if (normalizedProgress.currentProgress == normalizedProgress.maximProgress) {
                    activeAchievements.push(
                        generateActiveAchievement(
                            achievementName,
                            parseInt(achievementData.UnlockTime) * 1000,
                            1,
                            normalizedProgress.currentProgress,
                            normalizedProgress.maximProgress
                        )
                    );
                } else {
                    activeAchievements.push(
                        generateActiveAchievement(
                            achievementName,
                            parseInt(achievementData.UnlockTime) * 1000,
                            0,
                            normalizedProgress.currentProgress,
                            normalizedProgress.maximProgress
                        )
                    );
                }
            }
        });

        return activeAchievements;
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.publicDataPath, 'Documents/Steam/CODEX'),
            path.join(this.appDataPath, 'Steam/CODEX')
        ];
    }
}

export {Codex};