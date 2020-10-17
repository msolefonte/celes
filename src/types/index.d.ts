export interface Achievement {
    name: string;
    displayName: string;
    description: string;
    hidden: 0 | 1;
    icon: string;
    icongray: string;
}

export interface Ali213AchievementData {
    HaveAchieved: '1',
    HaveAchievedTime: string
}

export interface Ali213AchievementList {
    [achievementName: string]: Ali213AchievementData
}

export interface CelesConfig {
    apiVersion: string;
    additionalFoldersToScan: string[];
    ignoreSourceAtMerge: boolean;
    systemLanguage: string;
    useOldestUnlockTime: boolean;
}

export interface CodexAchievementData {
    Achieved: '0' | '1';
    CurProgress: string;
    MaxProgress: string;
    UnlockTime: string;
}

export type CodexAchievementList = { [achievementName: string]: CodexAchievementData }

export interface CreamApiAchievementData {
    achieved: boolean;
    unlocktime: number;
}

export type CreamApiAchievementList = { [achievementName: string]: CreamApiAchievementData }

export interface DarksidersAchievementList {
    Achievements: {[achievementName: string]: string},
    AchievementsUnlockTimes: {[achievementName: string]: string}
}

export interface ExportableGameStats {
    appId: string;
    platform: Platform;
    stats: {
        sources: SourceStats[];
        playtime: number;
    };
}

export interface ExportableGameStatsCollection {
    apiVersion: string;
    data: ExportableGameStats[];
}

export interface GameData {
    apiVersion: string;
    appId: string;
    platform: Platform;
    schema: GameSchemaBody,
    stats: {
        sources: SourceStats[];
        playtime: number;
    }
}

export interface GameSchema {
    apiVersion: string;
    appId: string;
    platform: Platform;
    name: string;
    binary?: string;
    img: {
        header?: string;
        background?: string;
        portrait?: string;
        icon?: string;
    }
    achievement: {
        total: number;
        list: Achievement[];
    }
}

export interface GameSchemaBody  {
    name: string;
    binary?: string;
    img: {
        header?: string;
        background?: string;
        portrait?: string;
        hero?: string;
        icon?: string;
    }
    achievements: {
        total: number;
        list: Achievement[];
    }
}

export interface GameStats {
    apiVersion: string;
    appId: string;
    sources: SourceStats[];
    playtime: number;
}

export interface GoldbergAchievementDataIni {
    Achieved: 1,
    UnlockTime: string
}

export interface GoldbergAchievementDataJson {
    earned: true,
    earned_time: number
}

export interface GoldbergAchievementListIni {
    [achievementName: string]: GoldbergAchievementDataIni
}

export interface GoldbergAchievementListJson{
    [achievementName: string]: GoldbergAchievementDataJson
}

export interface NormalizedProgress {
    currentProgress: number,
    maximProgress: number
}

export type Platform = 'Steam';

export interface ReloadedAchievementData {
    State: number;
    CurProgress: number;
    MaxProgress: number;
    Time: number;
}

export type ReloadedAchievementList = { [achievementName: string]: ReloadedAchievementData }

export interface ScanResult {
    appId: string;
    source: Source;
    platform: Platform;
    data: {
        type: 'file' | 'steamAPI';
        cachePath?: string;
        path?: string;
        userId?: SteamUser;
    }
}

export interface ScrapError {
    message: string;
    type: string;
    plugin?: string;
    platform?: Platform;
    source?: Source;
    appId?: string;
}

export interface ScrapResult {
    data: GameData[],
    error?: ScrapError[]
}

export interface SkidrowAchievementList {
    ACHIEVE_DATA: { [achievementName: string]: 0 | 1 }
}

export type Source = '3DM' | 'Ali213' | 'Codex' | 'CreamAPI' | 'Darksiders' | 'Goldberg' | 'Merge' | 'Reloaded' |
    'Skidrow' | 'SmartSteamEmu' | 'Steam';

export interface SourceStats {
    source: Source;
    achievements: {
        active: UnlockedOrInProgressAchievement[];
    }
}

export interface SSEAchievement {
    crc: string;
    Achieved: number;
    UnlockTime: number;
}

export interface SteamGameMetadata {
    appId: string;
    userId: string;
}
export interface SteamUser {
    user: string;
    id: string;
    name: string;
}

export interface SteamUserData {
    privacyState: 'public' | 'private';
    steamID: string;
}

export interface TDMAchievementList1 {
    State: {[achievementName: string]: string},
    Time: {[achievementName: string]: string}
}

export interface TDMAchievementList2 {
    Steam: {[achievementName: string]: string}
}

export interface UnlockedOrInProgressAchievement {
    name: string;
    achieved: 0 | 1;
    currentProgress: number;
    maxProgress: number;
    unlockTime: number;
}