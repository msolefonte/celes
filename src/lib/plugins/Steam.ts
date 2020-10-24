import * as path from 'path';
import {
    GameSchema, Platform,
    ScanResult,
    Source,
    SteamGameMetadata,
    SteamUser,
    SteamUserData,
    UnlockedOrInProgressAchievement
} from '../../types';
import {
    SteamGameCacheNotFound,
    SteamNotFoundError,
    SteamPublicUsersNotFoundError
} from '../utils/Errors';
import {existsSync, promises as fs} from 'fs';
import {AchievementsScraper} from './utils/AchievementsScraper';
import {CloudClient} from 'cloud-client';
import {SteamIdUtils} from './utils/SteamIdUtils';
import {SteamUtils} from './utils/SteamUtils';
import glob from 'fast-glob';
import moment from 'moment';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import regedit from 'regodit';

class Steam implements AchievementsScraper {
    /**
     * Obtains Steam path from registry.
     *
     * By default, the key is HKCU/Software/Valve/Steam/SteamPath, but some Steam Emulators modify it. The solution
     * is to fallback to Software/WOW6432Node/Valve/Steam/InstallPath if required.
     *
     * Steam client can correct the key in the startup.
     * @private
     */
    private static async getSteamPath(): Promise<string> {
        const regHives = [
            {root: 'HKLM', key: 'Software/WOW6432Node/Valve/Steam', name: 'InstallPath'},
            {root: 'HKCU', key: 'Software/Valve/Steam', name: 'SteamPath'}
        ];

        for (const regHive of regHives) {
            const steamPath: string = await regedit.promises.RegQueryStringValue(regHive.root, regHive.key, regHive.name);
            if (steamPath && existsSync(path.join(steamPath, 'steam.exe'))) {
                return steamPath;
            }
        }

        throw new SteamNotFoundError();
    }

    private static async getPublicSteamUsers(steamPath: string): Promise<SteamUser[]> {
        const steamUsers: SteamUser[] = [];

        let users: (string | number)[] = await regedit.promises.RegListAllSubkeys('HKCU', 'Software/Valve/Steam/Users');
        if (!users) {
            users = await glob('*([0-9])', {
                cwd: path.join(steamPath, 'userdata'),
                onlyDirectories: true,
                absolute: false
            });
        }

        for (const user of users) {
            const id: string = SteamIdUtils.getSteamId64(user);
            const steamUserData: SteamUserData = await SteamIdUtils.getUserData(id);

            if (steamUserData.privacyState === 'public') {
                steamUsers.push({
                    user: user.toString(),
                    id: id,
                    name: steamUserData.steamID
                });
            }
        }

        if (steamUsers.length === 0) {
            throw new SteamPublicUsersNotFoundError();
        }

        return steamUsers;
    }

    private readonly achievementWatcherRootPath: string;
    private readonly listingType: 0 | 1 | 2;
    private readonly platform: Platform = 'Steam';
    private readonly source: Source = 'Steam';

    constructor(achievementWatcherRootPath: string, listingType: 0 | 1 | 2) {
        this.achievementWatcherRootPath = achievementWatcherRootPath;
        this.listingType = listingType;
    }

    getPlatform(): Platform {
        return this.platform;
    }

    getSource(): Source {
        return this.source;
    }

    async getUnlockedOrInProgressAchievements(game: ScanResult): Promise<UnlockedOrInProgressAchievement[]> {
        const steamUser: string = (<SteamUser>game.data.userId).user;
        let activeAchievements: UnlockedOrInProgressAchievement[] = [];

        const cachePaths = {
            local: path.join(this.achievementWatcherRootPath, 'steam_cache/user', steamUser, `${game.appId}.db`),
            steam: path.join(<string>game.data.cachePath, 'UserGameStats_' + steamUser + '_' + game.appId + '.bin')
        };

        const cacheTime = {
            local: 0,
            steam: 0
        };

        try {
            const localCacheStats = await fs.stat(cachePaths.local);
            cacheTime.local = moment(localCacheStats.mtime).valueOf();
        } catch (error) {
            /* istanbul ignore next */
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        try {
            const steamCacheStats = await fs.stat(cachePaths.steam);
            cacheTime.steam = moment(steamCacheStats.mtime).valueOf();
        } catch(error) {
            throw new SteamGameCacheNotFound(game.appId);
        }

        if (cacheTime.steam > cacheTime.local) {
            activeAchievements = await CloudClient.getSteamUserStats(steamUser, game.appId);
            await fs.mkdir(path.dirname(cachePaths.local), { recursive: true });
            await fs.writeFile(cachePaths.local, JSON.stringify(activeAchievements, null, 2));
        } else {
            activeAchievements = JSON.parse(await fs.readFile(cachePaths.local, 'utf8'));
        }

        return activeAchievements;
    }

    async getGameSchema(appId: string, language: string): Promise<GameSchema> {
        return SteamUtils.getGameSchema(this.achievementWatcherRootPath, appId, language);
    }

    async scan(): Promise<ScanResult[]> {
        const scanResults: ScanResult[] = [];

        if (this.listingType > 0) {
            const steamPath = await Steam.getSteamPath();
            const steamCachePath = path.join(steamPath, 'appcache/stats');
            const publicUsers = await Steam.getPublicSteamUsers(steamPath);

            const steamGames: SteamGameMetadata[] = (await glob('UserGameStats_*([0-9])_*([0-9]).bin', {
                cwd: steamCachePath,
                onlyFiles: true,
                absolute: false
            })).map((filename: string) => {
                const matches: RegExpMatchArray = <RegExpMatchArray>filename.match(/([0-9]+)/g);
                return {
                    userId: matches[0],
                    appId: matches[1]
                };
            });

            for (const game of steamGames) {
                let isInstalled = true;
                if (this.listingType == 1) {
                    isInstalled = (await regedit.promises.RegQueryIntegerValue('HKCU',
                        'Software/Valve/Steam/Apps/' + game.appId, 'Installed') === '1');
                }

                const user: SteamUser = <SteamUser> publicUsers.find((user: SteamUser) => {
                    return user.user == game.userId;
                });

                if (user && isInstalled) {
                    scanResults.push({
                        appId: game.appId,
                        source: 'Steam',
                        platform: 'Steam',
                        data: {
                            userId: user,
                            cachePath: steamCachePath
                        }
                    });
                }
            }
        }

        return scanResults;
    }
}

export {Steam};