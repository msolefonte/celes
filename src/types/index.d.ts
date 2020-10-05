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

export interface GameData {
    apiVersion: string;
    appid: string;
    source: Source[];
    platform: Platform;
    name: string;
    binary?: string;
    img: {
        header?: string;
        background?: string;
        portrait?: string;
        hero?: string;
        icon?: string;
    }
    achievement: {
        total: number;
        list: Achievement[];
        active: UnlockedOrInProgressAchievement[];
    }
    playtime: number;
}

export interface GameSchema {
    apiVersion: string;
    appid: string;
    source: Source;
    platform: Platform;
    name: string;
    binary?: string;
    img: {
        header?: string;
        background?: string;
        portrait?: string;
        hero?: string;
        icon?: string;
    }
    achievement: {
        total: number;
        list: Achievement[];
    }
}

export interface GameStats {
    apiVersion: string;
    appid: string;
    source: Source;
    platform: Platform;
    UnlockedOrInProgressAchievements: UnlockedOrInProgressAchievement[];
    playtime: number;
}

export interface NormalizedProgress {
    currentProgress: number,
    maximProgress: number
}

export type Platform = 'Steam';

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

export type Source = 'Codex' | 'CreamAPI' | 'Goldberg' | 'Reloaded - 3DM' | 'Skidrow' | 'SmartSteamEmu';

export interface SteamUser {
    user: string;
    id: string;
    name: string;
}

export interface UnlockedOrInProgressAchievement {
    name: string;
    achieved: 0 | 1;
    currentProgress: number;
    maxProgress: number;
    unlockTime: number;
}
