// 'use strict';
//
// import * as path from 'path';
// import {Source, UnlockedOrInProgressAchievement} from '../../types';
// import {SteamEmulatorScraper} from './lib/SteamEmulatorScraper';
//
//
// class Goldberg extends SteamEmulatorScraper {
//     readonly source: Source = 'Goldberg';
//     readonly achievementWatcherRootPath: string;
//
//     private readonly appDataPath: string = <string>process.env['APPDATA'];
//
//     constructor(achievementWatcherRootPath: string) {
//         super();
//         this.achievementWatcherRootPath = achievementWatcherRootPath;
//     }
//
//     // TODO
//     normalizeUnlockedOrInProgressAchievementList(achievementList: any): UnlockedOrInProgressAchievement[] {
//         const UnlockedOrInProgressAchievementList: UnlockedOrInProgressAchievement[] = [];
//
//
//         return UnlockedOrInProgressAchievementList;
//     }
//
//     getSpecificFoldersToScan(): string[] {
//         return [
//             path.join(this.appDataPath, 'Goldberg SteamEmu Saves')
//         ];
//     }
// }
//
// export {Goldberg};