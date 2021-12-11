const axios = require('axios');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const fs = require('fs');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 1620;

//const url = 'https://melbet.ru/live/tennis/'
//const url = 'https://ar.1xbet.com/en/live/Tennis/';
// const url = "https://1xstavka.ru/LiveFeed/Get1x2_VZip?sports=4&count=50&lng=en&antisports=188&mode=4&country=1&partner=51&getEmpty=true";
// const url1 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=-1001218378775&text='
// const url2 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=-1001218378775&text='
// const url3 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=-1001218378775&text='

// const xhttp = new XMLHttpRequest()
// const xhttp1 = new XMLHttpRequest()
// const xhttp2 = new XMLHttpRequest()
//setInterval(() => {

app.listen(PORT, () => {
    console.log(`server has been started...${PORT}`);
});

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
        let arr = [...file];
        selectedGames.forEach( game => {
            if(!arr.length) {
                arr.push(game);
            }

            file.forEach( selGame => {
                if(game.id !== selGame.id) {
                    arr.push(selGame)
                    return null;
                }
            })
        })
        return arr;
    }

    let statis = file.statistics

    const url1 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=151520980&text='
    let xhttp = new XMLHttpRequest()
    xhttp.open("GET", url1 + 'Hello', true)
    xhttp.send()

    const statistics = {
        hour: new Date().getHours(),
        statistics: {
            allGame: reWrite(statis.allGame, selectedGames),
            successGames: reWrite(statis.successGames, successGames),
            failGames: reWrite(statis.failGames, failGames),
            successCount: statis.successGames.length,
            failCount: statis.failGames.length
        },
        actualityGame: selectedGames,
        successGame: successGames,
        failGame: failGames,
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

const BOT_TOKEN = process.env.PORT;

// const bot = new telegraf(process.env.BOT_TOKEN)
// bot.start(arraa)
//10.211.1.9/255.255.255.252





// }, 10000)
// const url1 = 'https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=151520980&text='
// let xhttp = new XMLHttpRequest()
// xhttp.open("GET", url1 + aaa, true)
// xhttp.send()



/// 1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q

/// https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/getUpdetes

///https://api.telegram.org/bot1219533506:AAFWBi6UMHINMQD0o6zlzCnPFCQCLxbOm2Q/sendMessage?chat_id=151520980&text=Hello%20World


// xhttp.open("GET", url1 + yes, true)
// xhttp.send()

// xhttp1.open("GET", url2 + yes1, true)
// xhttp1.send()

// xhttp2.open("GET", url3 + yes2, true)
// xhttp2.send()


// //console.log(yes)
// //console.log(yes1)
// //console.log(yes2)

// fs.writeFile('recover.txt', vivod, (err) => {
//         if (err) throw err
//     })

// fs.writeFile('recover1.txt', vivod1, (err) => {
//     if (err) throw err
// })

// fs.writeFile('recover2.txt', vivod2, (err) => {
//     if (err) throw err
// })
