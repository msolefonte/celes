export interface IAchievement {
    name: string;
    defaultvalue: number;
    hidden: 0 | 1;
    icon: string;
    icongray: string;
}

export interface ICelesConfig {
    apiVersion: string;
    additionalFoldersToScan: string[];
    ignoreSourceAtMerge: boolean;
    systemLanguage: string;
    useOldestUnlockTime: boolean;
}

// TODO IGameData
export interface IExportableGameData {
    name: string;
    appid: string;
    binary?: string;
    platform: IPlatform;
    source: ISource;
    img: {
        header: string;
        background: string;
        portrait: string;
        hero: string;
        icon: string;
    }
    achievement: {
        total: number;
        list: IAchievement[];
        unlocked: IUnlockedAchievement[];
    }
}

export interface IGameSchema {
    name: string;
    appid: string;
    binary: string;
    platform: IPlatform;
    source: ISource;
    img: {
        header: string;
        background: string;
        portrait: string;
        hero: string;
        icon: string;
    }
    achievement: {
        total: number;
        list: IAchievement[];
    }
}

// TODO IGameStats
// TODO Add playtime
export interface IExportableUnlockedAchievements {
    appid: string;
    platform: IPlatform;
    source: ISource;
    unlockedAchievements: IUnlockedAchievement[];
}

export interface INormalizedProgress {
    currentProgress: number,
    maximProgress: number
}

export type IPlatform = 'Steam';

// TODO IScanResult
export interface IGameMetadata {
    appId: string;
    data: {
        type: 'file' | 'steamAPI';
        cachePath?: string;
        path?: string;
        userId?: ISteamUser;
    }
    source: ISource;
    platform: IPlatform;
}

export type ISource = 'Codex' | 'CreamAPI' | 'Goldberg' | 'Reloaded - 3DM' | 'Skidrow' | 'SmartSteamEmu';

export interface ISteamUser {
    user: string;
    id: string;
    name: string;
}

export interface IUnlockedAchievement {
    name: string;
    achieved: 0 | 1;
    currentProgress: number;
    maxProgress: number;
    unlockTime: number;
}
