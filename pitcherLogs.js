const fetch = require('node-fetch');
const fs = require('fs');
const cache = require('./cache.js');
const cacheFetch = require('./cache-fetch.js');
const teams = ['ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CIN', 'CLE', 'COL', 'CWS', 'DET', 'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK', 'PHI', 'PIT', 'SD', 'SEA', 'SF', 'STL', 'TB', 'TEX', 'TOR', 'WAS'];
var years = ['2017', '2018'];
var mongo = require('./mongoBaseball.js');


function getPitcherUrls() {
  return cache.get('pitcherLogUrls')
    .then(pitcherLogUrls => {
      return pitcherLogUrls.map(url => {
        return addPitcherLogs(url)
      })
    })
    .then(setTimeout((function () {
      return process.exit();
    }), 5000))
}
getPitcherUrls()

function addPitcherLogs(url) {
  return cache.get(url)
    .then(rawPitcherLogs => {
      console.log(url)
      if (rawPitcherLogs !== null) {
        var sorted = sortGameLogs(rawPitcherLogs)
        var ids = Object.keys(sorted)
        return ids.map(id => {
          var lastTenGames = getPitchersLastTen(sorted[id])
          var cumTenDay = getPitcherTenDayCum(lastTenGames, id)
          var gameLogs = getPitcherLogGames(lastTenGames, id)
          // console.log(cumTenDay)
          // mongo.addPitcherTenDay(id, cumTenDay)
          // return mongo.addPitcherGameLogs(id, gameLogs)
        })
      } else return null
    }).catch(err=>{
      console.log('problem url', url)
      console.log(err)
    })

}

function getPitchersLastTen(playerGames) {
  playerGames.sort((a, b) => {
    var date1 = a.game.date.replace(/-/g, "")
    var date2 = b.game.date.replace(/-/g, "")
    if (Number(date1) > Number(date2)) return -1;
    if (Number(date1) < Number(date2)) return 1;
  })
  var gameLogs = playerGames.slice(0, 10)
  return gameLogs;
}


function getPitcherTenDayCum(playerGames, id) {
  var cumLogsObj = {
    ERA: 0,
    GROB: 0,
    W: 0,
    L: 0,
    SV: 0,
    SVO: 0,
    IP: 0,
    H: 0,
    '2B': 0,
    '3B': 0,
    ER: 0,
    HR: 0,
    BB: 0,
    SWI: 0,
    STR: 0,
    STRM: 0,
    BROB: 0,
    FLYB: 0,
    LD: 0,
    SO: 0,
    NP: 0,
    OBP: 0,
    SLG: 0,
    OPS: 0,
    TBF: 0,
    WHIP: 0,
    HOLD: 0,
    AVG: 0,
    // KBB: 0,
    STRL: 0,
    STRSW: 0,
    STR: 0,
    SWG: 0,
    GS: 0,
    PAB: 0
  };
  var partialInnings = 0;
  pitcherLogs:
  for (let game of playerGames) {
    var s = game.stats;
    // if (s.StrikeoutsToWalksRatio === undefined) {
    //   continue pitcherLogs;
    // }
    cumLogsObj.W += Number(s.Wins['#text']);
    cumLogsObj.L += Number(s.Losses['#text']);
    cumLogsObj.SV += Number(s.Saves['#text']);
    cumLogsObj.ERA += Number(s.EarnedRunAvg['#text']);
    cumLogsObj.SVO += Number(s.SaveOpportunities['#text']);
    let fullInnings = Number(Math.floor(s.InningsPitched['#text']));
    partialInnings += Number(s.InningsPitched['#text']) - fullInnings;
    cumLogsObj.IP += fullInnings;
    cumLogsObj.H += Number(s.HitsAllowed['#text']);
    cumLogsObj['2B'] += Number(s.SecondBaseHitsAllowed['#text']);
    cumLogsObj['3B'] += Number(s.ThirdBaseHitsAllowed['#text']);
    cumLogsObj.ER += Number(s.EarnedRunsAllowed['#text']);
    cumLogsObj.HR += Number(s.HomerunsAllowed['#text']);
    cumLogsObj.BB += Number(s.PitcherWalks['#text']);
    cumLogsObj.SWI += Number(s.PitcherSwings['#text']);
    cumLogsObj.STR += Number(s.PitcherStrikes['#text']);
    cumLogsObj.STRM += Number(s.PitcherStrikesMiss['#text']);
    cumLogsObj.GROB += Number(s.PitcherGroundBalls['#text']);
    cumLogsObj.FLYB += Number(s.PitcherFlyBalls['#text']);
    cumLogsObj.LD += Number(s.PitcherLineDrives['#text']);
    cumLogsObj.SO += Number(s.PitcherStrikeouts['#text']);
    cumLogsObj.NP += Number(s.PitchesThrown['#text']);
    cumLogsObj.OBP += Number(s.PitcherOnBasePct['#text']);
    cumLogsObj.SLG += Number(s.PitcherSluggingPct['#text']);
    cumLogsObj.OPS += Number(s.PitcherOnBasePlusSluggingPct['#text']);
    cumLogsObj.TBF += Number(s.TotalBattersFaced['#text']);
    cumLogsObj.WHIP += Number(s.WalksAndHitsPerInningPitched['#text']);
    cumLogsObj.HOLD += Number(s.Holds['#text']);
    cumLogsObj.AVG += Number(s.PitchingAvg['#text']);
    // cumLogsObj.KBB += Number(s.StrikeoutsToWalksRatio['#text']);
    cumLogsObj.STRL += Number(s.PitcherStrikesLooking['#text']);
    cumLogsObj.SWG += Number(s.PitcherSwings['#text']);
    cumLogsObj.GS += Number(s.GamesStarted['#text']);
    cumLogsObj.PAB += Number(s.PitcherAtBats['#text']);
  }
  partialInnings *= 10;
  partialPieces = Math.floor(partialInnings / 3)
  var partials = partialInnings %= 3;
  partials /= 10;
  cumLogsObj.IP += (partialPieces + partials);
  cumLogsObj.SLG = Number((((cumLogsObj.HR * 4) + (cumLogsObj['3B'] * 3) + (cumLogsObj['2B'] * 2) + (cumLogsObj.H - (cumLogsObj.HR - cumLogsObj['3B'] - cumLogsObj['2B']))) / cumLogsObj.PAB)).toFixed(3);
  cumLogsObj.SLG = Number(cumLogsObj.SLG)
  cumLogsObj.OBP = Number(((cumLogsObj.H + cumLogsObj.BB) / (cumLogsObj.PAB))).toFixed(3)
  cumLogsObj.ERA = Number(((cumLogsObj.ER / cumLogsObj.IP) * 9).toFixed(3))
  cumLogsObj.OPS = Number((Number(cumLogsObj.OBP) + Number(cumLogsObj.SLG)).toFixed(3))
  cumLogsObj.OBP = Number(cumLogsObj.OBP)
  cumLogsObj.WHIP = Number((cumLogsObj.WHIP / playerGames.length).toFixed(3))
  cumLogsObj.AVG = Number((cumLogsObj.H / cumLogsObj.PAB).toFixed(3))
  // cumLogsObj.KBB = Number((cumLogsObj.KBB / playerGames.length).toFixed(3))
  mongo.addPitcherTenDay(id, cumLogsObj)
  return cumLogsObj;
}

function getPitcherLogGames(playerGames, id) {
  var logGames = [];
  playerLogs:
  for (let game of playerGames) {
    var s = game.stats;
    var logObj = {
      stats: {
        W: s.Wins['#text'],
        L: s.Losses['#text'],
        SV: s.Saves['#text'],
        ERA: s.EarnedRunAvg['#text'],
        SVO: s.SaveOpportunities['#text'],
        IP: s.InningsPitched['#text'],
        H: s.HitsAllowed['#text'],
        '2B': s.SecondBaseHitsAllowed['#text'],
        '3B': s.ThirdBaseHitsAllowed['#text'],
        ER: s.EarnedRunsAllowed['#text'],
        HR: s.HomerunsAllowed['#text'],
        BB: s.PitcherWalks['#text'],
        SWI: s.PitcherSwings['#text'],
        STR: s.PitcherStrikes['#text'],
        STRM: s.PitcherStrikesMiss['#text'],
        GROB: s.PitcherGroundBalls['#text'],
        FLYB: s.PitcherFlyBalls['#text'],
        LD: s.PitcherLineDrives['#text'],
        SO: s.PitcherStrikeouts['#text'],
        NP: s.PitchesThrown['#text'],
        OBP: s.PitcherOnBasePct['#text'],
        SLG: s.PitcherSluggingPct['#text'],
        OPS: s.PitcherOnBasePlusSluggingPct['#text'],
        TBF: s.TotalBattersFaced['#text'],
        WHIP: s.WalksAndHitsPerInningPitched['#text'],
        HOLD: s.Holds['#text'],
        AVG: s.PitchingAvg['#text'],
        // KBB: s.StrikeoutsToWalksRatio['#text'],
        STRL: s.PitcherStrikesLooking['#text'],
        SWG: s.PitcherSwings['#text'],
        GS: s.GamesStarted['#text']
      },
      gameId: game.game.id,
      date: game.game.date,
      homeTeam: game.game.homeTeam.Abbreviation,
      awayTeam: game.game.awayTeam.Abbreviation
    }
    if (game.game.homeTeam.Abbreviation === game.team.Abbreviation) {
      logObj.teamFaced = game.game.awayTeam.Abbreviation;
    } else {
      logObj.teamFaced = game.game.homeTeam.Abbreviation;
    }
    // console.log(logObj)
    logGames.push(logObj)
  }
  // console.log(logGames)
  mongo.addPitcherGameLogs(id, logGames)
  return logGames
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

module.exports = { getPitcherUrls }