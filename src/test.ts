import {Celes} from './lib/Celes';

const celes = new Celes();

celes.export('tmp/export.json').then(() => {
    console.log("Export Completed");
});