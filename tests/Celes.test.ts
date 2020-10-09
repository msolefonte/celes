import * as path from 'path';
import {GameData, SourceStats} from '../src/types';
import {existsSync, unlinkSync} from 'fs';
import {Celes} from '../src';
import {Validator} from './utils/Validator';
import {expect} from 'chai';
import {step} from 'mocha-steps';

const achievementWatcherTestRootPath: string = path.join(__dirname, 'tmp/appData/Achievement Watcher Test');
const importExportFile: string = path.join(__dirname, 'tmp/export.awb');
const validSamplesFolders: string[] = [
    path.join(__dirname, 'samples/achievements/valid/codex/'),
    path.join(__dirname, 'samples/achievements/valid/reloaded/')
];

function areAllAppIdsInTheGameDataCollection(appIds: string[], gameDataCollection: GameData[]) {
    return appIds.every((appId: string) => {
        return gameDataCollection.map((gameData: GameData) => {
            return gameData.appId;
        }).includes(appId);
    });
}

describe('Testing Celes API', () => {
    context('Without samples', () => {
        const celes = new Celes(achievementWatcherTestRootPath);

        before('Deleting exported file if existent', () => {
            if (existsSync(importExportFile)) {
                unlinkSync(importExportFile);
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
                await celes.export(importExportFile);
            });

            step('Exported file exists', async () => {
                expect(existsSync(importExportFile)).to.be.true;
            });

            step('Import worked', async () => {
                await celes.import(importExportFile);
            });

            //     // TODO
            //     it('File not found throws an error', async () => {
            //         expect(gameDataCollection.length).to.equal(numberOfResults);
            //     });
            //
            //     // TODO
            //     it('Invalid file throws an error', async () => {
            //         expect(gameDataCollection.length).to.equal(numberOfResults);
            //     });
            //
            //     // TODO
            //     it('ApiVersion not valid throws an error', async () => {
            //         expect(gameDataCollection.length).to.equal(numberOfResults);
            //     });
        });
    });

    context('With valid samples', async () => {
        const achievementId = 'CgkI287L0pcOEAIQAA';
        const celes = new Celes(achievementWatcherTestRootPath, validSamplesFolders);
        const codexAppIds: string[] = ['382900'];
        const reloadedAppIds: string[] = ['311210', '312750'];

        before('Deleting one 382900\'s cache if existent', () => {
            const pathTo382900Cache: string = path.join(achievementWatcherTestRootPath, 'steam_cache/schema/english/382900.json');
            if (existsSync(pathTo382900Cache)) {
                unlinkSync(pathTo382900Cache);
            }
        });

        before('Deleting exported file if existent', () => {
            if (existsSync(importExportFile)) {
                unlinkSync(importExportFile);
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

            step('All Codex games were scraped', async () => {
                expect(areAllAppIdsInTheGameDataCollection(codexAppIds, gameDataCollection)).to.be.true;
            });

            step('All Skidrow games were scraped', async () => {
                expect(areAllAppIdsInTheGameDataCollection(reloadedAppIds, gameDataCollection)).to.be.true;
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

            step('All Codex games were loaded', () => {
                expect(areAllAppIdsInTheGameDataCollection(codexAppIds, gameDataCollection)).to.be.true;
            });

            step('All Reloaded games were loaded', () => {
                expect(areAllAppIdsInTheGameDataCollection(reloadedAppIds, gameDataCollection)).to.be.true;
            });
        });

        describe('Import/Export', () => {
            let gameDataCollection: GameData[];

            step('Export worked', async () => {
                await celes.export(importExportFile);
            });

            step('Import worked', async () => {
                gameDataCollection = await celes.import(importExportFile);
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

            step('All Codex games were imported', () => {
                expect(areAllAppIdsInTheGameDataCollection(codexAppIds, gameDataCollection)).to.be.true;
            });

            step('All Reloaded games were imported', () => {
                expect(areAllAppIdsInTheGameDataCollection(reloadedAppIds, gameDataCollection)).to.be.true;
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