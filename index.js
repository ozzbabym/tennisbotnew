const axios = require('axios');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fs = require('fs');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 1620;

app.listen(PORT, () => {
    console.log(`server has been started...${PORT}`);
});

let good = `✅✅✅`;
let bad = `❌❌❌`;

let othersGames = /Simulated|Reality|Cyber|Russia|Masters|Daily|OPEN|Smash|Setka|Cup|Мир/
let xhttp = new XMLHttpRequest();
const url1 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=-1001218378775&text=';
const url2 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=-682722158&text=';

// -682722158 chat 40x40
// -1001218378775 chat TM10,5

const getData = async () => {
    let data = await axios.get(
        "https://1xstavka.ru/LiveFeed/" +
        "Get1x2_VZip?sports=4&count=50&antisports" +
        "=188&mode=4&country=1&partner=51&getEmpty=" +
        "true&noFilterBlockEvent=true"
    );
    data = await data;
    return data.data;
}

const getGames = (data) => {
    let myGame = [];

    data.forEach( game => {
        let describeGame = {
            id: '',
            country: '',
            game: '',
            name: '',
            title: '',
            player1: '',
            player2: '',
            set: '',
            scSS2S1: '',
            scSS2S2: '',
            set1player1: 0,
            set1player2: 0,
            set2player1: 0,
            set2player2: 0,
            set3player1: 0,
            set3player2: 0,
        };

        describeGame.id = game.N;
        describeGame.country = game.CN;
        describeGame.title = game.L;
        describeGame.name = game.SN;
        describeGame.game = game.MIO && game.MIO.TSt || 'simple';
        describeGame.player1 = game.O1;
        describeGame.player2 = game.O2;
        describeGame.field = game.MIS && game.MIS[1] && game.MIS[1].V || '';
        describeGame.set = game.SC.CPS;
        describeGame.set1player1 = game.SC.PS[0] && game.SC.PS[0].Value.S1 || 0;
        describeGame.set1player2 = game.SC.PS[0] && game.SC.PS[0].Value.S2 || 0;
        describeGame.set2player1 = game.SC.PS[1] && game.SC.PS[1].Value.S1 || 0;
        describeGame.set2player2 = game.SC.PS[1] && game.SC.PS[1].Value.S2 || 0;
        describeGame.set3player1 = game.SC.PS[2] && game.SC.PS[2].Value.S1 || 0;
        describeGame.set3player2 = game.SC.PS[2] && game.SC.PS[2].Value.S2 || 0;
        describeGame.scSS2S1 = game.SC.SS && game.SC.SS.S1 || 0;
        describeGame.scSS2S2 = game.SC.SS && game.SC.SS.S2 || 0;
        myGame.push(describeGame);
    });
    return myGame;
};

const getSelectedGames = (games) => {
    let selectedGame = [];

    games.forEach(game => {
        let countSet1 = Number(game.set1player1) + Number(game.set1player2);
        if (countSet1 > 10 &&
            !othersGames.test(game.title) &&
            !othersGames.test(game.country)) {
            selectedGame.push(game);
        }
    })
    return selectedGame;
};

const getSuccessGames = (games) => {
    let successGame = [];

    games.forEach( game => {
        let player1count = Number(game.set2player1)
        let player2count = Number(game.set2player2)

        if (player1count <= 4 && player2count === 6) {
            successGame.push(game);
        }

        if( player2count <= 4 && player1count === 6) {
            successGame.push(game);
        }
    });
    return successGame;
};

const getSuccessGames40x40 = (games) => {
    let successGame = [];

    games.forEach( game => {
        let player1count = Number(game.set2player1);
        let player2count = Number(game.set2player2);
        let sum = player1count + player2count;
        let player1point = game.scSS2S1;
        let player2point = game.scSS2S2;
        if (sum <= 5 &&
            player1point === '40' && player2point === '40') {
            successGame.push(game);
        }

        if( player2count <= 4 && player1count === 6) {
            successGame.push(game);
        }
    });
    return successGame;
};

const getFailsGames40x40 = (games, file) => {
    const { successGames40x40 } = file.statistics;
    let failGame = [];
    let obj2 = {};
    if (successGames40x40) {
        successGames40x40.forEach( game => {
            obj2[game.id] = game;
        });
    }

    games.forEach( game => {
        if ( !obj2[game.id] ) {
            let player1count = Number(game.set2player1)
            let player2count = Number(game.set2player2)
            let sum = player1count + player2count
            if (sum >= 5) {
                failGame.push(game);
            }
        }
    });
    return failGame;
};

const getFailGames = (games) => {
    let failGame = [];

    games.forEach( game => {
        let count = Number(game.set2player1) + Number(game.set2player2)
        if (count > 10) {
            failGame.push(game);
        }
    });
    return failGame;
};

const sendMessages = (subject, subjectFile, result) => {
    let obj = {};
    let obj2 = {};
    subject.forEach( game => {
        obj[game.id] = game;
    });

    subjectFile.forEach( game => {
        obj2[game.id] = game;
    });

    Object.keys(obj).forEach( gameId => {
        if (!Object.keys(obj2).length || !(obj2[gameId])) {
            const {
                country, player1, set1player1,
                player2, set1player2, field, id
            } = obj[gameId];

            let text = "Стратегия Теннис\n" +
                `#${id} \n` +
                country + "\n"
                + `${result !== '' ?
                    result === `✅✅✅` ? `✅✅✅ Прошла \n` : `❌❌❌ Не прошла \n` 
                    : `⚠️⚠️⚠️ Начало 2 Сета\n`}`
                + "1 Сет скоро закончится\n"
                + player1 + ":  " + set1player1 + "\n"
                + player2 + ":  " + set1player2 + "\n"
                + `поверхность ${field}\n` +
                "\nКогда начнется 2 Сет," +
                " сделай ставку ТМ 10,5 \n\n";
                xhttp.open("GET", url1 + encodeURIComponent(text), true)
                xhttp.send();
            return;
        }
    });
};

const sendMessages40x40 = (subject, subjectFile, result) => {
    let obj = {};
    let obj2 = {};
    subject.forEach( game => {
        obj[game.id] = game;
    });

    subjectFile.forEach( game => {
        obj2[game.id] = game;
    });

    Object.keys(obj).forEach( gameId => {
        if (!Object.keys(obj2).length || !(obj2[gameId])) {
            const {
                country, player1, set1player1,
                player2, set1player2, field, id
            } = obj[gameId];

            let text = "Стратегия Теннис\n" +
                `#${id} \n` +
                country + "\n"
                + `${result !== '' ?
                    result === `✅✅✅` ? `✅✅✅ Прошла \n` : `❌❌❌ Не прошла \n` 
                    : `⚠️⚠️⚠️ Начало 2 Сета\n`}`
                + "1 Сет скоро закончится\n"
                + player1 + ":  " + set1player1 + "\n"
                + player2 + ":  " + set1player2 + "\n"
                + `поверхность ${field}\n` +
                "\nКогда начнется 2 Сет," +
                " сделай ставку 40 40 Да, пока не выиграешь \n\n";
                xhttp.open("GET", url2 + encodeURIComponent(text), true)
                xhttp.send();
            return;
        }
    });
};

const TennisBot = async () => {
    try {
        let file = fs.readFileSync('recover.txt', "utf8", (err) => {
            if (err) throw err;
        })

        app.use('/', (req, res) => {
            res.send(JSON.stringify(file));
        });

        file = JSON.parse(file);
        let data = await getData();
        data = data.Value;

        const games = getGames(data);
        const selectedGames = getSelectedGames(games);
        const successGames = getSuccessGames(selectedGames)
        const failGames = getFailGames(selectedGames)
        const successGames40x40 = getSuccessGames40x40(selectedGames)
        const failsGames40x40 = getFailsGames40x40(selectedGames, file)

        const reWrite = (file, games) => {
            file = file || []
            if(file) {
                if (file.length && !games.length) {
                    return file;
                }
                if (!file.length && games.length) {
                    return games;
                }
            }
            let arr = [...file];
            let obj = {};
            let obj2 = {};
            games.forEach(game => {
                obj[game.id] = game;
            })
            file.forEach(game => {
                obj2[game.id] = game;
            })
            Object.keys(obj).forEach(gameId => {
                if (Object.keys(obj2).length === 0) {
                    arr.push(obj[gameId]);
                } else {
                if (!(obj2[gameId])) {
                        arr.push(obj[gameId])
                    }
                }
            })
            return arr;
        }

        let statisFile = file && file.statistics || {};

        const statistics = {
            hour: new Date().getHours(),
            statistics: {
                hour: new Date().getHours(),
                successCount: statisFile.successGames && statisFile.successGames.length || 0,
                failCount: statisFile.failGames && statisFile.failGames.length || 0,
                successCount40x40: statisFile.successGames40x40 && statisFile.successGames40x40.length || 0,
                failCount40x40: statisFile.failsGames40x40 && statisFile.failsGames40x40.length || 0,
                allCount: statisFile.allGame && statisFile.allGame.length || 0,
                allGame: reWrite(statisFile.allGame, selectedGames) || [],
                successGames: reWrite(statisFile.successGames, successGames) || [],
                failGames: reWrite(statisFile.failGames, failGames) || [],
                successGames40x40: reWrite(statisFile.successGames40x40, successGames40x40) || [],
                failsGames40x40: reWrite(statisFile.failsGames40x40, failsGames40x40) || []
            },
            actualityGame: selectedGames,
            successGame: successGames,
            failGame: failGames,
            successGames40x40: successGames40x40,
            failsGames40x40: failsGames40x40,
        }
console.log(statisFile.allCount, statisFile.failCount, statisFile.successCount)
console.log(statisFile.allCount, statisFile.failCount40x40, statisFile.successCount40x40)
        if (statisFile.allGame && statistics.actualityGame) {
            if (statistics.actualityGame.length !== statisFile.allGame.length) {
                sendMessages(statistics.actualityGame, statisFile.allGame, '');
            }
        }

        if (statisFile.successGames && statistics.successGame) {
            if (statisFile.successGames.length !== statistics.successGame.length) {
                sendMessages(statistics.successGame, statisFile.successGames, good);
            }
        }

        if (statisFile.failGames && statistics.failGame) {
            if (statisFile.failGames.length !== statistics.failGame.length) {
                sendMessages(statistics.failGame, statisFile.failGames, bad);
            }
        }
        if (statisFile.failsGames40x40 && statistics.failsGames40x40) {
            if (statisFile.failsGames40x40.length !== statistics.failsGames40x40.length) {
                sendMessages40x40(statistics.failsGames40x40, statisFile.failsGames40x40, bad);
            }
        }
        if (statisFile.successGames40x40 && statistics.successGames40x40) {
            if (statisFile.successGames40x40.length !== statistics.successGames40x40.length) {
                sendMessages40x40(statistics.successGames40x40, statisFile.successGames40x40, good);
            }
        }

        const myWriteFile = (text) => {
            fs.writeFile('recover.txt', text, (err) => {
                if (err) throw err;
            });
        };

        const oneHourNotification = (statistics) => {
            const {successCount, failCount, allCount} = statistics.statistics;
            let passPercent = '100%';
            if (allCount && failCount) {
                passPercent = ((1-failCount/(allCount - actualityCount))*100).toFixed(1) + "% прохода"
            }
            let text = `Статистика\n`+
                `Всего игр за день: ${allCount}\n`+
                `Побед: ${successCount} ✅\n`+
                `Поражений: ${failCount} ❌\n`+
                `${passPercent}`;
            xhttp.open("GET", url1 + encodeURIComponent(text), true)
            xhttp.send();
            myWriteFile(JSON.stringify(statistics, null, 2));
        };
        const oneHourNotification40x40 = (statistics) => {
            const {successCount40x40, failCount40x40, allCount} = statistics.statistics;
            let passPercent = '100%';
            if (allCount && failCount40x40) {
                passPercent = ((1-failCount40x40/(allCount - actualityCount))*100).toFixed(1) + "% прохода"
            }
            let text = `Статистика\n`+
                `Всего игр за день: ${allCount}\n`+
                `Побед: ${successCount40x40} ✅\n`+
                `Поражений: ${failCount40x40} ❌\n`+
                `${passPercent}`;
            xhttp.open("GET", url2 + encodeURIComponent(text), true)
            xhttp.send();
            myWriteFile(JSON.stringify(statistics, null, 2));
        };

        let actualityCount = statistics.actualityGame.length;

        if (statistics.hour === 22 && file.statistics.hour !== 22) {
            const {successCount, failCount, allCount} = file.statistics;
            let passPercent = '100%';
            if (allCount && failCount) {
                passPercent = ((1-failCount/(allCount - actualityCount))*100).toFixed(1) + "% прохода"
            }

            let text = `Статистика за весь день !!!!!\n`+
                        `Всего игр за день: ${allCount}\n`+
                        `Побед: ${successCount} ✅\n`+
                        `Поражений: ${failCount} ❌\n`+
                        `${passPercent}`;
            xhttp.open("GET", url1 + encodeURIComponent(text), true)
            xhttp.send();
            let statistics = {
                hour: 22,
                statistics: {
                    hour: 22,
                    successCount40x40: 0,
                    failCount40x40: 0,
                    successCount: 0,
                    failCount: 0,
                    allCount: 0,
                    allGame: [],
                    successGames40x40: [],
                    failsGames40x40: [],
                    successGames: [],
                    failGames: []
                },
                actualityGame: [],
                successGame: [],
                failGame: [],
                successGames40x40: [],
                failsGames40x40: [],
            };
            myWriteFile(JSON.stringify(statistics, null, 2));
        } else if (statistics.hour !== statisFile.hour) {
            oneHourNotification(statistics);
            oneHourNotification40x40(statistics);
        } else {
            myWriteFile(JSON.stringify(statistics, null, 2));
        }
        setTimeout(() => TennisBot(), 5000);
    } catch (e) {
        console.log(e)
        setTimeout(()=> TennisBot(), 20000);
    }
};

TennisBot();
