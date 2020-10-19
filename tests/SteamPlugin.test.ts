import {SteamNotFoundError, WrongSourceDetectedError} from '../src/lib/utils/Errors';
import {InternalError} from 'cloud-client';
import {ScanResult} from '../src/types';
import {Steam} from '../src/lib/plugins/Steam';
import {expect} from 'chai';
import path from 'path';
import {step} from 'mocha-steps';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import windows from 'windows';

if (process.env.CI) {
    const achievementWatcherTestRootPath: string = path.join(__dirname, 'tmp/appData/Achievement Watcher Test');
    const steamSamplePath: string = path.join(__dirname, 'samples/steam');
    const steamWithoutUsersSamplePath: string = path.join(__dirname, 'samples/steam-wu');

    describe('Testing Steam Plugin', () => {
        context('Steam not installed', () => {
            before('Set registry to the desired states', () => {
                windows.registry('HKCU/Software/Valve/Steam').SteamPath.remove();
                windows.registry('HKLM/Software/WOW6432Node/Valve/Steam').InstallPath.remove();
            });

            context('With Listing Type = 0', () => {
                const steam = new Steam(achievementWatcherTestRootPath, 0);
                it('Scan returns an empty list', async () => {
                    expect(await steam.scan()).to.be.empty;
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
            before('Set registry to the desired states', () => {
                windows.registry('HKCU/Software/Valve/Steam').add('SteamPath', steamWithoutUsersSamplePath, true);
                windows.registry('HKLM/Software/WOW6432Node/Valve/Steam').add('InstallPath', 'D:\\Games\\Sparrow\\Oxygen Not Included\\Steam', true);
            });

            context('With Listing Type = 2', () => {
                const steam = new Steam(achievementWatcherTestRootPath, 2);

                it('Scan returns SteamPublicUsersNotFoundError', (done) => {
                    steam.scan().catch((error) => {
                        if (error instanceof SteamNotFoundError) {
                            done();
                        }
                    })
                });
            });
        });

        context('Steam installed, non public users', () => {
            before('Set registry to the desired states', () => {
                windows.registry('HKCU/Software/Valve/Steam').add('SteamPath', steamWithoutUsersSamplePath);
                windows.registry('HKCU/Software/Valve/Steam/Users').add('76561198160327197', 1);
                windows.registry('HKLM/Software/WOW6432Node/Valve/Steam').add('InstallPath', 'D:\\Games\\Sparrow\\Oxygen Not Included\\Steam');
            });

            context('With Listing Type = 2', () => {
                const steam = new Steam(achievementWatcherTestRootPath, 2);

                it('Scan returns SteamPublicUsersNotFoundError', (done) => {
                    steam.scan().catch((error) => {
                        if (error instanceof SteamNotFoundError) {
                            done();
                        }
                    })
                });
            });
        });

        context('Steam installed', () => {
            const installedGameId = '76561198058952831';

            before('Set registry to the desired states', () => {
                windows.registry('HKCU/Software/Valve/Steam').add('SteamPath', steamSamplePath);
                windows.registry('HKCU/Software/Valve/Steam/Apps/1069740').add('Installed', 1);
                windows.registry('HKCU/Software/Valve/Steam/Users').add(installedGameId, 1);
                windows.registry('HKLM/Software/WOW6432Node/Valve/Steam').add('InstallPath', 'D:\\Games\\Sparrow\\Oxygen Not Included\\Steam');
            });

            context('With Listing Type = 1', () => {
                const steam = new Steam(achievementWatcherTestRootPath, 1);

                it('Scan returns installed games', async () => {
                    const listOfGames: ScanResult[] = await steam.scan();
                    expect(listOfGames.length).to.be.equal(1);
                    expect(listOfGames.filter((game: ScanResult) => {
                        return game.appId === installedGameId;
                    }))
                });
            });

            context('With Listing Type = 2', () => {
                const steam = new Steam(achievementWatcherTestRootPath, 2);
                let listOfGames: ScanResult[];

                step('Scan works', async () => {
                    listOfGames = await steam.scan();
                    expect(listOfGames.length).to.be.greaterThan(0);
                });

                step('Get schemas', async () => {
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

                step('Get active achievements', async () => {
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
            });
        });
    });
}