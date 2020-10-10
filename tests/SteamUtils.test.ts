import {
    ApiServerBlacklistedIdError,
    ApiServerInternalError,
    ApiServerUnsupportedLanguageError
} from '../src/lib/utils/Errors';
import {SteamUtils} from '../src/lib/plugins/lib/SteamUtils';
import path from 'path';

const achievementWatcherTestRootPath: string = path.join(__dirname, 'tmp/appData/Achievement Watcher Test');

describe('Testing Steam Utils', () => {
    describe('Get game schema from API Server', () => {
        it('Valid request works', async() => {
            await SteamUtils.getGameSchemaFromApiServer('382900', 'english');
        });
    });

    describe('Get game schema with invalid requests', () => {
        it('Blacklisted App ID throws ApiServerBlacklistedIdError', (done) => {
            SteamUtils.getGameSchema( achievementWatcherTestRootPath, '1', 'english').catch((error) => {
                if (error instanceof ApiServerBlacklistedIdError) {
                    done();
                }
            });
        });

        it('Invalid language throws ApiServerUnsupportedLanguageError', (done) => {
            SteamUtils.getGameSchema( achievementWatcherTestRootPath, '382900', 'invalid').catch((error) => {
                if (error instanceof ApiServerUnsupportedLanguageError) {
                    done();
                }
            });
        });

        it('Invalid request throws ApiServerInternalError', (done) => {
            SteamUtils.getGameSchema( achievementWatcherTestRootPath, 'invalid', 'english').catch((error) => {
                if (error instanceof ApiServerInternalError) {
                    done();
                }
            });
        });
    })
});