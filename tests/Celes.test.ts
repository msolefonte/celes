import * as path from 'path';
import {FileNotFoundError, InvalidApiVersionError} from '../src/lib/utils/errors';
import {GameData, ScrapResult, Source, SourceStats} from '../src/types';
import {createKeyBackup, recoverKeyBackup} from './utils/registryBackup';
import {existsSync, unlinkSync} from 'fs';
import {Celes} from '../src';
import {isValidGameData} from './utils/validation';
import {expect} from 'chai';
import {promises as fs} from 'fs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import regedit from 'regodit';
import {step} from 'mocha-steps';

const achievementWatcherTestRootPath: string = path.join(__dirname, 'tmp/appData/Achievement Watcher Test');
const celesDbPath: string = path.join(achievementWatcherTestRootPath, 'celes/db');
const importExportInvalidFile: string = path.join(__dirname, 'samples/other/importFileInvalid.awb');
const importExportEmptyDataFile: string = path.join(__dirname, 'samples/other/importFileEmptyData.awb');
const importExportNonExistentFile: string = path.join(__dirname, 'samples/other/importFileNonExistent.awb');
const importExportValidFile: string = path.join(__dirname, 'tmp/export.awb');
const importExportWrongVersionFile: string = path.join(__dirname, 'samples/other/importFileWrongVersion.awb');

const tdmAppIds: string[] = ['240970', '683280'];
const ali213AppIds: string[] = ['382890'];
const codexAppIds: string[] = ['255710', '382900', '1097840', '1184050'];
const creamApiAppIds: string[] = ['883710'];
const darksidersApiAppIds: string[] = ['774361'];
const goldbergAppIds: string[] = ['883710', '1113000'];
const greenLumaAppIds: string[] = ['228300', '1097840'];
const reloadedAppIds: string[] = ['311210', '312750'];
const sseAppIds: string[] = ['45760', '228300'];
const skidrowAppIds: string[] = ['474960', '584980'];
const validSamplesFolders: string[] = [
    path.join(__dirname, 'samples/achievements/valid/3dm/'),
    path.join(__dirname, 'samples/achievements/valid/ali213/'),
    path.join(__dirname, 'samples/achievements/valid/codex/'),
    path.join(__dirname, 'samples/achievements/valid/codex_duplicates/'),
    path.join(__dirname, 'samples/achievements/valid/creamAPI/'),
    path.join(__dirname, 'samples/achievements/valid/darksiders/'),
    path.join(__dirname, 'samples/achievements/valid/darksiders_duplicates/'),
    path.join(__dirname, 'samples/achievements/valid/goldberg/'),
    path.join(__dirname, 'samples/achievements/valid/reloaded/'),
    path.join(__dirname, 'samples/achievements/valid/sse/'),
    path.join(__dirname, 'samples/achievements/valid/skidrow/'),
];

const invalidSamplesFolders: string[] = [
    path.join(__dirname, 'samples/achievements/invalid/codex/'),
    path.join(__dirname, 'samples/achievements/invalid/sse/')
];

function areAllAppIdsInTheGameDataCollection(appIds: string[], gameDataCollection: GameData[], source: Source) {
    const filteredGameDataCollection: GameData[] = [];
    for (const gameData of gameDataCollection) {
        for (const sourceStats of gameData.stats.sources) {
            if (sourceStats.source === source) {
                filteredGameDataCollection.push(gameData);
                break;
            }
        }
    }

    return appIds.every((appId: string) => {
        return filteredGameDataCollection.map((gameData: GameData) => gameData.appId).includes(appId);
    });
}

describe('Testing Celes API', () => {
    context('Without samples', () => {
        const celes = new Celes(achievementWatcherTestRootPath);
        before('Deleting Celes database if existent', () => {
            if (existsSync(celesDbPath)) {
                fs.rmdir(celesDbPath, { recursive: true });
            }
        });

        before('Deleting exported file if existent', () => {
            if (existsSync(importExportValidFile)) {
                unlinkSync(importExportValidFile);
            }
        });

        describe('Pull', () => {
            it('Progress has arrived to 100%', async () => {
                let progress = 0;
                await celes.pull((p => {
                    progress = p;
                }));
                expect(progress).to.equal(100);
            });
        });

        describe('Load', () => {
            it('Progress has arrived to 100%', async () => {
                let progress = 0;
                await celes.load((p => {
                    progress = p;
                }));
                expect(progress).to.equal(100);
            });
        });

        describe('Import/Export', () => {
            step('Export worked', async () => {
                await celes.export(importExportValidFile);
            });

            step('Exported file exists', async () => {
                expect(existsSync(importExportValidFile)).to.be.true;
            });

            step('Import worked', async () => {
                await celes.import(importExportValidFile);
            });

            it('Nonexistent file throws a FileNotFoundError', (done) => {
                celes.import(importExportNonExistentFile).catch((error) => {
                    {
                        if (error instanceof FileNotFoundError) {
                            done();
                        }
                    }
                });
            });

            it('Invalid file throws a SyntaxError', (done) => {
                celes.import(importExportInvalidFile).catch((error) => {
                    {
                        if (error instanceof SyntaxError) {
                            done();
                        }
                    }
                });
            });

            it('Invalid API version throws an InvalidApiVersionError', (done) => {
                celes.import(importExportWrongVersionFile).catch((error) => {
                    {
                        if (error instanceof InvalidApiVersionError) {
                            done();
                        }
                    }
                });
            });
        });
    });

    context('With valid samples', async () => {
        const celes = new Celes(achievementWatcherTestRootPath, validSamplesFolders, undefined, 0);

        before('Replacing or creating 382900\'s cache with an outdated birthtime', () => {
            const pathTo382900Cache: string = path.join(achievementWatcherTestRootPath, 'steam_cache/schema/english/382900.json');
            if (existsSync(pathTo382900Cache)) {
                unlinkSync(pathTo382900Cache);
            }
        });

        before('Deleting exported file if existent', () => {
            if (existsSync(importExportValidFile)) {
                unlinkSync(importExportValidFile);
            }
        });

        before('Set registry to the desired states', async () => {
            await createKeyBackup('HKCU', 'SOFTWARE/GLR/AppID', 'SOFTWARE/GLR/AppID.AW.BKP');
            await createKeyBackup('HKCU', 'SOFTWARE/GL2020/AppID', 'SOFTWARE/GL2020/AppID.AW.BKP');
            await regedit.promises.RegWriteDwordValue('HKCU', 'SOFTWARE/GL2020/AppID/1', 'SkipStatsAndAchievements', '00000001');
            await regedit.promises.RegWriteDwordValue('HKCU', 'SOFTWARE/GL2020/AppID/1097840', 'SkipStatsAndAchievements', '00000000');
            await regedit.promises.RegWriteDwordValue('HKCU', 'SOFTWARE/GL2020/AppID/1097840/Achievements', 'CompleteBootCamp', '00000001');
            await regedit.promises.RegWriteDwordValue('HKCU', 'SOFTWARE/GL2020/AppID/1097840/Achievements', 'CompleteBootCamp_Time', '5e52b974');
            await regedit.promises.RegWriteDwordValue('HKCU', 'SOFTWARE/GLR/AppID/228300', 'SkipStatsAndAchievements', '00000000');
            await regedit.promises.RegWriteDwordValue('HKCU', 'SOFTWARE/GLR/AppID/228300/Achievements', 'Achievement_1', '00000001');
        });

        after('Set registry to the default states', async () => {
            await recoverKeyBackup('HKCU', 'SOFTWARE/GLR/AppID', 'SOFTWARE/GLR/AppID.AW.BKP');
            await recoverKeyBackup('HKCU', 'SOFTWARE/GL2020/AppID', 'SOFTWARE/GL2020/AppID.AW.BKP');
        });

        describe('Pull', () => {
            let scrapResult: ScrapResult;
            let progress: number;

            after('Print errors', () => {
                if (scrapResult.error !== undefined) {
                    console.error(scrapResult.error);
                }
            })

            step('Obtained results', async () => {
                scrapResult = await celes.pull((p => {
                    progress = p;
                }));
            });

            step('Progress has arrived to 100%', async () => {
                expect(progress).to.equal(100);
            });

            step('Scrap result error does not exist', async () => {
                expect(scrapResult.error !== undefined && scrapResult.error.length != 0).to.be.false;
            });

            step('Scrap result data is a list of GameData objects', async () => {
                let resultIsValid = true;

                for (let i = 0; i < scrapResult.data.length; i++) {
                    if (!isValidGameData(scrapResult.data[i])) {
                        resultIsValid = false;
                    }
                }

                expect(resultIsValid).to.be.true;
            });

            step('All active achievement names are in the schemas', async () => {
                for (const gameData of scrapResult.data) {
                    for (const sourceStats of gameData.stats.sources) {
                        for (const activeAchievement of sourceStats.achievements.active) {
                            let schemaFound = false;
                            for (const achievement of gameData.schema.achievements.list) {
                                if (achievement.name === activeAchievement.name) {
                                    schemaFound = true;
                                    break;
                                }
                            }

                            if (!schemaFound) {
                                throw new Error(gameData.platform + ':' + sourceStats.source + ':' + gameData.appId +
                                    ':' + activeAchievement.name+ ' not in schema');
                            }
                        }
                    }
                }
            });

            step('All active achievement unlock times are valid', () => {
                for (const gameData of scrapResult.data) {
                    for (const sourceStats of gameData.stats.sources) {
                        for (const activeAchievement of sourceStats.achievements.active) {
                            if (typeof activeAchievement.unlockTime !== 'number') {
                                throw new Error(gameData.platform + ':' + sourceStats.source + ':' + gameData.appId +
                                    ':' + activeAchievement.name+ ' => ' + activeAchievement.unlockTime +
                                    ' is not a number');
                            }
                            if (activeAchievement.unlockTime !== 0 && (activeAchievement.unlockTime < 1000000000000 ||
                                activeAchievement.unlockTime > 2000000000000)) {
                                throw new Error(gameData.platform + ':' + sourceStats.source + ':' + gameData.appId +
                                    ':' + activeAchievement.name+ ' => ' + activeAchievement.unlockTime +
                                    ' is not valid. Possible wrong scale');
                            }
                        }
                    }
                }
            });

            step('All active achievement progress values are valid', async () => {
                for (const gameData of scrapResult.data) {
                    for (const sourceStats of gameData.stats.sources) {
                        for (const activeAchievement of sourceStats.achievements.active) {
                            if (typeof activeAchievement.currentProgress !== 'number') {
                                throw new Error(gameData.platform + ':' + sourceStats.source + ':' + gameData.appId +
                                    ':' + activeAchievement.name+ ' => CP ' + activeAchievement.currentProgress +
                                    ' is not a number');
                            }
                            if (typeof activeAchievement.maxProgress !== 'number') {
                                throw new Error(gameData.platform + ':' + sourceStats.source + ':' + gameData.appId +
                                    ':' + activeAchievement.name+ ' => MP ' + activeAchievement.maxProgress +
                                    ' is not a number');
                            }
                            if (activeAchievement.currentProgress < 0 || activeAchievement.currentProgress > 100) {
                                throw new Error(gameData.platform + ':' + sourceStats.source + ':' + gameData.appId +
                                    ':' + activeAchievement.name+ ' => CP ' + activeAchievement.currentProgress +
                                    ' is not valid');
                            }
                            if (activeAchievement.maxProgress !== 0 && activeAchievement.maxProgress !== 100) {
                                throw new Error(gameData.platform + ':' + sourceStats.source + ':' + gameData.appId +
                                    ':' + activeAchievement.name+ ' => MP ' + activeAchievement.maxProgress +
                                    ' is not valid');
                            }
                        }
                    }
                }
            });

            step('All 3DM games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(tdmAppIds, scrapResult.data, '3DM')).to.be.true;
            });

            step('All ALI213 games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(ali213AppIds, scrapResult.data, 'Ali213')).to.be.true;
            });

            step('All Codex games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(codexAppIds, scrapResult.data, 'Codex')).to.be.true;
            });

            step('All Cream API games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(creamApiAppIds, scrapResult.data, 'CreamAPI')).to.be.true;
            });

            step('All Darksiders games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(darksidersApiAppIds, scrapResult.data, 'Darksiders')).to.be.true;
            });

            step('All Goldberg games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(goldbergAppIds, scrapResult.data, 'Goldberg')).to.be.true;
            });

            step('All GreenLuma games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(greenLumaAppIds, scrapResult.data, 'GreenLuma')).to.be.true;
            });

            step('All Reloaded games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(reloadedAppIds, scrapResult.data, 'Reloaded')).to.be.true;
            });

            step('All SSE games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(sseAppIds, scrapResult.data, 'SmartSteamEmu')).to.be.true;
            });

            step('All Skidrow games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(skidrowAppIds, scrapResult.data, 'Skidrow')).to.be.true;
            });
        });

        describe('Load', () => {
            let gameDataCollection: GameData[];
            let progress: number;

            step('Obtained results', async () => {
                gameDataCollection = await celes.load((p => {
                    progress = p;
                }));
            });

            step('Progress has arrived to 100%', async () => {
                expect(progress).to.equal(100);
            });

            step('Result is a list of GameData objects', async () => {
                let resultIsValid = true;

                for (let i = 0; i < gameDataCollection.length; i++) {
                    if (!isValidGameData(gameDataCollection[i])) {
                        resultIsValid = false;
                    }
                }

                expect(resultIsValid).to.be.true;
            });

            step('All 3DM games were loaded', () => {
                expect(areAllAppIdsInTheGameDataCollection(tdmAppIds, gameDataCollection, '3DM')).to.be.true;
            });

            step('All ALI213 games were loaded', () => {
                expect(areAllAppIdsInTheGameDataCollection(ali213AppIds, gameDataCollection, 'Ali213')).to.be.true;
            });

            step('All Codex games were loaded', () => {
                expect(areAllAppIdsInTheGameDataCollection(codexAppIds, gameDataCollection, 'Codex')).to.be.true;
            });

            step('All Cream API games were loaded', () => {
                expect(areAllAppIdsInTheGameDataCollection(creamApiAppIds, gameDataCollection, 'CreamAPI')).to.be.true;
            });

            step('All Darksiders games were loaded', () => {
                expect(areAllAppIdsInTheGameDataCollection(darksidersApiAppIds, gameDataCollection, 'Darksiders')).to.be.true;
            });

            step('All Goldberg games were loaded', () => {
                expect(areAllAppIdsInTheGameDataCollection(goldbergAppIds, gameDataCollection, 'Goldberg')).to.be.true;
            });

            step('All GreenLuma games were loaded', () => {
                expect(areAllAppIdsInTheGameDataCollection(greenLumaAppIds, gameDataCollection, 'GreenLuma')).to.be.true;
            });

            step('All Reloaded games were loaded', () => {
                expect(areAllAppIdsInTheGameDataCollection(reloadedAppIds, gameDataCollection, 'Reloaded')).to.be.true;
            });

            step('All SSE games were loaded', () => {
                expect(areAllAppIdsInTheGameDataCollection(sseAppIds, gameDataCollection, 'SmartSteamEmu')).to.be.true;
            });

            step('All Skidrow games were loaded', () => {
                expect(areAllAppIdsInTheGameDataCollection(skidrowAppIds, gameDataCollection, 'Skidrow')).to.be.true;
            });
        });

        describe('Import/Export', () => {
            let gameDataCollection: GameData[];

            step('Export worked', async () => {
                await celes.export(importExportValidFile);
            });

            step('Import empty file (force mode) worked', async () => {
                gameDataCollection = await celes.import(importExportEmptyDataFile, true);
            });

            step('Game data is empty', async () => {
                expect(gameDataCollection).to.be.empty;
            });

            step('Import worked', async () => {
                gameDataCollection = await celes.import(importExportValidFile);
            });

            step('Result is a list of GameData objects', async () => {
                let isValid = true;

                for (let i = 0; i < gameDataCollection.length; i++) {
                    if (!isValidGameData(gameDataCollection[i])) {
                        isValid = false;
                    }
                }

                expect(isValid).to.be.true;
            });

            step('All 3DM games were imported', () => {
                expect(areAllAppIdsInTheGameDataCollection(tdmAppIds, gameDataCollection, '3DM')).to.be.true;
            });

            step('All ALI213 games were imported', () => {
                expect(areAllAppIdsInTheGameDataCollection(ali213AppIds, gameDataCollection, 'Ali213')).to.be.true;
            });

            step('All Codex games were imported', () => {
                expect(areAllAppIdsInTheGameDataCollection(codexAppIds, gameDataCollection, 'Codex')).to.be.true;
            });

            step('All Cream API games were imported', () => {
                expect(areAllAppIdsInTheGameDataCollection(creamApiAppIds, gameDataCollection, 'CreamAPI')).to.be.true;
            });

            step('All Darksiders games were imported', () => {
                expect(areAllAppIdsInTheGameDataCollection(darksidersApiAppIds, gameDataCollection, 'Darksiders')).to.be.true;
            });

            step('All Goldberg games were imported', () => {
                expect(areAllAppIdsInTheGameDataCollection(goldbergAppIds, gameDataCollection, 'Goldberg')).to.be.true;
            });

            step('All GreenLuma games were imported', () => {
                expect(areAllAppIdsInTheGameDataCollection(greenLumaAppIds, gameDataCollection, 'GreenLuma')).to.be.true;
            });

            step('All Reloaded games were imported', () => {
                expect(areAllAppIdsInTheGameDataCollection(reloadedAppIds, gameDataCollection, 'Reloaded')).to.be.true;
            });

            step('All SSE games were imported', () => {
                expect(areAllAppIdsInTheGameDataCollection(sseAppIds, gameDataCollection, 'SmartSteamEmu')).to.be.true;
            });

            step('All Skidrow games were imported', () => {
                expect(areAllAppIdsInTheGameDataCollection(skidrowAppIds, gameDataCollection, 'Skidrow')).to.be.true;
            });
        });

        describe('Add/set game playtime', () => {
            before('Preloading games', (done) => {
                celes.pull().then(() => {
                    done();
                })
            });

            step('Set game playtime', async () => {
                await celes.addGamePlaytime('382900', 'Steam', 36000, true);
            });

            step('Game playtime was updated correctly', async () => {
                const gameDataCollection: GameData[] = await celes.load();
                let itWorked = false;

                for (let i = 0; i < gameDataCollection.length; i++) {
                    if (gameDataCollection[i].appId === '382900') {
                        itWorked = gameDataCollection[i].stats.playtime === 36000;
                    }
                }

                expect(itWorked).to.be.true;
            });

            step('Add game playtime', async () => {
                await celes.addGamePlaytime('382900', 'Steam', 900);
            });

            step('Game playtime was set correctly', async () => {
                const gameDataCollection: GameData[] = await celes.load();
                let itWorked = false;

                for (let i = 0; i < gameDataCollection.length; i++) {
                    if (gameDataCollection[i].appId === '382900') {
                        itWorked = gameDataCollection[i].stats.playtime === 36900;
                    }
                }

                expect(itWorked).to.be.true;
            });
        });

        describe('Set achievement unlock time', () => {
            const appId = '1097840';
            const achievementId = 'Act1Chapter2StoryPoint';
            const unlockTime = 1600000000;

            step('Set achievement unlock time worked', async () => {
                await celes.setAchievementUnlockTime(appId, 'Codex', 'Steam', achievementId, unlockTime);
            });

            step('Check that time was updated correctly', async () => {
                const gameDataCollection: GameData[] = await celes.load();
                let itWorked = false;

                for (let i = 0; i < gameDataCollection.length; i++) {
                    if (gameDataCollection[i].appId === appId) {
                        const sources: SourceStats[] = gameDataCollection[i].stats.sources;
                        for (let j = 0; j < sources.length; j++) {
                            if (sources[j].source === 'Codex') {
                                for (const achievement of sources[j].achievements.active) {
                                    if (achievement.name === achievementId) {
                                        itWorked = achievement.unlockTime === unlockTime;
                                        break;
                                    }
                                }
                            }
                        }
                        break;
                    }
                }

                expect(itWorked).to.be.true;
            });
        });
    });

    context('With invalid/variable samples/config', async () => {
        describe('Invalid samples', () => {
            const sseInvalidAppId = '228300';

            const celes = new Celes(achievementWatcherTestRootPath, invalidSamplesFolders);
            let scrapResult: ScrapResult;

            step('Pull works', async () => {
                scrapResult = await celes.pull();
            })

            // TODO ALSO CHECK BLACKLIST

            step('SSE invalid file returns an scrap error with type UnexpectedFileContentError', (done) => {
                if (scrapResult.error !== undefined) {
                    for (const scrapError of scrapResult.error) {
                        if (scrapError.appId === sseInvalidAppId && scrapError.type === 'UnexpectedFileContentError') {
                            done();
                        }
                    }
                }
            });
        });

        describe('Invalid/Broken plugin', () => {
            const celes = new Celes(achievementWatcherTestRootPath, [], ['invalid']);
            let scrapResult: ScrapResult;

            step('Plugin crash does not result in application crash', async () => {
                scrapResult = await celes.pull();
            })

            step('Plugin crash is reported', (done) => {
                if (scrapResult.error !== undefined) {
                    for (const scrapError of scrapResult.error) {
                        if (scrapError.plugin === 'invalid') {
                            done();
                        }
                    }
                }
            })
        });

        describe('Use newest unlock time', () => {
            const celes = new Celes(
                achievementWatcherTestRootPath,
                validSamplesFolders,
                undefined,
                undefined,
                undefined,
                false);

            step('Pull works', async () => {
                await celes.pull();
            });
        });
    });
});