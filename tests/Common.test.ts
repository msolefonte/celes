import {existsAndIsYoungerThan, normalizeTimestamp} from '../src/lib/plugins/utils/Common';
import {expect} from 'chai';
import path from 'path';

const readmeFile: string = path.join(__dirname, 'samples/README.md');
const samplesFolder: string = path.join(__dirname, 'samples/');

describe('Testing Common Plugin libraries', () => {
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