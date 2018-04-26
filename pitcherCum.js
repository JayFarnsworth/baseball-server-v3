const fetch = require('node-fetch');
const fs = require('fs');
const cache = require('./cache.js');
const cacheFetch = require('./cache-fetch.js');
const teams = ['ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CIN', 'CLE', 'COL', 'CWS', 'DET', 'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK', 'PHI', 'PIT', 'SD', 'SEA', 'SF', 'STL', 'TB', 'TEX', 'TOR', 'WAS'];
var years = ['2017', '2018'];
var mongo = require('./mongoBaseball.js');


function getPitcherUrls() {
  return cache.get('pitcherStatUrls')
    .then(pitcherUrls => {
      return pitcherUrls.map(url => {
        return addPitcherCum(url)
      })
      return pitcherUrls
    })
    .then(setTimeout((function () {
      return process.exit();
    }), 5000))
    // .then(() => {
    //   return cache.get('pitcherLogUrls')
    //     .then(pitcherLogUrls => {
    //       pitcherLogUrls.map(url => {
    //         return addPitcherLogs(url)
    //       })
    //     })
    // })
}
getPitcherUrls()

function addPitcherCum(url) {
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
        mongo.addPitcherStat(id, pObject, year)
        // if (year === '2017') mongo.addPitcherLast(id, pObject)
        // if (year === '2018') mongo.addPitcherCurrent(id, pObject)
      }
      return null
    }).catch(err => { console.log(err) })
  return null
}

module.exports = { getPitcherUrls }