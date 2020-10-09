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
    context('Without samples', () => {
        const celes = new Celes(achievementWatcherTestRootPath);
        let gameDataCollection: GameData[];
        let referenceResult: GameData[];
        let progress = 0;

        before((done) => {
            celes.pull().then((gdc: GameData[]) => {
                referenceResult = gdc;
                done();
            });
        });

        before(() => {
            if (existsSync(importExportFile)) {
                unlinkSync(importExportFile);
            }
        });

        step('pull(): Obtained results', async () => {
            progress = 0;
            gameDataCollection = await celes.pull((p => {
                progress = p;
            }));
        });

        step('pull(): Result is a list of GameData objects', async () => {
            let itWorked = true;

            for (let i = 0; i < gameDataCollection.length; i++) {
                if (!Validator.isValidGameData(gameDataCollection[i])) {
                    itWorked = false;
                }
            }

            expect(itWorked).to.be.true;
        });

        step('pull(): Progress has arrived to 100%', async () => {
            expect(progress).to.equal(100);
        });

        step('load(): Obtained results', async () => {
            progress = 0;
            gameDataCollection = await celes.load((p => {
                progress = p;
            }));
        });

        step('load(): Result is a list of GameData objects', async () => {
            let itWorked = true;

            for (let i = 0; i < gameDataCollection.length; i++) {
                if (!Validator.isValidGameData(gameDataCollection[i])) {
                    itWorked = false;
                }
            }

            expect(itWorked).to.be.true;
        });

        step('load(): Obtained same number of results than pull()', async () => {
            expect(gameDataCollection.length).to.equal(referenceResult.length);
        });

        step('load(): Progress has arrived to 100%', async () => {
            expect(progress).to.equal(100);
        });

        step('export(): Export worked', async () => {
            await celes.export(importExportFile);
        });

        step('export(): Exported file exists', async () => {
            expect(existsSync(importExportFile)).to.be.true;
        });

        step('import(): Obtained results', async () => {
            gameDataCollection = await celes.import(importExportFile);
        });

        step('import(): Result is a list of GameData objects', async () => {
            let itWorked = true;

            for (let i = 0; i < gameDataCollection.length; i++) {
                if (!Validator.isValidGameData(gameDataCollection[i])) {
                    itWorked = false;
                }
            }

            expect(itWorked).to.be.true;
        });

        step('import(): Obtained same number of results than pull()', async () => {
            expect(gameDataCollection.length).to.equal(referenceResult.length);
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

    context('With valid samples', async () => {
        const achievementId = 'CgkI287L0pcOEAIQAA';
        const celes = new Celes(achievementWatcherTestRootPath, validSamplesFolders);
        const codexAppIds: string[] = ['382900'];
        let gameDataCollection: GameData[];
        const reloadedAppIds: string[] = ['311210', '312750'];

        before(() => {
            const pathTo382900Cache: string = path.join(achievementWatcherTestRootPath, 'steam_cache/schema/english/382900.json');
            if (existsSync(pathTo382900Cache)) {
                unlinkSync(pathTo382900Cache);
            }
        });

        before(() => {
            if (existsSync(importExportFile)) {
                unlinkSync(importExportFile);
            }
        });

        step('pull(): Obtained results', async () => {
            gameDataCollection = await celes.pull();
        });

        step('pull(): Loaded all Codex games', async () => {
            expect(areAllAppIdsInTheGameDataCollection(codexAppIds, gameDataCollection)).to.be.true;
        });

        step('pull(): Loaded all Reloaded games', async () => {
            expect(areAllAppIdsInTheGameDataCollection(reloadedAppIds, gameDataCollection)).to.be.true;
        });

        step('load(): Obtained results', async () => {
            gameDataCollection = await celes.load();
        });

        step('load(): Loaded all Codex games', () => {
            expect(areAllAppIdsInTheGameDataCollection(codexAppIds, gameDataCollection)).to.be.true;
        });

        step('load(): Loaded all Reloaded games', () => {
            expect(areAllAppIdsInTheGameDataCollection(reloadedAppIds, gameDataCollection)).to.be.true;
        });

        step('export(): Export worked', async () => {
            await celes.export(importExportFile);
        });

        step('import(): Obtained results', async () => {
            gameDataCollection = await celes.import(importExportFile);
        });

        step('import(): Loaded all Codex games', () => {
            expect(areAllAppIdsInTheGameDataCollection(codexAppIds, gameDataCollection)).to.be.true;
        });

        step('import(): Loaded all Reloaded games', () => {
            expect(areAllAppIdsInTheGameDataCollection(reloadedAppIds, gameDataCollection)).to.be.true;
        });

        step('addGamePlaytime(): Set 382900\'s play time to 10h', async () => {
            await celes.addGamePlaytime('382900', 'Steam', 36000, true);
        });

        step('addGamePlaytime(): Check that 382900\'s playtime has been updated to 10h (36000s)', async () => {
            const gameDataCollection: GameData[] = await celes.load();
            let itWorked = false;

            for (let i = 0; i < gameDataCollection.length; i++) {
                if (gameDataCollection[i].appId === '382900') {
                    itWorked = gameDataCollection[i].stats.playtime === 36000;
                }
            }

            expect(itWorked).to.be.true;
        });

        step('addGamePlaytime(): Add 15 min to 382900\'s playtime', async () => {
            await celes.addGamePlaytime('382900', 'Steam', 900);
        });

        step('addGamePlaytime(): Check that 382900\'s playtime has been updated to 10h 15m (36900s)', async () => {
            let itWorked = false;

            const gameDataCollection: GameData[] = await celes.load();
            for (let i = 0; i < gameDataCollection.length; i++) {
                if (gameDataCollection[i].appId === '382900') {
                    itWorked = gameDataCollection[i].stats.playtime === 36900;
                }
            }

            expect(itWorked).to.be.true;
        });

        step('setAchievementUnlockTime(): Set 382900\'s Codex\'s achievement ' + achievementId + ' unlock time to 1600000000', async () => {
            await celes.setAchievementUnlockTime('382900', 'Codex', 'Steam', achievementId, 1600000000);
        });

        step('setAchievementUnlockTime(): Check that 382900\'s Codex\'s achievement ' + achievementId + ' unlock time is 1600000000', () => {
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