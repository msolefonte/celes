import {existsAndIsYoungerThan, normalizeTimestamp} from '../src/lib/plugins/utils/common';
import {GameData, Platform} from '../src/types';
import {InvalidApiVersionError, PlatformNotAvailableError} from '../src/lib/utils/errors';
import {CelesDbConnector} from '../src/lib/utils/CelesDbConnector';
import {expect} from 'chai';
import {getGameSchema} from '../src/lib/utils/utils';
import {isEqual} from 'lodash';
import {mergeGameDataCollections} from '../src/lib/utils/merger';
import path from 'path';

const achievementWatcherSamplesRootPath: string = path.join(__dirname, 'samples/achievement-watcher/');
const gdc1: GameData[] = [
    {
        apiVersion: 'v1',
        appId: '382890',
        platform: 'Steam',
        schema: {
            name: 'FINAL FANTASY V',
            img: {
                header: 'https://steamcdn-a.akamaihd.net/steam/apps/382890/header.jpg',
                background: 'https://steamcdn-a.akamaihd.net/steam/apps/382890/page_bg_generated_v6b.jpg',
                portrait: 'https://steamcdn-a.akamaihd.net/steam/apps/382890/library_600x900.jpg',
                hero: 'https://steamcdn-a.akamaihd.net/steam/apps/382890/library_hero.jpg',
                icon: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/382890/14385c9fc1e08408c9675c7ebe51836c4cb269b3.jpg'
            },
            achievements: {
                total: 1,
                list: [
                    {
                        name: 'com.square_enix.kvin.achieve1',
                        displayName: 'FINAL FANTASY V Master',
                        hidden: 0,
                        description: 'You earned all achievements.',
                        icon: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/382890/a6cd3741b8021aad428bb86b13e9e1d295b3cb2d.jpg',
                        icongray: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/382890/f38391142c528dda603f5843752aeae32295ab64.jpg'
                    }
                ]
            }
        },
        stats: {
            sources: [
                {
                    source: 'Codex',
                    achievements: {
                        active: [
                            {
                                name: 'progressColissionTest',
                                achieved: 0,
                                currentProgress: 5,
                                maxProgress: 10,
                                unlockTime: 0
                            },
                            {
                                name: 'unlockTimeColissionTest',
                                achieved: 0,
                                currentProgress: 0,
                                maxProgress: 0,
                                unlockTime: 5
                            }
                        ]
                    }
                }
            ],
            playtime: 0
        }
    }
]

const gdc2: GameData[] = [
    {
        apiVersion: 'v1',
        appId: '382890',
        platform: 'Steam',
        schema: {
            name: 'FINAL FANTASY V',
            img: {
                header: 'https://steamcdn-a.akamaihd.net/steam/apps/382890/header.jpg',
                background: 'https://steamcdn-a.akamaihd.net/steam/apps/382890/page_bg_generated_v6b.jpg',
                portrait: 'https://steamcdn-a.akamaihd.net/steam/apps/382890/library_600x900.jpg',
                hero: 'https://steamcdn-a.akamaihd.net/steam/apps/382890/library_hero.jpg',
                icon: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/382890/14385c9fc1e08408c9675c7ebe51836c4cb269b3.jpg'
            },
            achievements: {
                total: 2,
                list: [
                    {
                        name: 'com.square_enix.kvin.achieve1',
                        displayName: 'FINAL FANTASY V Master',
                        hidden: 0,
                        description: 'You earned all achievements.',
                        icon: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/382890/a6cd3741b8021aad428bb86b13e9e1d295b3cb2d.jpg',
                        icongray: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/382890/f38391142c528dda603f5843752aeae32295ab64.jpg'
                    },
                    {
                        name: 'com.square_enix.kvin.achieve2',
                        displayName: 'Say Hello, Syldra!',
                        hidden: 0,
                        description: 'You obtained the pirate ship.',
                        icon: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/382890/12b83f0e61326e0376f5d7df6b62b87270d3450d.jpg',
                        icongray: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/382890/f38391142c528dda603f5843752aeae32295ab64.jpg'
                    }
                ]
            }
        },
        stats: {
            sources: [
                {
                    source: 'Codex',
                    achievements: {
                        active: [
                            {
                                name: 'progressColissionTest',
                                achieved: 0,
                                currentProgress: 6,
                                maxProgress: 10,
                                unlockTime: 0
                            },
                            {
                                name: 'unlockTimeColissionTest',
                                achieved: 0,
                                currentProgress: 0,
                                maxProgress: 0,
                                unlockTime: 6
                            }
                        ]
                    }
                }
            ],
            playtime: 0
        }
    }
]

const readmeFile: string = path.join(__dirname, 'samples/README.md');
const samplesFolder: string = path.join(__dirname, 'samples/');

describe('Testing Utils', () => {
    context('Merger library', () => {
        it('Collision between same game schemas returns more complete schema', () => {
            const mergedGameDataCollection: GameData[] = mergeGameDataCollections([gdc1, gdc2]);
            expect(mergedGameDataCollection.length).to.be.equal(1);
            expect(isEqual(mergedGameDataCollection[0].schema, gdc2[0].schema)).to.be.equal(true);
        });

        it('Collision between progressions returns bigger progression', () => {
            const mergedGameDataCollection: GameData[] = mergeGameDataCollections([gdc1, gdc2]);
            expect(mergedGameDataCollection.length).to.be.equal(1);
            expect(isEqual(
                mergedGameDataCollection[0].stats.sources[0].achievements.active[1].currentProgress,
                gdc2[0].stats.sources[0].achievements.active[1].currentProgress
            )).to.be.equal(true);
        });

        it('Collision between unlock times returns smaller unlock time', () => {
            const mergedGameDataCollection: GameData[] = mergeGameDataCollections([gdc1, gdc2], false);
            expect(mergedGameDataCollection[0].stats.sources[0].achievements.active[1].unlockTime).to.be.equal(
                gdc2[0].stats.sources[0].achievements.active[1].unlockTime
            );
        });

        it('Collision between unlock times (useOldestUnlockTime = false) returns bigger unlock time', () => {
            const mergedGameDataCollection: GameData[] = mergeGameDataCollections([gdc1, gdc2]);
            expect(mergedGameDataCollection[0].stats.sources[0].achievements.active[1].unlockTime).to.be.equal(
                gdc1[0].stats.sources[0].achievements.active[1].unlockTime
            );
        });
    });

    context('CelesDbConnector library', () => {
        const celesDbConnector: CelesDbConnector = new CelesDbConnector(achievementWatcherSamplesRootPath);
        it('Invalid API version returns InvalidApiVersionError', (done) => {
            celesDbConnector.getAll('english').catch((error) => {
                if (error instanceof InvalidApiVersionError) {
                    done();
                }
            });
        });
    });

    context('General utils', () => {
        context('getGameSchema()', () => {
            it('Invalid platform returns PlatformNotAvailableError', (done) => {
                getGameSchema('', '', <Platform>'invalid', '').catch((error) => {
                    if (error instanceof PlatformNotAvailableError) {
                        done();
                    }
                })
            });
        });

        context('existsAndIsYoungerThan()', () => {
            it('Defaults return no errors', async () => {
                await existsAndIsYoungerThan(readmeFile);
            });

            it('Checking file as dir returns false', async () => {
                expect(await existsAndIsYoungerThan(readmeFile, 3, 'months', true)).to.be.false;
            });

            it('Checking folder as file returns false', async () => {
                expect(await existsAndIsYoungerThan(samplesFolder, 15, 'seconds', false)).to.be.false;
            });

            it('Checking invalid path returns false', async () => {
                expect(await existsAndIsYoungerThan('invalid', 15, 'seconds', false)).to.be.false;
            });
        });

        context('normalizeTimestamp()', () => {
            it('Wrong time value returns 0', () => {
                expect(normalizeTimestamp('invalid')).to.be.equal(0);
            });
        });
    });

});