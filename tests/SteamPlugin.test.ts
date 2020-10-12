import {GameSchema, ScanResult, UnlockedOrInProgressAchievement} from '../src/types';
import {Steam} from '../src/lib/plugins/Steam';
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
            console.log(listOfGames);
        });
    });

    context('With Listing Type = 2', () => {
        const steam = new Steam(achievementWatcherTestRootPath, 2);

        let listOfGames: ScanResult[];
        step('Scan', async () => {
            listOfGames = await steam.scan();
            console.log(listOfGames);
        });

        // const gameSchema: GameSchema = await scraper.getGameSchema(listOfGames[j].appId, this.systemLanguage);
        // activeAchievements = await scraper.getUnlockedOrInProgressAchievements(listOfGames[j]);
    });
});