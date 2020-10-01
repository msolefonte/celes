export {};

const { achievements } = require("./parser/AchievementParser");
// const blacklist = require("./parser/blacklist");
// const userDir = require("./parser/userDir");

const settings = require("../../config/settings");
const config = settings.load();


async function main() {
    await achievements.makeList(config, (percent: any)=>{
        console.log("Percent: ", percent);
    }).then((list: any) => {
        console.log(list);
    });
}

main().then(() => {
    console.log("done");
});