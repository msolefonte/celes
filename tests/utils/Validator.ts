import {GameData} from '../../src/types';

class Validator {
    private static isValidInterface(object: any, membersToCheck: string[]) {
        for (let i = 0; i < membersToCheck.length; i++) {
            if (!(membersToCheck[0] in object)) {
                return false;
            }
        }

        return true;
    }

    static isValidGameData(gameData: GameData) {
        const membersToCheck: string[] = ['apiVersion', 'appId', 'platform', 'schema', 'stats']
        return Validator.isValidInterface(gameData, membersToCheck);
    }
}

export {Validator};