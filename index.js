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

let othersGames = /Simulated|Reality|Cyber|Russia|Masters|Daily|OPEN|Smash|Setka|Cup|Мир|Женщины|Мастерс|Экстралига|США|WTA|Челленджер|ATP/;
let niceGames = /ITF/;
let xhttp = new XMLHttpRequest();
const url1 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=-1001218378775&text=';
const bot4040 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=-4034001871&text=';

const getData = async () => {
    let data = await axios.get("https://1xstavka.ru/LiveFeed/Get1x2_VZip?sports=4&count=50&antisports=188&mode=4&country=1&partner=51&getEmpty=true&noFilterBlockEvent=true"
    );
    data = await data;
    return data.data;
}

function getCurrentDate() {
    var date = new Date();
    var day = date.getDate();
    var month = date.getMonth()+1; //months start at 0
    var year = date.getFullYear();

    if(day<10) {
        day='0'+day;
    }
    if(month<10) {
        month='0'+month;
    }

    return year+'/'+month+'/' + day;
}

const calculateDate = (statistics) => {
    let statisticsCopy = {
        hour: 22,
        statistics: {
            hour: 22,
            successCount: 0,
            failCount: 0,
            allCount: 0,
            allGame: [],
            successGames: [],
            failGames: []
        },
        actualityGame: [],
        successGame: [],
        failGame: [],
        gameDays: [],
        days: {}
    };
    if (statistics.gameDays?.length) {
        let obj = {};
        statistics.gameDays.forEach(game => {
            if (game.date != getCurrentDate()) {
                obj = game;
            }
            statisticsCopy.days[game.date] = statisticsCopy.days[game.date] ? [...statisticsCopy.days[game.date], game] : [game];
        });
        statisticsCopy.gameDays?.push(obj);
    } else {
        statisticsCopy.gameDays?.push({
            date: getCurrentDate(),
            games: {
                successGame: statistics.statistics.successGames,
                failGame: statistics.statistics.failGames,
                allGame: statistics.statistics.allGames,
            },
            successCount: statistics.statistics.successGames.length,
            failCount: statistics.statistics.failGames.length,
        });
    }
    return statisticsCopy;
};

const getStatisticGame = (statistics) => {
    let stockGame = ["\nВряд\n"];
    statistics.statistics.allGame.forEach((game)=> {
        if (getSuccessGames([game]).length) {
            stockGame.push(`✅ #${game.id} ${game.set2player1} ${game.set2player2}\n`);
        } else if (getFailGames([game]).length) {
            stockGame.push(`❌ #${game.id} ${game.set2player1} ${game.set2player2}\n`);
        } else {
            stockGame.push(`⚠️ #${game.id} ${game.set2player1} ${game.set2player2}\n`);
        }
    });
    return stockGame.join("");
};

const getGames = (data) => {
    let myGame = [];

    data.forEach( game => {
        let describeGame = {
            id: '',
            date: getCurrentDate(),
            country: '',
            game: '',
            name: '',
            title: '',
            player1: '',
            player2: '',
            set: '',
            cf1: '',
            cf2: '',
            gameCountPlayer1: '',
            gameCountPlayer2: '',
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
        game && game.MIS?.forEach(function(item) {
            if (item.V === 'Хард') {
                describeGame.field = item.V;
            }
        })
        describeGame.set = game.SC.CPS;
        describeGame.set1player1 = game.SC.PS[0] && game.SC.PS[0].Value.S1 || 0;
        describeGame.set1player2 = game.SC.PS[0] && game.SC.PS[0].Value.S2 || 0;
        describeGame.set2player1 = game.SC.PS[1] && game.SC.PS[1].Value.S1 || 0;
        describeGame.set2player2 = game.SC.PS[1] && game.SC.PS[1].Value.S2 || 0;
        describeGame.set3player1 = game.SC.PS[2] && game.SC.PS[2].Value.S1 || 0;
        describeGame.set3player2 = game.SC.PS[2] && game.SC.PS[2].Value.S2 || 0;
        describeGame.gameCountPlayer1 = game.SC.SS && game.SC.SS.S1 || "";
        describeGame.gameCountPlayer2 = game.SC.SS && game.SC.SS.S2 || "";
        myGame.push(describeGame);
    });
    return myGame;
};

const getSelectedGames = (games) => {
    let selectedGame = [];
    games.forEach(game => {
        let countSet1 = Number(game.set1player1) + Number(game.set1player2);
        if (countSet1 > 10 &&
            niceGames.test(game.title) && game.field 
            // && !othersGames.test(game.country) 
            && !game.player1.includes('/')) {
            selectedGame.push(game);
        }
    })
    return selectedGame;
};

const getSelectedSuccessGames4040 = (games) => {
    let selectedGame = [];
    games.forEach(game => {
        let countSet1 = Number(game.set1player1) + Number(game.set1player2);
        let countSet2 = Number(game.set2player1) + Number(game.set2player2);
        if (countSet1 > 10 && countSet2 < 4 && 
            (game.gameCountPlayer1 === '40' && game.gameCountPlayer2 === '40')) {
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
        if (!Object.keys(obj2).length || !(obj2[gameId])) {
            const {
                title, player1, set1player1,
                player2, set1player2, field, id, set2player1, set2player2
            } = obj[gameId];

            let text = "Стратегия Теннис\n" +
                `#${id} \n` +
                title + "\n"
                + `${result !== '' ?
                    result === `✅✅✅` ? `✅✅✅ Прошла \n` : `❌❌❌ Не прошла \n` 
                    : `⚠️⚠️⚠️ Начало 2 Сета\n`}`
                + "1 Сет скоро закончится\n"
                + player1 + ":  " + set1player1 + " " + set2player1 + "\n"
                + player2 + ":  " + set1player2 + " " + set2player2 + "\n"
                + `поверхность ${field}\n` +
                "\nКогда начнется 2 Сет," +
                " сделай ставку ТМ 10,5 \n\n";
                xhttp.open("GET", url1 + encodeURIComponent(text), true)
                xhttp.send();
            return;
        }
    });
};

const sendMessages4040 = (subject, subjectFile) => {
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
                title, player1, set1player1,
                player2, set1player2, field, id, set2player1, set2player2
            } = obj[gameId];

            let text = "Стратегия Теннис\n" +
                `#${id} \n` +
                title + "\n"
                + player1 + ":  " + set1player1 + " " + set2player1 + "\n"
                + player2 + ":  " + set1player2 + " " + set2player2 + "\n"
                + `поверхность ${field}\n` +
                `40 40 прошла\n ${(set2player1 + set2player2) ?
                     `в 2 Сете в гейме ${set2player1 + set2player2}` : `в 1 Сете в гейме ${set1player1 + set1player2}` }`
            xhttp.open("GET", bot4040 + encodeURIComponent(text), true)
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
        const successGames = getSuccessGames(selectedGames);
        const failGames = getFailGames(selectedGames);

        //Cтратегия 40 x 40
        const successGames4040s = getSelectedSuccessGames4040(selectedGames);

        const reWrite = (file = [], games = []) => {
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
                } else {
                    if (!(obj2[gameId])) {
                        arr.push(obj[gameId])
                    } else {
                        arr = arr.map(item => {
                            if (item.id == gameId) {
                                return obj[gameId];
                            }
                            return item;
                        });
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
                allCount: statisFile.allGame && statisFile.allGame.length || 0,
                allGame: reWrite(statisFile.allGame, selectedGames) || [],
                successGames: reWrite(statisFile.successGames, successGames) || [],
                failGames: reWrite(statisFile.failGames, failGames) || [],
                successGames4040s: reWrite(statisFile.successGames4040s, successGames4040s) || []
            },
            actualityGame: selectedGames,
            successGame: successGames,
            failGame: failGames,
            successGames4040: successGames4040s,
            gameDays: file.gameDays || [],
            days: file.days || {},
        }
//console.log(statisFile.allCount, statisFile.failCount, statisFile.successCount)
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
        // Стратегия 40 40
        if (statisFile.successGames4040s && statistics.successGames4040) {
            if (statistics.successGames4040.length !== statisFile.successGames4040s.length) {
                sendMessages4040(statistics.successGames4040, statisFile.successGames4040s)
            }
        }

        const myWriteFile = (text) => {
            fs.writeFile('recover.txt', text, (err) => {
                if (err) {
                    throw err;
                }
            });
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
                        `${passPercent}\n${getStatisticGame(statistics)}`;
            xhttp.open("GET", url1 + encodeURIComponent(text), true)
            xhttp.send();
            myWriteFile(JSON.stringify(calculateDate(statistics), null, 2));
        } else if (statistics.hour !== statisFile.hour) {
            const {successCount, failCount, allCount} = statistics.statistics;
            let passPercent = '100%';
            if (allCount && failCount) {
                passPercent = ((1-failCount/(allCount - actualityCount))*100).toFixed(1) + "% прохода"
            }
            let text = `Статистика\n`+
                        `Всего игр за день: ${allCount}\n`+
                        `Побед: ${successCount} ✅\n`+
                        `Поражений: ${failCount} ❌\n`+
                        `${passPercent} ${getStatisticGame(statistics)}`;
                xhttp.open("GET", url1 + encodeURIComponent(text), true)
                xhttp.send();
            myWriteFile(JSON.stringify(statistics, null, 2));
        } else {
            myWriteFile(JSON.stringify(statistics, null, 2));
        }
        setTimeout(() => TennisBot(), 5000);
    } catch (e) {
        console.log(e);
        setTimeout(()=> TennisBot(), 20000);
    }
};
TennisBot();
