const axios = require('axios');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fs = require('fs');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 1620;

app.listen(PORT, () => {
    console.log(`server has been started...${PORT}`);
});

let good = `${encodeURIComponent('✅✅✅')}`;
let bad = `${encodeURIComponent('❌❌❌')}`;

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
            id: ',',
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
        if (countSet1 > 10) {
            selectedGame.push(game)
        }
    })
    return selectedGame;
};

const getSuccessGames = (games) => {
    let successGame = []

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
    let failGame = []

    games.forEach( game => {
        let count = Number(game.set2player1) + Number(game.set2player2)
        if (count > 10) {
            failGame.push(game);
        }
    });
    return failGame;
};

const TennisBot = async () => {
    let file = fs.readFileSync('recover.txt', "utf8", (err) => {
        if (err) throw err
    })

    file = JSON.parse(file)

    app.use('/', (req, res) => {
        res.send(file)
    })
    let data = await getData();
    data = data.Value;

    const games = getGames(data);
    const selectedGames = getSelectedGames(games);
    const successGames = getSuccessGames(selectedGames)
    const failGames = getFailGames(selectedGames)

    const reWrite = (file, selectedGames) => {
        if (!file || !selectedGames) {
            return undefined
        }
        let arr = [...file];
        selectedGames.forEach( game => {
            if(!file.length) {
                arr.push(game);
            }
            if(file.length) {
                file.forEach(selGame => {
                    if (game.id !== selGame.id) {
                        arr.push(selGame)
                        return null;
                    }
                })
            } else {
                arr.push(game);
            }
        })
        return arr;
    }

    let statisFile = file && file.statistics || {}

    const statistics = {
        hour: new Date().getHours(),
        statistics: {
            allGame: reWrite(statisFile.allGame, selectedGames) || [],
            successGames: reWrite(statisFile.successGames, successGames) || [],
            failGames: reWrite(statisFile.failGames, failGames) || [],
            successCount: statisFile.successGames && statisFile.successGames.length || 0,
            failCount: statisFile.failGames && statisFile.failGames.length || 0
        },
        actualityGame: selectedGames,
        successGame: successGames,
        failGame: failGames,
    }
    let xhttp = new XMLHttpRequest()

    if (statisFile.allGame && statistics.actualityGame) {
        if (statistics.actualityGame.length !== statisFile.allGame.length) {
            statistics.actualityGame.forEach(game => {
                if (statisFile.allGame.length) {
                    statisFile.allGame.forEach(({id, country, player1,
                                                    player2, set1player1, set1player2
                                                }) => {
                        if (game.id !== id) {
                            const url1 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=151520980&text='
                            let text = "Strategy Tennis\n" +
                                country + "\n"
                                + "1 Set Finished\n"
                                + player1 + ":  " + set1player1 + "\n"
                                + player2 + ":  " + set1player2 +
                                "\n2-Set TM 10,5 \n\n"
                            xhttp.open("GET", url1 + encodeURIComponent(text), true)
                            xhttp.send()
                            return null;
                        }
                    })
                } else {
                    const url1 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=151520980&text='
                    let text = "Strategy Tennis\n" +
                        game.country + "\n"
                        + "1 Set Finished\n"
                        + game.player1 + ":  " + game.set1player1 + "\n"
                        + game.player2 + ":  " + game.set1player2 +
                        "\n2-Set TM 10,5 \n\n"
                    xhttp.open("GET", url1 + encodeURIComponent(text), true)
                    xhttp.send()
                    return null;
                }
            })
        }
    } else {

    }

    if (statisFile.successGames && statistics.successGame) {
        if (statisFile.successGames.length !== statistics.successGame.length) {
            statistics.successGame.forEach(game => {
                if (statisFile.successGames.length) {
                    statisFile.successGames.forEach(({
                                                         id, country, player1,
                                                         player2, set1player1, set1player2
                                                     }) => {
                        if (game.id !== id) {
                            const url1 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=151520980&text='
                            let text = "Strategy Tennis\n" +
                                country + "\n"
                                + "1 Set Finished\n"
                                + player1 + ":  " + set1player1 + "\n"
                                + player2 + ":  " + set1player2 +
                                "\n2-Set TM 10,5 \n\n" + good
                            xhttp.open("GET", url1 + encodeURIComponent(text), true)
                            xhttp.send()
                            return null;
                        }
                    })
                } else {
                    const url1 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=151520980&text='
                    let text = "Strategy Tennis\n" +
                        game.country + "\n"
                        + "1 Set Finished\n"
                        + game.player1 + ":  " + game.set1player1 + "\n"
                        + game.player2 + ":  " + game.set1player2 +
                        "\n2-Set TM 10,5 \n\n" + good
                    xhttp.open("GET", url1 + encodeURIComponent(text), true)
                    xhttp.send()
                    return null;
                }
            })
        }
    }

    if (statisFile.failGames && statistics.failGames) {
        if (statisFile.failGames.length !== statistics.failGames.length) {
            statisFile.failGames.forEach(game => {
                if (statistics.failGame.length) {
                    statistics.failGame.forEach(({id, country, player1,
                                                     player2, set1player1, set1player2
                                                 }) => {
                        if (game.id !== id) {
                            const url1 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=151520980&text='
                            let text = "Strategy Tennis\n" +
                                country + "\n"
                                + "1 Set Finished\n"
                                + player1 + ":  " + set1player1 + "\n"
                                + player2 + ":  " + set1player2 +
                                "\n2-Set TM 10,5 \n\n" + bad
                            xhttp.open("GET", url1 + encodeURIComponent(text), true)
                            xhttp.send()
                            return null;
                        }
                    })
                }else {
                    const url1 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=151520980&text='
                    let text = "Strategy Tennis\n" +
                        game.country + "\n"
                        + "1 Set Finished\n"
                        + game.player1 + ":  " + game.set1player1 + "\n"
                        + game.player2 + ":  " + game.set1player2 +
                        "\n2-Set TM 10,5 \n\n" + bad
                    xhttp.open("GET", url1 + encodeURIComponent(text), true)
                    xhttp.send()
                    return null;
                }
            })
        }
    }

    const myWriteFile = (text) => {
        fs.writeFile('recover.txt', text, (err) => {
            if (err) throw err
        });
    };

    if(statistics.hour === 22 && file.statistics.hour !== 22) {
        myWriteFile('');
    } else {
        myWriteFile(JSON.stringify(statistics, null, 2));
    }

    setTimeout(() => TennisBot(), 10000);
};

TennisBot();

