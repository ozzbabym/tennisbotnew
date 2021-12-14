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

let othersGames = /Simulated|Reality|Cyber|Russia|Masters|Daily|OPEN|Smash|Setka|Cup/
let xhttp = new XMLHttpRequest();
const url1 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=-1001218378775&text='

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
            cf1: '',
            cf2: '',
            set1player1: 0,
            set1player2: 0,
            set2player1: 0,
            set2player2: 0,
            set3player1: 0,
            set3player2: 0,
        };

        describeGame.id = game.N;
        describeGame.country = game.CN;
        describeGame.title = game.LE;
        describeGame.name = game.SE;
        describeGame.game = game.MIO && game.MIO.TSt || 'simple';
        describeGame.player1 = game.O1E;
        describeGame.player2 = game.O2E;
        describeGame.set = game.SC.CPS;
        describeGame.set1player1 = game.SC.PS[0] && game.SC.PS[0].Value.S1 || 0;
        describeGame.set1player2 = game.SC.PS[0] && game.SC.PS[0].Value.S2 || 0;
        describeGame.set2player1 = game.SC.PS[1] && game.SC.PS[1].Value.S1 || 0;
        describeGame.set2player2 = game.SC.PS[1] && game.SC.PS[1].Value.S2 || 0;
        describeGame.set3player1 = game.SC.PS[2] && game.SC.PS[2].Value.S1 || 0;
        describeGame.set3player2 = game.SC.PS[2] && game.SC.PS[2].Value.S2 || 0;
        myGame.push(describeGame);
    });
    return myGame;
};

const getSelectedGames = (games) => {
    let selectedGame = [];

    games.forEach(game => {
        let countSet1 = Number(game.set1player1) + Number(game.set1player2);
        if (countSet1 > 10 && !othersGames.test(game.title)) {
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
        if (!Object.keys(obj2).length) {
            const {
                country, player1, set1player1,
                player2, set1player2
            } = obj[gameId];

            let text = "Strategy Tennis\n" +
                country + "\n"
                + `${result !== '' ?
                    result === `✅✅✅` ? `✅✅✅ Прошла \n` : `❌❌❌ Не прошла \n` 
                    : `⚠️⚠️⚠️ Начало 2 Сета\n`}`
                + "1 Set Finished\n"
                + player1 + ":  " + set1player1 + "\n"
                + player2 + ":  " + set1player2 +
                "\n2-Set TM 10,5 \n\n";
            setTimeout(() => {
                xhttp.open("GET", url1 + encodeURIComponent(text), true)
                xhttp.send();
            }, 1000)
            return;
        }

        Object.keys(obj2).forEach(fileId => {
            if (!(obj2[gameId])) {
                const {
                    country, player1, set1player1,
                    player2, set1player2
                } = obj[gameId];

                let text = "Strategy Tennis\n" +
                    country + "\n"
                    + `${result !== '' ?
                        result === `✅✅✅` ? `✅✅✅ Прошла \n` : `❌❌❌ Не прошла \n` :
                        '⚠️⚠️⚠️'}`
                    + "1 Set Finished\n"
                    + player1 + ":  " + set1player1 + "\n"
                    + player2 + ":  " + set1player2 +
                    "\n2-Set TM 10,5 \n\n";
                setTimeout(() => {
                    xhttp.open("GET", url1 + encodeURIComponent(text), true)
                    xhttp.send();
                }, 1000)
            }
        });
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

        const reWrite = (file, games) => {
            if (file.length && !games.length) {
                return file;
            }
            if (!file.length && games.length) {
                return games;
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
                    return;
                }
                Object.keys(obj2).forEach(fileId => {
                    if (!(obj[fileId])) {
                        arr.push(obj[gameId])
                    }
                })
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
                allCount: statisFile.allGame && statisFile.allGame.length || 0,
                allGame: reWrite(statisFile.allGame, selectedGames) || [],
                successGames: reWrite(statisFile.successGames, successGames) || [],
                failGames: reWrite(statisFile.failGames, failGames) || []
            },
            actualityGame: selectedGames,
            successGame: successGames,
            failGame: failGames,
        }
console.log(statisFile.allCount, statisFile.failCount, statisFile.successCount)
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

        const myWriteFile = (text) => {
            fs.writeFile('recover.txt', text, (err) => {
                if (err) throw err;
            });
        };

        if (statistics.hour === 22 && file.statistics.hour !== 22) {
            const {successCount, failCount, allCount} = statistics.statistics;
            let text = `Статистика за весь день !!!!!
Всего игр за день: ${allCount}
Побед: ${successCount} ✅
Поражений: ${failCount} ❌
                    `;
            xhttp.open("GET", url1 + encodeURIComponent(text), true)
            xhttp.send();
            myWriteFile('{}');
        } else if (statistics.hour !== statisFile.hour) {
            const {successCount, failCount, allCount} = statistics.statistics;
            let text = `Статистика
Всего игр за день: ${allCount}
Побед: ${successCount} ✅
Поражений: ${failCount} ❌
                    `;
            setTimeout(() => {
                xhttp.open("GET", url1 + encodeURIComponent(text), true)
                xhttp.send();
            }, 1000)
            myWriteFile(JSON.stringify(statistics, null, 2));
        } else {
            myWriteFile(JSON.stringify(statistics, null, 2));
        }
        setTimeout(() => TennisBot(), 5000);
    } catch (e) {
        setTimeout(()=> TennisBot(), 20000);
    }
};

TennisBot();
