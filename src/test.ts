import {CelesLauncher} from '.';
import {IExportableGameData} from './types';

const celes = new CelesLauncher();

celes.pull().then((data: IExportableGameData[]) => {
    console.log(data.length);
    for (let i = 0; i < data.length; i++) {
        console.log(data[i].source, data[i].name);
    }
});