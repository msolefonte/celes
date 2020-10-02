import {Celes} from '.';
import {IExportableGameData} from './types';

const celes = new Celes();

celes.load().then((data: IExportableGameData[]) => {
    console.log(data);
});