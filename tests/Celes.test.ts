import * as path from 'path';
import {GameData, SourceStats} from '../src/types';
import {existsSync, unlinkSync} from 'fs';
import {Celes} from '../src';
import {Validator} from './utils/Validator';
import {expect} from 'chai';

const achievementWatcherTestRootPath: string = path.join(__dirname, 'tmp/appData/Achievement Watcher Test');
const importExportFile: string = path.join(__dirname, 'tmp/export.awb');
const samplesFolders: string[] = [
    path.join(__dirname, 'samples/achievement_files/valid/codex/'),
    path.join(__dirname, 'samples/achievement_files/valid/reloaded/')
];

function areAllAppIdsInTheGameDataCollection(appIds: string[], gameDataCollection: GameData[]) {
    return appIds.every((appId: string) => {
        return gameDataCollection.map((gameData: GameData) => {
            return gameData.appId;
        }).includes(appId);
    });
}

describe('Testing Celes API', () => {
    let celes: Celes;

    before((done) => {
        celes = new Celes(achievementWatcherTestRootPath);
        celes.pull().then(() => {
            done()
        });
    });

    context('Without samples', () => {
        const celes = new Celes(achievementWatcherTestRootPath);
        let numberOfResults: number;

        describe('pull()', () => {
            let gameDataCollection: GameData[];
            let progress = 0;

            it('Obtained results', async () => {
                gameDataCollection = await celes.pull((p => {
                    progress = p;
                }));
                numberOfResults = gameDataCollection.length;
            });

            it('Result is a list of GameData objects', async () => {
                let itWorked = true;

                for (let i = 0; i < gameDataCollection.length; i++) {
                    if (!Validator.isValidGameData(gameDataCollection[i])) {
                        itWorked = false;
                    }
                }

                expect(itWorked).to.be.true;
            });

            it('Progress has arrived to 100%', async () => {
                expect(progress).to.equal(100);
            });
        });

        describe('load()', () => {
            let gameDataCollection: GameData[];
            let progress = 0;

            it('Obtained results', async () => {
                gameDataCollection = await celes.load((p => {
                    progress = p;
                }));
                numberOfResults = gameDataCollection.length;
            });

            it('Result is a list of GameData objects', async () => {
                let itWorked = true;

                for (let i = 0; i < gameDataCollection.length; i++) {
                    if (!Validator.isValidGameData(gameDataCollection[i])) {
                        itWorked = false;
                    }
                }

                expect(itWorked).to.be.true;
            });

            it('Obtained same number of results than pull()', async () => {
                expect(gameDataCollection.length).to.equal(numberOfResults);
            });

            it('Progress has arrived to 100%', async () => {
                expect(progress).to.equal(100);
            });
        });

        describe('export()', () => {
            before(() => {
                if (existsSync(importExportFile)) {
                    unlinkSync(importExportFile);
                }
            });

            it('Export worked', async () => {
                await celes.export(importExportFile);
            });

            it('Exported file exists', async () => {
                expect(existsSync(importExportFile)).to.be.true;
            });
        });

        describe('import()', () => {
            let gameDataCollection: GameData[];

            it('Obtained results', async () => {
                gameDataCollection = await celes.import(importExportFile);
                numberOfResults = gameDataCollection.length;
            });

            it('Result is a list of GameData objects', async () => {
                let itWorked = true;

                for (let i = 0; i < gameDataCollection.length; i++) {
                    if (!Validator.isValidGameData(gameDataCollection[i])) {
                        itWorked = false;
                    }
                }

                expect(itWorked).to.be.true;
            });

            it('Obtained same number of results than pull()', async () => {
                expect(gameDataCollection.length).to.equal(numberOfResults);
            });

            // TODO
            // describe('Errors', () => {
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
            // });
        });
    });

    context('With valid samples', async () => {
        const celes = new Celes(achievementWatcherTestRootPath, samplesFolders);
        const codexAppIds: string[] = ['382900'];
        const reloadedAppIds: string[] = ['311210', '312750'];
        let numberOfResults: number;

        before(() => {
            const pathTo382900Cache: string = path.join(achievementWatcherTestRootPath, 'steam_cache/schema/english/382900.json');
            if (existsSync(pathTo382900Cache)) {
                unlinkSync(pathTo382900Cache);
            }
        });

        describe('pull()', () => {
            let gameDataCollection: GameData[];

            it('Obtained results', async () => {
                gameDataCollection = await celes.pull();
                numberOfResults = gameDataCollection.length;
            });

            it('Loaded all Codex games', () => {
                expect(areAllAppIdsInTheGameDataCollection(codexAppIds, gameDataCollection)).to.be.true;
            });

            it('Loaded all Reloaded games', () => {
                expect(areAllAppIdsInTheGameDataCollection(reloadedAppIds, gameDataCollection)).to.be.true;
            });
        });

        describe('load()', () => {
            let gameDataCollection: GameData[];

            it('Obtained results', async () => {
                gameDataCollection = await celes.load();
                numberOfResults = gameDataCollection.length;
            });

            it('Obtained same number of results than pull()', async () => {
                expect(gameDataCollection.length).to.equal(numberOfResults);
            });

            it('Loaded all Codex games', () => {
                expect(areAllAppIdsInTheGameDataCollection(codexAppIds, gameDataCollection)).to.be.true;
            });

            it('Loaded all Reloaded games', () => {
                expect(areAllAppIdsInTheGameDataCollection(reloadedAppIds, gameDataCollection)).to.be.true;
            });
        });

        describe('export()', () => {
            before(() => {
                if (existsSync(importExportFile)) {
                    unlinkSync(importExportFile);
                }
            });

            it('Export worked', async () => {
                await celes.export(importExportFile);
            });
        });

        describe('import()', () => {
            let gameDataCollection: GameData[];

            it('Obtained results', async () => {
                gameDataCollection = await celes.import(importExportFile);
                numberOfResults = gameDataCollection.length;
            });

            it('Obtained same number of results than pull()', async () => {
                expect(gameDataCollection.length).to.equal(numberOfResults);
            });

            it('Loaded all Codex games', () => {
                expect(areAllAppIdsInTheGameDataCollection(codexAppIds, gameDataCollection)).to.be.true;
            });

            it('Loaded all Reloaded games', () => {
                expect(areAllAppIdsInTheGameDataCollection(reloadedAppIds, gameDataCollection)).to.be.true;
            });
        });

        describe('addGamePlaytime()', () => {
            it('Set 382900\'s play time to 10h', async () => {
                await celes.addGamePlaytime('382900', 'Steam', 36000, true);
            });

            it('Check that 382900\'s playtime has been updated to 10h (36000s)', async () => {
                const gameDataCollection: GameData[] = await celes.load();
                let itWorked = false;

                for (let i = 0; i < gameDataCollection.length; i++) {
                    if (gameDataCollection[i].appId === '382900') {
                        itWorked = gameDataCollection[i].stats.playtime === 36000;
                    }
                }

                expect(itWorked).to.be.true;
            });

            it('Add 15 min to 382900\'s playtime', async () => {
                await celes.addGamePlaytime('382900', 'Steam', 900);
            });

            it('Check that 382900\'s playtime has been updated to 10h 15m (36900s)', async () => {
                let itWorked = false;

                const gameDataCollection: GameData[] = await celes.load();
                for (let i = 0; i < gameDataCollection.length; i++) {
                    if (gameDataCollection[i].appId === '382900') {
                        itWorked = gameDataCollection[i].stats.playtime === 36900;
                    }
                }

                expect(itWorked).to.be.true;
            });
        });

        describe('setAchievementUnlockTime()', () => {
            const achievementId = 'CgkI287L0pcOEAIQAA';
            let gameDataCollection: GameData[];

            before(async () => {
                gameDataCollection = await celes.load();
            });

            it('Set 382900\'s Codex\'s achievement ' + achievementId + ' unlock time to 1600000000', async () => {
                await celes.setAchievementUnlockTime('382900', 'Codex', 'Steam', achievementId, 1600000000);
            });

            it('Check that 382900\'s Codex\'s achievement ' + achievementId + ' unlock time is 1600000000', () => {
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