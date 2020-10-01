// TODO IScanResult?
export interface IGameMetadata {
    appId: string;
    data: {
        type: "file" | "steamAPI";
        cachePath?: string;
        path?: string;
        userId?: ISteamUser;
    }
    source?: string;
}

export interface ILegitSteamGameMetadata {
    userId: string;
    appId: string;
}

export interface ISteamLanguage {
    displayName: string;
    api: string;
    webapi: string;
    native: string;
    iso?: string;
}

export interface ISteamUser {
    user: string;
    id: string;
    name: string;
}

// TODO
export interface IGetAchievementsConfig {

}

export interface IUnlockedAchievement {
    name: string;
    // achieved: 0 | 1;
    currentProgress: number;
    maxProgress: number;
    unlockTime: number;
}

export interface IAchievement {
    name: string;
    defaultvalue: number;
    hidden: 0 | 1;
    icon: string;
    icongray: string;
}

export interface IGameData {
    name: string;
    appid: string;
    binary: string;
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

export interface ISteamDbData {
    binary: string;
    icon: string;
    header: string;
    name: string;
}

export interface ISteamDbBinary {
    executable: string;
    windows: boolean;
}

export interface INormalizedProgress {
    currentProgress: number,
    maximProgress: number
}

export interface IScrappedGame {
    name: string;
    appid: string;
    binary: string;
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