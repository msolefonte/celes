import {Celes} from './Celes';

const celes = new Celes();



celes.load().then((foundGames) => {
    console.log(foundGames);
});