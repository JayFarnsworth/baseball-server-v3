const http = require('http')
const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')
const tabletojson = require('tabletojson')
const morgan = require('morgan')
const cors = require('cors')
const app = module.exports = express()
const server = http.createServer(app)
const port = parseInt(process.env.PORT || 4000)
const devMode = process.env.NODE_ENV !== 'production'
const cheerio = require('cheerio');
const idList = require('./assets/player_ids.json');
const teamColors = require('./assets/teamColors.json');
const fetch = require('node-fetch');
const fs = require('fs');
const cache = require('./cache.js');
const cacheFetch = require('./cache-fetch.js');
const mongo = require('./mongoBaseball');
const dates = require('./dateManagement.js');
// const gameFetches = require('./games.js')


var rp = require('request-promise');
const teams = ['ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CIN', 'CLE', 'COL', 'CWS', 'DET', 'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK', 'PHI', 'PIT', 'SD', 'SEA', 'SF', 'STL', 'TB', 'TEX', 'TOR', 'WAS'];
const testingDate = '20170920';
const testingYear = '2017'



app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(morgan(devMode ? 'dev' : 'combined'))
app.use(cors({ origin: true }))

// authentication
const MSFHeaders = { Authorization: 'Basic a3Vicmlja2FuOkgzbHRvbjE3MTcu' };
var rosters;


function getDate() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!
  var yyyy = today.getFullYear();
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  return yyyy + mm + dd;
}
function delay(msec) {
  return new Promise(resolve => {
    setTimeout(resolve, msec);
  })
}


console.log(getDate())


app.get('/mongogames', function (req, res) {
  mongoGameFetch()
    .then()
})

function mongoGameFetch() {
  let date = getDate()
  let url = 'https://api.mysportsfeeds.com/v1.2/pull/mlb/2018-regular/daily_game_schedule.json?fordate=' + date;
  fetch(url, {
    credentials: 'same-origin',
    headers: MSFHeaders,
    method: 'GET',
    mode: 'cors'
  })
    .then(resp => resp.json())
    .then(resp => {
      for (let game of resp.dailygameschedule.gameentry) {
        let gameid = game.id;
        mongoPlayers.createGame({
          id: gameid,
          date: game.date,
          time: game.time,
          awayTeam: game.awayTeam.Abbreviation,
          homeTeam: game.homeTeam.Abbreviation,
          location: game.location
        }).catch(err => console.log(err))
      }
    })
}
app.get('/mongogamesfind', function (req, res) {
  var date = req.query.date
  mongo.findTodaysGames(date)
    .then(games => {
      res.send(games)
    })
})

function mongoLineups(id) {
  const urls = idList
    .map((id, i) => `https://api.mysportsfeeds.com/v1.2/pull/mlb/2018-regular/game_startinglineup.json?gameid=${id}`);
  function getJSON(url, index) {
    return Promise.resolve()
      .then(() => {
        return delay(index * currentDelay);
      })
      .then(() => {
        return cacheFetch(url, {
          credentials: 'same-origin',
          headers: MSFHeaders,
          method: 'GET',
          mode: 'cors'
        }, null, i)
          .then(request => request.json())
      })
  }
}

app.get('/createbatters', function(req, res){
  cache.get('teamObject')
    .then(playerObject => {
      teams.map(team => {
        let ids = Object.keys(playerObject[team].batters);
        ids.map(id => {
          mongo.createBatter(playerObject[team].batters[id])
        })
      })
      res.send('batter documents created')
    })
})

app.get('/createpitchers', function (req, res) {
  cache.get('teamObject')
    .then(playerObject => {
      teams.map(team => {
        let ids = Object.keys(playerObject[team].pitchers);
        ids.map(id => {
          mongo.createPitcher(playerObject[team].pitchers[id])
        })
      })
      res.send('pitcher documents created')
    })
})
app.get('/findpitcher', function(req, res){
  var id = req.query.id;
  mongo.findPitcher(id)
    .then(pitcher => {
      res.send(pitcher)
    })
})

app.get('/deletebatterspitchers', function(req, res) {
  mongo.removeBatters()
    .then(resp=>{
      mongo.removePitchers()
      res.send('collection deleted')
    })
})

app.get('/gettodaysgameobject', function(req, res){
  date = dates.getToday()
  console.log(date)
  mongo.findTodaysGames(date)
    .then(games => {
      res.send(games)
      // cache.set('allDailyGames' + date, games)
      //   .then(object => res.send(object))
    })
})

app.get('/findgamebyid', function (req, res) {
  var gameid = req.query.id;
  mongo.findGame(gameid)
    .then(resp => res.send(resp))
})

app.get('/deletegames', function(req, res){
  mongo.deleteGames()
    .then(resp=>{
      res.send('all games deleted')
    })
})





app.get('/mongofindall', function (req, res) {
  var id = req.query.id;
  mongo.findBatter(id)
    .then(resp => res.send(resp))
});


app.get('/mongoaddstat', function (req, res) {
  var id = req.query.id;
  var stats = {
    2017: {},
    2018: {}
  }
  mongo.addBatterStats(id, stats)
    .then(resp => { res.send(resp) })

  // mongo.findBatter(id)
  // .then(batter=>{
  //   mongo.addBatterStats(id, {2017: {}, 2018: {}})
  // })
})
app.get('/getfangraphsdata', function(req, res){
  var fg_id = req.query.batter;
  mongo.getFangraphsData(fg_id)
    .then(data => {
      res.send(data)
    })
})

app.get('/getfangraphlogs', function (req, res) {
  var fg_id = req.query.batter;
  var url = 'https://www.fangraphs.com/statsd.aspx?playerid=' + fg_id;
  tabletojson.convertUrl(
    url,
    { useFirstRowForHeadings: false },
    function (tablesAsJson) {
      console.log(tablesAsJson)
      var gameLogs = tablesAsJson[tablesAsJson.length - 1]
      res.send(gameLogs)
    }
  );
})

app.get('/getfangraphstats', function (req, res) {
  var fg_id = req.query.batter;
  var url = 'https://www.fangraphs.com/statss.aspx?playerid=' + fg_id;
  tabletojson.convertUrl(
    url,
    { useFirstRowForHeadings: false },
    function (tablesAsJson) {
      tablesAsJson[6].indexOf({})
      res.send(tablesAsJson[6])
    }
  );
})






app.use(notFound)
app.use(errorHandler)

server.listen(port)
  .on('error', console.error.bind(console))
  .on('listening', console.log.bind(console, 'Listening on ' + port));

function notFound(req, res, next) {
  const url = req.originalUrl
  if (!/favicon\.ico$/.test(url) && !/robots\.txt$/.test(url)) {
    // Don't log less important auto requests
    console.error('[404: Requested file not found] ', url)
  }
  res.status(404).send({ error: 'Url not found', status: 404, url })
}

function errorHandler(err, req, res, next) {
  console.error('ERROR', err)
  const stack = devMode ? err.stack : undefined
  res.status(500).send({ error: err.message, stack, url: req.originalUrl })
}
