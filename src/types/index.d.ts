export interface Achievement {
    name: string;
    defaultvalue: number;
    hidden: 0 | 1;
    icon: string;
    icongray: string;
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
    UnlockTime: number;
}

export type CodexAchievementList = { [achievementName: string]: CodexAchievementData }

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

export interface NormalizedProgress {
    currentProgress: number,
    maximProgress: number
}

export type Platform = 'Steam';

export interface ReloadedAchievementData {
    State: string;
    CurProgress: string;
    MaxProgress: string;
    Time: string;
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

export interface SkidrowAchievementList {
    ACHIEVE_DATA: { [achievementName: string]: '0' | '1' }
}

export type Source = '3DM' | 'Codex' | 'CreamAPI' | 'Goldberg' | 'Merge' | 'Reloaded' | 'Skidrow' | 'SmartSteamEmu' |
    'Steam';

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