import {
    SteamGameCacheNotFound,
    SteamNotFoundError,
    SteamPublicUsersNotFoundError,
    WrongSourceDetectedError
} from '../src/lib/utils/Errors';
import {createKeyBackup, recoverKeyBackup} from './utils/Common';
import {existsSync, unlinkSync} from 'fs';
import {InternalError} from 'cloud-client';
import {ScanResult} from '../src/types';
import {Steam} from '../src/lib/plugins/Steam';
import {expect} from 'chai';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import regedit from 'regodit';
import {step} from 'mocha-steps';

const achievementWatcherTestRootPath: string = path.join(__dirname, 'tmp/appData/Achievement Watcher Test');
const steamPrivateUserId = '76561198160327197';
const steamSampleInstalledGameId = '1069740';
const steamSamplePath: string = path.join(__dirname, 'samples/steam');
const steamSampleUserId = '98687103';
const steamWithoutUsersSamplePath: string = path.join(__dirname, 'samples/steam-wu');

describe('Testing Steam Plugin', () => {
    context('Steam not installed', () => {
        before('Set registry to the desired states', async () => {
            await createKeyBackup('HKCU', 'Software/Valve/Steam', 'Software/Valve/Steam.AW.BKP');
            await createKeyBackup('HKLM', 'Software/WOW6432Node/Valve/Steam', 'Software/WOW6432Node/Valve/Steam.AW.BKP');
            await regedit.promises.RegDeleteKeyIncludingSubkeys('HKCU', 'Software/Valve/Steam/');
            await regedit.promises.RegDeleteKeyIncludingSubkeys('HKLM', 'Software/WOW6432Node/Valve/Steam/');
        });

        after('Set registry to the default states', async () => {
            await recoverKeyBackup('HKCU', 'Software/Valve/Steam', 'Software/Valve/Steam.AW.BKP');
            await recoverKeyBackup('HKLM', 'Software/WOW6432Node/Valve/Steam', 'Software/WOW6432Node/Valve/Steam.AW.BKP');
        });

        context('With Listing Type = 0', () => {
            const steam = new Steam(achievementWatcherTestRootPath, 0);
            it('Scan returns an empty list', async () => {
                expect(await steam.scan()).to.be.empty;
            });

            it('Platform is returned', async () => {
                expect(await steam.getPlatform()).to.be.equal('Steam');
            });

            it('Source is returned', async () => {
                expect(await steam.getSource()).to.be.equal('Steam');
            });
        });

        context('With Listing Type = 1', () => {
            const steam = new Steam(achievementWatcherTestRootPath, 1);
            it('Scan returns SteamNotFoundError', (done) => {
                steam.scan().catch((error) => {
                    if (error instanceof SteamNotFoundError) {
                        done();
                    }
                })
            });
        });

        context('With Listing Type = 2', () => {
            const steam = new Steam(achievementWatcherTestRootPath, 1);
            it('Scan returns SteamNotFoundError', (done) => {
                steam.scan().catch((error) => {
                    if (error instanceof SteamNotFoundError) {
                        done();
                    }
                })
            });
        });
    });

    context('Steam installed, non existent users', () => {
        before('Set registry to the desired states', async () => {
            await createKeyBackup('HKCU', 'Software/Valve/Steam', 'Software/Valve/Steam.AW.BKP');
            await createKeyBackup('HKLM', 'Software/WOW6432Node/Valve/Steam', 'Software/WOW6432Node/Valve/Steam.AW.BKP');
            await regedit.promises.RegDeleteKeyIncludingSubkeys('HKCU', 'Software/Valve/Steam/');
            await regedit.promises.RegWriteStringValue('HKCU', 'Software/Valve/Steam/', 'SteamPath', steamWithoutUsersSamplePath);
        });

        after('Set registry to the default states', async () => {
            await recoverKeyBackup('HKCU', 'Software/Valve/Steam', 'Software/Valve/Steam.AW.BKP');
            await recoverKeyBackup('HKLM', 'Software/WOW6432Node/Valve/Steam', 'Software/WOW6432Node/Valve/Steam.AW.BKP');
        });

        context('With Listing Type = 2', () => {
            const steam = new Steam(achievementWatcherTestRootPath, 2);

            it('Scan throws SteamPublicUsersNotFoundError', (done) => {
                steam.scan().catch((error) => {
                    if (error instanceof SteamPublicUsersNotFoundError) {
                        done();
                    }
                })
            });
        });
    });

    context('Steam installed, non public users', () => {
        before('Set registry to the desired states', async () => {
            await createKeyBackup('HKCU', 'Software/Valve/Steam', 'Software/Valve/Steam.AW.BKP');
            await createKeyBackup('HKLM', 'Software/WOW6432Node/Valve/Steam', 'Software/WOW6432Node/Valve/Steam.AW.BKP');
            await regedit.promises.RegDeleteKeyIncludingSubkeys('HKCU', 'Software/Valve/Steam/');
            await regedit.promises.RegWriteStringValue('HKCU', 'Software/Valve/Steam/', 'SteamPath', steamWithoutUsersSamplePath);
            await regedit.promises.RegWriteKey('HKCU', 'Software/Valve/Steam/Users/' + steamPrivateUserId);
        });

        after('Set registry to the default states', async () => {
            await recoverKeyBackup('HKCU', 'Software/Valve/Steam', 'Software/Valve/Steam.AW.BKP');
            await recoverKeyBackup('HKLM', 'Software/WOW6432Node/Valve/Steam', 'Software/WOW6432Node/Valve/Steam.AW.BKP');
        });

        context('With Listing Type = 2', () => {
            const steam = new Steam(achievementWatcherTestRootPath, 2);

            it('Scan throws SteamPublicUsersNotFoundError', (done) => {
                steam.scan().catch((error) => {
                    if (error instanceof SteamPublicUsersNotFoundError) {
                        done();
                    }
                })
            });
        });
    });

    context('Steam installed', () => {
        before('Set registry to the desired states', async () => {
            await createKeyBackup('HKCU', 'Software/Valve/Steam', 'Software/Valve/Steam.AW.BKP');
            await createKeyBackup('HKLM', 'Software/WOW6432Node/Valve/Steam', 'Software/WOW6432Node/Valve/Steam.AW.BKP');
            await regedit.promises.RegDeleteKeyIncludingSubkeys('HKCU', 'Software/Valve/Steam/');
            await regedit.promises.RegWriteDwordValue('HKCU', 'Software/Valve/Steam/Apps/' + steamSampleInstalledGameId, 'Installed', 1);
            await regedit.promises.RegWriteStringValue('HKCU', 'Software/Valve/Steam/', 'SteamPath', steamSamplePath);
            await regedit.promises.RegWriteKey('HKCU', 'Software/Valve/Steam/Users/' + steamSampleUserId);
        });

        after('Set registry to the default states', async () => {
            await recoverKeyBackup('HKCU', 'Software/Valve/Steam', 'Software/Valve/Steam.AW.BKP');
            await recoverKeyBackup('HKLM', 'Software/WOW6432Node/Valve/Steam', 'Software/WOW6432Node/Valve/Steam.AW.BKP');
        });

        context('With Listing Type = 1', () => {
            const steam = new Steam(achievementWatcherTestRootPath, 1);

            it('Scan returns installed games', async () => {
                const listOfGames: ScanResult[] = await steam.scan();
                expect(listOfGames.length).to.be.equal(1);
                expect(listOfGames.filter((game: ScanResult) => {
                    return game.appId === steamSampleInstalledGameId;
                }))
            });
        });

        context('With Listing Type = 2', () => {
            const steam = new Steam(achievementWatcherTestRootPath, 2);
            let listOfGames: ScanResult[];

            before('Remove user cache if existent', () => {
                const cacheFile = path.join(achievementWatcherTestRootPath, 'steam_cache/user', steamSampleUserId, `${steamSampleInstalledGameId}.db`);
                if (existsSync(cacheFile)) {
                    unlinkSync(cacheFile);
                }
            });

            step('Scan works', async () => {
                listOfGames = await steam.scan();
                expect(listOfGames.length).to.be.greaterThan(0);
            });

            step('Get schemas works', async () => {
                for (const game of listOfGames) {
                    try {
                        await steam.getGameSchema(game.appId, 'english');
                    } catch (error) {
                        // TODO BlacklistedIdError is not thrown anymore. Now its InternalError
                        if (!(error instanceof InternalError)) {
                            throw error;
                        }
                    }
                }
            });

            step('Get active achievements works', async () => {
                for (const game of listOfGames) {
                    try {
                        await steam.getUnlockedOrInProgressAchievements(game);
                    } catch (error) {
                        if (!(error instanceof WrongSourceDetectedError)) {
                            throw error;
                        }
                    }
                }
            });

            step('Get active achievements again (force cache usage) works', async () => {
                for (const game of listOfGames) {
                    try {
                        await steam.getUnlockedOrInProgressAchievements(game);
                    } catch (error) {
                        if (!(error instanceof WrongSourceDetectedError)) {
                            throw error;
                        }
                    }
                }
            });

            step('Get active achievements of a wrong game throws SteamGameCacheNotFound', (done) => {
                steam.getUnlockedOrInProgressAchievements({
                        appId: '1',
                        source: 'Steam',
                        platform: 'Steam',
                        data: {
                            userId: { user: '98687103', id: '76561198058952831', name: 'Wolfy' },
                            cachePath: path.join(steamSamplePath, 'appcache/stats')
                        }
                    }
                ).catch((error) => {
                    if (error instanceof SteamGameCacheNotFound) {
                        done()
                    }
                });
            });
        });
    });
});