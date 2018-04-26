// var fetches = require('./fetches.js');
const fetch = require('node-fetch');
const fs = require('fs');
const cache = require('./cache.js');
const cacheFetch = require('./cache-fetch.js');
const teams = ['ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CIN', 'CLE', 'COL', 'CWS', 'DET', 'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK', 'PHI', 'PIT', 'SD', 'SEA', 'SF', 'STL', 'TB', 'TEX', 'TOR', 'WAS'];
var years = ['2017', '2018'];
var mongo = require('./mongoBaseball.js');


// function getBatterUrls(){
//   cache.get('batterStatUrls')
//     .then(batterUrls => {
//       return batterUrls.map(url=>{
//         return addStatSet(url)
//       })
//     })
//     // .then(() => {
      // return cache.get('batterLogUrls')
      //   .then(batterLogUrls => {
      //     return batterLogUrls.map(url => {
      //       return addBatterLog(url)
      //     })
      //   })
    // })
// }



function getBatterStats() {
  return cache.get('batterStatUrls')
    .then(batterUrls => {
      return batterUrls.map(url => {
        return addCumulativeStat(url)
      })
    })
    .then(setTimeout((function () {
      return process.exit();
    }), 5000))
}
function getBatterLogs() {
  return cache.get('batterLogUrls')
    .then(batterLogUrls => {
      return batterLogUrls.map(url => {
        return addBatterLog(url)
      })
    })
    .then(resp=>console.log('hi'))
}
// getBatterLogs()
getBatterStats()


function addCumulativeStat(url){
      return cache.get(url)
        .then(rawTeamStats => {
          if (!rawTeamStats) console.log('null url', url)
          var playerList = rawTeamStats.cumulativeplayerstats.playerstatsentry;
          var team = playerList[0].team.Abbreviation;
          if (url.includes('2017-regular')) {
            var year = '2017'
          } else {
            var year = '2018'
          }
          return playerList.map(player => {
            let id = player.player.ID;
            var s = player.stats;
            return pObject = {
              id: id,
              year: year,
              G: s.GamesPlayed['#text'],
              AB: s.AtBats['#text'],
              R: s.Runs['#text'],
              H: s.Hits['#text'],
              '2B': s.SecondBaseHits['#text'],
              '3B': s.ThirdBaseHits['#text'],
              HR: s.Homeruns['#text'],
              RBI: s.RunsBattedIn['#text'],
              BB: s.BatterWalks['#text'],
              SWI: s.BatterSwings['#text'],
              STRM: s.BatterStrikesMiss['#text'],
              GROB: s.BatterGroundBalls['#text'],
              FLYB: s.BatterFlyBalls['#text'],
              LD: s.BatterLineDrives['#text'],
              SO: s.BatterStrikeouts['#text'],
              BA: s.BattingAvg['#text'],
              SLG: s.BatterSluggingPct['#text'],
              OPS: s.BatterOnBasePlusSluggingPct['#text'],
              NP: s.PitchesFaced['#text'],
              PA: s.PlateAppearances['#text'],
              LOB: s.LeftOnBase['#text']
            }
          })
        }).catch(err=>console.log(err))
        .then(playerList => {
          return playerList.map(addBatterStat)
          // if (year === '2017') mongo.addBatterLast(id, pObject)
          // if (year === '2018') mongo.addBatterCurrent(id, pObject)
        }).catch(err=>console.log(err))
}
function addBatterStat(object){
  let playerId = object.id;
  let year = object.year;
  return mongo.addBatterStat(playerId, object, year)
}

function addBatterLog(url){
  console.log('yo')
  return cache.get(url)
    .then(rawTeamLogs => {
      if (rawTeamLogs !== null)  {
        var sorted = sortGameLogs(rawTeamLogs);
        var ids = Object.keys(sorted);
        for (let id of ids) {
          var cumTenDay = calculateBatterLogCum(sorted[id])
          var gameLogs = getBatterGames(sorted[id])
          mongo.addBatterTenDay(id, cumTenDay)
          mongo.addBatterGameLogs(id, gameLogs)
        }
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

function calculateBatterLogCum(playerGames){
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
function getBatterGames(playerGames){
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


function getPitcherUrls(){
  return cache.get('pitcherStatUrls')
    .then(pitcherUrls => {
      pitcherUrls.map(url => {
        return addPitcherCum(url)
      })
      return pitcherUrls
    })
    .then(()=>{
      return cache.get('pitcherLogUrls')
        .then(pitcherLogUrls => {
          pitcherLogUrls.map(url => {
            return addPitcherLogs(url)
          })
        })
    })
}

function addPitcherCum(url){
  return cache.get(url)
    .then(rawPitcherStats => {
      var playerList = rawPitcherStats.cumulativeplayerstats.playerstatsentry;
      var team = playerList[0].team.Abbreviation;
      if (url.includes('2017-regular')) {
        var year = '2017'
      } else {
        var year = '2018'
      }
      playerLoop:
      for (let player of playerList) {
        var s = player.stats;
        let id = player.player.ID;
        if (s.Wins === undefined) {
          continue playerLoop
        }
        var pObject = {
            year: year,
            G: s.GamesPlayed['#text'],
            W: s.Wins['#text'],
            L: s.Losses['#text'],
            H: s.HitsAllowed['#text'],
            ERA: s.EarnedRunAvg['#text'],
            IP: s.InningsPitched['#text'],
            '2B': s.SecondBaseHitsAllowed['#text'],
            '3B': s.ThirdBaseHitsAllowed['#text'],
            ER: s.EarnedRunsAllowed['#text'],
            HR: s.HomerunsAllowed['#text'],
            BB: s.PitcherWalks['#text'],
            STRM: s.PitcherStrikesMiss['#text'],
            GROB: s.PitcherGroundBalls['#text'],
            FLYB: s.PitcherFlyBalls['#text'],
            LD: s.PitcherLineDrives['#text'],
            SO: s.PitcherStrikeouts['#text'],
            BA: s.PitchingAvg['#text'],
            WHIP: s.WalksAndHitsPerInningPitched['#text'],
            TBF: s.TotalBattersFaced['#text'],
            NP: s.PitchesThrown['#text'],
            OBP: s.PitcherOnBasePct['#text'],
            SLG: s.PitcherSluggingPct['#text'],
            OPS: s.PitcherOnBasePlusSluggingPct['#text']
        }
        if (year === '2017') mongo.addPitcherLast(id, pObject)
        if (year === '2018') mongo.addPitcherCurrent(id, pObject)
      }
      return null
    }).catch(err=>{console.log(err)})
  return null
}

function addPitcherLogs(url) {
  return cache.get(url)
    .then(rawPitcherLogs => {
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
    })

}

function getPitchersLastTen(playerGames){
  playerGames.sort((a, b) => {
    var date1 = a.game.date.replace(/-/g, "")
    var date2 = b.game.date.replace(/-/g, "")
    if (Number(date1) > Number(date2)) return -1;
    if (Number(date1) < Number(date2)) return 1;
  })
  var gameLogs = playerGames.slice(0, 10)
  return gameLogs;
}

function getPitcherTenDayCum(playerGames, id){
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
    KBB: 0,
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
    if (s.StrikeoutsToWalksRatio === undefined) {
      continue pitcherLogs;
    } 
    cumLogsObj.W += Number(s.Wins['#text']);
    cumLogsObj.L += Number(s.Losses['#text']);
    cumLogsObj.SV += Number(s.Saves['#text']);
    cumLogsObj.ERA += Number(s.EarnedRunAvg['#text']);
    cumLogsObj.SVO += Number(s.SaveOpportunities['#text']);
    let fullInnings = Number(Math.floor(s.InningsPitched['#text']));
    partialInnings  += Number(s.InningsPitched['#text']) - fullInnings;
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
    cumLogsObj.KBB += Number(s.StrikeoutsToWalksRatio['#text']);
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
  cumLogsObj.KBB = Number((cumLogsObj.KBB / playerGames.length).toFixed(3))
  mongo.addPitcherTenDay(id, cumLogsObj)
  return cumLogsObj;
}

function getPitcherLogGames(playerGames, id){
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
        KBB: s.StrikeoutsToWalksRatio['#text'],
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

// function format(){
//   getBatterUrls()
//   // getPitcherUrls()
// }

// format()

module.exports = { getBatterStats }