const achievements = require("./parser/achievements.js");
const blacklist = require("./parser/blacklist.js");
const userDir = require("./parser/userDir.js");

const settings = require("./settings.js");
const config = settings.load();


async function main() {
    await achievements.makeList(config,(percent)=>{
        console.log("Percent: ", percent);
    }).then((list) => {
        console.log(list);
    });
}

main().then(() => {
    console.log("done");
})