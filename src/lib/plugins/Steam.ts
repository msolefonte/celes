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
import {existsSync, promises as fs} from 'fs';
import {AchievementsScraper} from './utils/AchievementsScraper';
import {CloudClient} from 'cloud-client';
import {SteamIdUtils} from './utils/SteamIdUtils';
import {SteamNotFoundError, SteamPublicUsersNotFoundError} from '../utils/Errors';
import {SteamUtils} from './utils/SteamUtils';
import glob from 'fast-glob';
import mkdirp from 'mkdirp';
import moment from 'moment';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import regedit from 'regodit'; // TODO LOOK FOR ALTERNATIVES

class Steam implements AchievementsScraper {
    private static async getSteamPath(): Promise<string> {
        /*
          Some SteamEmu change HKCU/Software/Valve/Steam/SteamPath to the game's dir
          Fallback to Software/WOW6432Node/Valve/Steam/InstallPath in this case
          NB: Steam client correct the key on startup
        */ // TODO TURN INTO DOCS

        const regHives = [
            {root: 'HKCU', key: 'Software/Valve/Steam', name: 'SteamPath'},
            {root: 'HKLM', key: 'Software/WOW6432Node/Valve/Steam', name: 'InstallPath'}
        ];

        for (const regHive of regHives) {
            const steamPath: string = await regedit.promises.RegQueryStringValue(regHive.root, regHive.key, regHive.name);
            if (steamPath) {
                if (existsSync(path.join(steamPath, 'steam.exe'))) {
                    return steamPath;
                }
            }
        }

        throw new SteamNotFoundError();
    }

    private static async getPublicSteamUsers(steamPath: string): Promise<SteamUser[]> {
        const steamUsers: SteamUser[] = [];

        let users: (string | number)[] = await regedit.promises.RegListAllSubkeys('HKCU', 'Software/Valve/Steam/Users');
        if (!users) {  // TODO ADD TEST NOT USERS
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

        return steamUsers;
    }

    private readonly achievementWatcherRootPath: string;
    private readonly listingType: 0 | 1 | 2;
    private readonly source: Source = 'Steam';

    constructor(achievementWatcherRootPath: string, listingType: 0 | 1 | 2) {
        this.achievementWatcherRootPath = achievementWatcherRootPath;
        this.listingType = listingType;
    }

    getPlatform(): Platform {
        return 'Steam';
    }

    getSource(): Source {
        return this.source;
    }

    async getUnlockedOrInProgressAchievements(game: ScanResult): Promise<UnlockedOrInProgressAchievement[]> {
        let activeAchievements: UnlockedOrInProgressAchievement[] = [];

        let steamUser = '';
        if (game.data.userId !== undefined && game.data.userId.user !== undefined) {
            steamUser = game.data.userId.user;
        }

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
            if (Object.keys(localCacheStats).length > 0) {
                cacheTime.local = moment(localCacheStats.mtime).valueOf();
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        const steamCacheStats = await fs.stat(cachePaths.steam);
        if (Object.keys(steamCacheStats).length > 0) {
            cacheTime.steam = moment(steamCacheStats.mtime).valueOf();
        } else {
            throw 'No Steam cache file found';  // TODO ADD TEST AND PROPER ERROR
        }

        if (cacheTime.steam > cacheTime.local) {
            try {
                activeAchievements = await CloudClient.getSteamUserStats(steamUser, game.appId);
            } catch (e) {
                console.log('ERROR', game.appId, ':', e.message);  // TODO NOT FOUND ERROR?
                // throw e;
            }
            await mkdirp(path.dirname(cachePaths.local));
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
                            type: 'steamAPI',
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