import {GameSchema, ScanResult} from '../src/types';
import {BlacklistedIdError} from 'cloud-client';
import {Steam} from '../src/lib/plugins/Steam';
import {WrongSourceError} from '../src/lib/utils/Errors';
import path from 'path';
import {step} from 'mocha-steps';

const achievementWatcherTestRootPath: string = path.join(__dirname, 'tmp/appData/Achievement Watcher Test');

describe('Testing Steam Plugin', () => {
    context('With Listing Type = 0', () => {
        const steam = new Steam(achievementWatcherTestRootPath, 0);

        it('Scan', async () => {
           await steam.scan();
        });
    });

    context('With Listing Type = 1', () => {
        const steam = new Steam(achievementWatcherTestRootPath, 1);
        let listOfGames: ScanResult[];

        step('Scan', async () => {
            listOfGames = await steam.scan();
        });

        step('Get schemas', async() => {
            for (const game of listOfGames) {
                let gameSchema: GameSchema;

                try {
                    gameSchema = await steam.getGameSchema(game.appId, 'english');
                } catch (error) {
                    if (error instanceof BlacklistedIdError) {
                        continue;
                    } else {
                        throw error;
                    }
                }
            }
        });
    });

    context('With Listing Type = 2', () => {
        const steam = new Steam(achievementWatcherTestRootPath, 2);
        let listOfGames: ScanResult[];

        step('Scan', async () => {
            listOfGames = await steam.scan();
        });

        step('Get schemas', async() => {
            for (const game of listOfGames) {

                try {
                    await steam.getGameSchema(game.appId, 'english');
                } catch (error) {
                    if (!(error instanceof BlacklistedIdError)) {
                        throw error;
                    }
                }
            }
        });

        step('Get active achievements', async() => {
            for (const game of listOfGames) {
                try {
                    await steam.getUnlockedOrInProgressAchievements(game);
                } catch (error) {
                    if (!(error instanceof WrongSourceError)) {
                        throw error;
                    }
                }
            }
        });
    });
});