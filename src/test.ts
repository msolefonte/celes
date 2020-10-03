import {CelesLauncher} from '.';
import {IExportableGameData} from './types';

const celes = new CelesLauncher();

celes.scrap().then((data: IExportableGameData[]) => {
    console.log(data);
});