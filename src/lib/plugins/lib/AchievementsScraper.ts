import {ScanResult, GameSchema, UnlockedOrInProgressAchievement} from '../../../types';

interface AchievementsScraper {
    getUnlockedOrInProgressAchievements(game: ScanResult): Promise<UnlockedOrInProgressAchievement[]>;

    getGameSchema(appId: string, lang?: string, key?: string): Promise<GameSchema>;

    scan(additionalFoldersToScan?: string[]): Promise<ScanResult[]>;
}

export {AchievementsScraper};