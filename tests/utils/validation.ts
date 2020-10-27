import {GameData} from '../../src/types';

function isValidInterface(object: any, membersToCheck: string[]): boolean {
    for (let i = 0; i < membersToCheck.length; i++) {
        if (!(membersToCheck[0] in object)) {
            return false;
        }
    }

    return true;
}

export function isValidGameData(gameData: GameData): boolean {
    const membersToCheck: string[] = ['apiVersion', 'appId', 'platform', 'schema', 'stats']
    return isValidInterface(gameData, membersToCheck);
}