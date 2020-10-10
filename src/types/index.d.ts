export interface Achievement {
    name: string;
    defaultvalue: number;
    hidden: 0 | 1;
    icon: string;
    icongray: string;
}

export interface ApiServerResponse {
    error: string | null;
    data: ApiServerSchema | null;
}

export interface ApiServerSchema {
    apiVersion: string;
    appid: string;
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

export interface CelesConfig {
    apiVersion: string;
    additionalFoldersToScan: string[];
    ignoreSourceAtMerge: boolean;
    systemLanguage: string;
    useOldestUnlockTime: boolean;
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

export type Source = 'Codex' | 'CreamAPI' | 'Goldberg' | 'Merge' | 'Reloaded - 3DM' | 'Skidrow' | 'SmartSteamEmu';

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