const fetch = require('node-fetch');
const fs = require('fs');
const cache = require('./cache.js');
const cacheFetch = require('./cache-fetch.js');
const teams = ['ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CIN', 'CLE', 'COL', 'CWS', 'DET', 'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK', 'PHI', 'PIT', 'SD', 'SEA', 'SF', 'STL', 'TB', 'TEX', 'TOR', 'WAS'];
var years = ['2017', '2018'];
var mongo = require('./mongoBaseball.js');

function getBatterLogs() {
  return cache.get('batterLogUrls')
    .then(batterLogUrls => {
      return batterLogUrls.map(url=>{
        return addBatterLog(url)
      })
    })
    .then(setTimeout((function () {
      return process.exit();
    }), 5000))
}
getBatterLogs()

function addBatterLog(url) {
  return cache.get(url)
    .then(rawTeamLogs => {
      if (rawTeamLogs !== null) {
        var sorted = sortGameLogs(rawTeamLogs);
        var ids = Object.keys(sorted);
        return ids.map(id=>{
          var cumTenDay = calculateBatterLogCum(sorted[id])
          var gameLogs = getBatterGames(sorted[id])
          mongo.addBatterTenDay(id, cumTenDay)
          mongo.addBatterGameLogs(id, gameLogs)
        })
        // for (let id of ids) {
        //   var cumTenDay = calculateBatterLogCum(sorted[id])
        //   var gameLogs = getBatterGames(sorted[id])
        //   mongo.addBatterTenDay(id, cumTenDay)
        //   mongo.addBatterGameLogs(id, gameLogs)
        // }
      }
    }).catch(err => { console.log(err) })
}

function sortGameLogs(logsObj) {
  if (logsObj === null) return null
  var logs = logsObj.playergamelogs.gamelogs;
  var logsObj = {};
  for (let game of logs) {
    let playerId = game.player.ID;
    if (!(playerId in logsObj)) {
      logsObj[playerId] = [];
    }
    logsObj[playerId].push(game);
  }
  return logsObj
}

function calculateBatterLogCum(playerGames) {
  var cumStats = {
    TB: 0,
    G: 0,
    AB: 0,
    R: 0,
    H: 0,
    '2B': 0,
    '3B': 0,
    HR: 0,
    RBI: 0,
    BB: 0,
    SWI: 0,
    STRM: 0,
    GROB: 0,
    FLYB: 0,
    LD: 0,
    SO: 0,
    BA: 0,
    SLG: 0,
    OPS: 0,
    NP: 0,
    PA: 0,
    LOB: 0,
    HBP: 0,
    SF: 0,
    OBP: 0
  };
  for (let game of playerGames) {
    let s = game.stats;
    cumStats.G++;
    cumStats.TB += Number(s.TotalBases['#text']);
    cumStats.AB += Number(s.AtBats['#text']);
    cumStats.R += Number(s.Runs['#text']);
    cumStats.H += Number(s.Hits['#text']);
    cumStats['2B'] += Number(s.SecondBaseHits['#text']);
    cumStats['3B'] += Number(s.ThirdBaseHits['#text']);
    cumStats.HR += Number(s.Homeruns['#text']);
    cumStats.RBI += Number(s.RunsBattedIn['#text']);
    cumStats.BB += Number(s.BatterWalks['#text']);
    cumStats.SWI += Number(s.BatterSwings['#text']);
    cumStats.STRM += Number(s.BatterStrikesMiss['#text']);
    cumStats.GROB += Number(s.BatterGroundBalls['#text']);
    cumStats.FLYB += Number(s.BatterFlyBalls['#text']);
    cumStats.LD += Number(s.BatterLineDrives['#text']);
    cumStats.SO += Number(s.BatterStrikeouts['#text']);
    cumStats.BA += Number(s.BattingAvg['#text']);
    cumStats.SLG += Number(s.BatterSluggingPct['#text']);
    cumStats.OPS += Number(s.BatterOnBasePlusSluggingPct['#text']);
    cumStats.NP += Number(s.PitchesFaced['#text']);
    cumStats.PA += Number(s.PlateAppearances['#text']);
    cumStats.LOB += Number(s.LeftOnBase['#text']);
    cumStats.HBP += Number(s.HitByPitch['#text']);
    cumStats.SF += Number(s.BatterSacrificeFlies['#text']);
  }
  cumStats.BA = Number((cumStats.H / cumStats.AB).toFixed(3));
  cumStats.OBP = Number(((cumStats.H + cumStats.BB + cumStats.HBP) / (cumStats.AB + cumStats.BB + cumStats.HBP + cumStats.SF)).toFixed(3));
  cumStats.SLG = Number((cumStats.TB / cumStats.AB).toFixed(3));
  cumStats.OPS = Number((cumStats.OBP + cumStats.SLG).toFixed(3));
  return cumStats
}
function getBatterGames(playerGames) {
  var gameObjects = [];
  for (let game of playerGames) {
    let s = game.stats;
    let playerTeam = game.team.Abbreviation;
    if (game.game.awayTeam.Abbreviation === playerTeam) {
      var oppTeam = game.game.homeTeam.Abbreviation;
    } else var oppTeam = game.game.awayTeam.Abbreviation;
    let gameObj = {
      stats: {
        AB: s.AtBats['#text'],
        R: s.Runs['#text'],
        H: s.Hits['#text'],
        '2B': s.SecondBaseHits['#text'],
        '3B': s.ThirdBaseHits['#text'],
        HR: s.Homeruns['#text'],
        RBI: s.RunsBattedIn['#text'],
        BB: s.BatterWalks['#text'],
        SO: s.BatterStrikeouts['#text'],
        BA: s.BattingAvg['#text'],
        SLG: s.BatterSluggingPct['#text'],
        OPS: s.BatterOnBasePlusSluggingPct['#text'],
        NP: s.PitchesFaced['#text'],
        PA: s.PlateAppearances['#text'],
        LOB: s.LeftOnBase['#text']
      }
    }
    gameObj.date = game.game.date;
    gameObj.id = game.game.id;
    gameObj.oppTeam = oppTeam;
    gameObjects.push(gameObj);
  }
  return gameObjects;
}
module.exports = { getBatterLogs }