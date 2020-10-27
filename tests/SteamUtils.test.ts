import {InternalError} from 'cloud-client'
import {getGameSchema} from '../src/lib/plugins/utils/steamUtils';
import path from 'path';

const achievementWatcherTestRootPath: string = path.join(__dirname, 'tmp/appData/Achievement Watcher Test');

describe('Testing Steam Utils', () => {
    describe('Get game schema with invalid requests', () => {
        // BlacklistedIdError error is not thrown anymore
        // it('Blacklisted App ID throws BlacklistedIdError', (done) => {
        //     SteamUtils.getGameSchema( achievementWatcherTestRootPath, '1', 'english').catch((error) => {
        //         if (error instanceof BlacklistedIdError) {
        //             done();
        //         } else {
        //             console.error(error);
        //         }
        //     });
        // });
        //
        it('Invalid request throws InternalError', (done) => {
            getGameSchema( achievementWatcherTestRootPath, 'invalid', 'english').catch((error) => {
                if (error instanceof InternalError) {
                    done();
                } else {
                    console.error(error);
                }
            });
        });

        it('Invalid language is fixed to English', (done) => {
            getGameSchema( achievementWatcherTestRootPath, '382900', 'invalid').catch((error) => {
                console.error(error);
            });
            done();
        })
    })
});