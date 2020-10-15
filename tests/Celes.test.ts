import * as path from 'path';
import {FileNotFoundError, InvalidApiVersionError} from '../src/lib/utils/Errors';
import {GameData, Source, SourceStats} from '../src/types';
import {existsSync, unlinkSync} from 'fs';
import {Celes} from '../src';
import {Validator} from './utils/Validator';
import {expect} from 'chai';
import {step} from 'mocha-steps';

const achievementWatcherTestRootPath: string = path.join(__dirname, 'tmp/appData/Achievement Watcher Test');
const importExportValidFile: string = path.join(__dirname, 'tmp/export.awb');
const importExportInvalidFile: string = path.join(__dirname, 'samples/other/importFileInvalid.awb');
const importExportNonExistentFile: string = path.join(__dirname, 'samples/other/importFileNonExistent.awb');
const importExportWrongVersionFile: string = path.join(__dirname, 'samples/other/importFileWrongVersion.awb');

const tdmAppIds: string[] = ['240970', '683280'];
const ali213AppIds: string[] = ['382890'];
const codexAppIds: string[] = ['255710', '382900', '1097840', '1184050'];
const creamApiAppIds: string[] = ['883710'];
const darksidersApiAppIds: string[] = ['774361'];
const goldbergAppIds: string[] = ['883710', '1113000'];
const reloadedAppIds: string[] = ['311210', '312750'];
const sseAppIds: string[] = ['45760', '228300'];
const skidrowAppIds: string[] = ['474960', '584980'];
const validSamplesFolders: string[] = [
    path.join(__dirname, 'samples/achievements/valid/3dm/'),
    path.join(__dirname, 'samples/achievements/valid/ali213/'),
    path.join(__dirname, 'samples/achievements/valid/codex/'),
    path.join(__dirname, 'samples/achievements/valid/creamAPI/'),
    path.join(__dirname, 'samples/achievements/valid/darksiders/'),
    path.join(__dirname, 'samples/achievements/valid/goldberg/'),
    path.join(__dirname, 'samples/achievements/valid/reloaded/'),
    path.join(__dirname, 'samples/achievements/valid/sse/'),
    path.join(__dirname, 'samples/achievements/valid/skidrow/'),
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
        const achievementId = 'CgkI287L0pcOEAIQAA';
        const celes = new Celes(achievementWatcherTestRootPath, validSamplesFolders);

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

        describe('Pull', () => {
            let gameDataCollection: GameData[];
            let progress: number;

            step('Obtained results', async () => {
                gameDataCollection = await celes.pull((p => {
                    progress = p;
                }));
            });

            step('Progress has arrived to 100%', async () => {
                expect(progress).to.equal(100);
            });

            step('Result is a list of GameData objects', async () => {
                let resultIsValid = true;

                for (let i = 0; i < gameDataCollection.length; i++) {
                    if (!Validator.isValidGameData(gameDataCollection[i])) {
                        resultIsValid = false;
                    }
                }

                expect(resultIsValid).to.be.true;
            });

            step('All active achievement names are in the schemas', async () => {
                for (const gameData of gameDataCollection) {
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
                for (const gameData of gameDataCollection) {
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
                for (const gameData of gameDataCollection) {
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
                expect(areAllAppIdsInTheGameDataCollection(tdmAppIds, gameDataCollection, '3DM')).to.be.true;
            });

            step('All ALI213 games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(ali213AppIds, gameDataCollection, 'Ali213')).to.be.true;
            });

            step('All Codex games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(codexAppIds, gameDataCollection, 'Codex')).to.be.true;
            });

            step('All Cream API games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(creamApiAppIds, gameDataCollection, 'CreamAPI')).to.be.true;
            });

            step('All Darksiders games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(darksidersApiAppIds, gameDataCollection, 'Darksiders')).to.be.true;
            });

            step('All Goldberg games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(goldbergAppIds, gameDataCollection, 'Goldberg')).to.be.true;
            });

            step('All Reloaded games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(reloadedAppIds, gameDataCollection, 'Reloaded')).to.be.true;
            });

            step('All SSE games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(sseAppIds, gameDataCollection, 'SmartSteamEmu')).to.be.true;
            });

            step('All Skidrow games were scraped', () => {
                expect(areAllAppIdsInTheGameDataCollection(skidrowAppIds, gameDataCollection, 'Skidrow')).to.be.true;
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
                    if (!Validator.isValidGameData(gameDataCollection[i])) {
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

            step('Import worked', async () => {
                gameDataCollection = await celes.import(importExportValidFile);
            });

            step('Result is a list of GameData objects', async () => {
                let isValid = true;

                for (let i = 0; i < gameDataCollection.length; i++) {
                    if (!Validator.isValidGameData(gameDataCollection[i])) {
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
            step('Set achievement unlock time worked', async () => {
                await celes.setAchievementUnlockTime('382900', 'Codex', 'Steam', achievementId, 1600000000);
            });

            step('Check that time was updated correctly', async () => {
                const gameDataCollection: GameData[] = await celes.load();
                let itWorked = false;

                for (let i = 0; i < gameDataCollection.length; i++) {
                    if (gameDataCollection[i].appId === '382900') {
                        const sources: SourceStats[] = gameDataCollection[i].stats.sources;
                        for (let j = 0; j < sources.length; j++) {
                            if (sources[j].source === 'Codex') {
                                itWorked = true;
                                break;
                            }
                        }
                        break;
                    }
                }

                expect(itWorked).to.be.true;
            });
        });
    });
});