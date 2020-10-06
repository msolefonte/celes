import {Celes} from '.';
// import {CelesLauncher} from '.';
import {GameData} from './types';

const celes = new Celes();
// const celes = new CelesLauncher();

celes.pull().then((gameData: GameData[]) => {
    console.log(gameData.length);
    // for (let i = 0; i < gameData.length; i++) {
    //     console.log(gameData[i]);
    // }
    celes.export("dist/celesbkp.awb").then(() => {
        console.log('Done');
        celes.import("dist/celesbkp.awb").then((gameData: GameData[]) => {
            console.log(gameData.length);
        })
    })
});