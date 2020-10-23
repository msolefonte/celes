'use strict';

import * as path from 'path';
import {SkidrowAchievementList, Source, UnlockedOrInProgressAchievement} from '../../types';
import {generateActiveAchievement} from './utils/Common';
import {SteamEmulatorScraper} from './utils/SteamEmulatorScraper';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import regedit from 'regodit'; // TODO LOOK FOR ALTERNATIVES

class Skidrow extends SteamEmulatorScraper {
    readonly source: Source = 'Skidrow';
    readonly achievementWatcherRootPath: string;
    readonly achievementLocationFiles: string[] = [
        'achieve.dat'
    ];

    private readonly localAppDataPath: string = <string>process.env['LOCALAPPDATA'];

    constructor(achievementWatcherRootPath: string) {
        super();
        this.achievementWatcherRootPath = achievementWatcherRootPath;
    }

    normalizeActiveAchievements(achievementList: SkidrowAchievementList): UnlockedOrInProgressAchievement[] {
        const activeAchievements: UnlockedOrInProgressAchievement[] = [];

        Object.keys(achievementList.ACHIEVE_DATA).forEach((achievementName: string) => {
            const achievementIsUnlocked: boolean = achievementList.ACHIEVE_DATA[achievementName] === 1;

            if (achievementIsUnlocked) {
                activeAchievements.push(generateActiveAchievement(achievementName));
            }
        });

        return activeAchievements;
    }

    protected async getFoldersToScan(specificFolders: string[], additionalFolders: string[]): Promise<string[]> {
        const docsFolderPath: string = await regedit.promises.RegQueryStringValue('HKCU', // TODO REGEDIT SUS
            'Software/Microsoft/Windows/CurrentVersion/Explorer/User Shell Folders', 'Personal');

        /* istanbul ignore next */
        if (docsFolderPath) {
            additionalFolders = additionalFolders.concat([
                path.join(docsFolderPath, 'Skidrow')
            ]);
        }

        return super.getFoldersToScan(specificFolders, additionalFolders);
    }

    getSpecificFoldersToScan(): string[] {
        return [
            path.join(this.localAppDataPath, 'SKIDROW')
        ];
    }
}

export {Skidrow};