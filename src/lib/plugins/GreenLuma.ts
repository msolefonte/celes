'use strict';

import {
    GameSchema,
    Platform,
    ScanResult,
    Source,
    UnlockedOrInProgressAchievement
} from '../../types';
import {AchievementsScraper} from './utils/AchievementsScraper';
import {SteamUtils} from './utils/SteamUtils';
import {generateActiveAchievement} from './utils/Common';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import regedit from 'regodit';

class GreenLuma implements AchievementsScraper {
    readonly source: Source = 'GreenLuma';
    readonly platform: Platform = 'Steam';
    readonly achievementWatcherRootPath: string;

    constructor(achievementWatcherRootPath: string) {
        this.achievementWatcherRootPath = achievementWatcherRootPath;
    }

    private async scanRegistrySubkeys(root: string, key: string):  Promise<ScanResult[]> {
        const scanResults: ScanResult[] = [];
        const subkeys = await regedit.promises.RegListAllSubkeys(root, key);

        if (subkeys !== null) {
            for (const subkey of subkeys) {
                const skipStatsAndAchievements: number = parseInt(await regedit.promises.RegQueryIntegerValue(root,
                                                                  `${key}/${subkey}`, 'SkipStatsAndAchievements'));
                if (skipStatsAndAchievements === 0) {
                    scanResults.push({
                        appId: subkey,
                        source: this.source,
                        platform: this.platform,
                        data: {
                            root: root,
                            path: `${key}/${subkey}/Achievements`
                        }
                    });
                }
            }
        }

        return scanResults;
    }

    async scan(): Promise<ScanResult[]> {
        let scanResults: ScanResult[] = [];

        scanResults = scanResults.concat(await this.scanRegistrySubkeys('HKCU', 'SOFTWARE/GLR/AppID'));
        scanResults = scanResults.concat(await this.scanRegistrySubkeys('HKCU', 'SOFTWARE/GL2020/AppID'));

        return scanResults;
    }

    async getGameSchema(appId: string, language: string): Promise<GameSchema> {
        return SteamUtils.getGameSchema(this.achievementWatcherRootPath, appId, language);
    }

    async getUnlockedOrInProgressAchievements(game: ScanResult): Promise<UnlockedOrInProgressAchievement[]> {
        const achievementRegistries = await regedit.promises.RegListAllValues(game.data.root, game.data.path);
        const activeAchievements: UnlockedOrInProgressAchievement[] = [];

        for (const acheivementRegistry of achievementRegistries){
            if(!acheivementRegistry.endsWith('_Time')) {
                activeAchievements.push(generateActiveAchievement(
                    acheivementRegistry,
                    parseInt(await regedit.promises.RegQueryIntegerValue(game.data.root, game.data.path,
                        acheivementRegistry + '_Time')),
                    <0|1>parseInt(await regedit.promises.RegQueryIntegerValue(game.data.root, game.data.path,
                        acheivementRegistry))
                ));
            }
        }

        return activeAchievements;
    }

    getPlatform(): Platform {
        return 'Steam';
    }

    getSource(): Source {
        return this.source;
    }
}

export {GreenLuma};