const http = require('http')
const bodyParser = require('body-parser')
const tabletojson = require('tabletojson')
const morgan = require('morgan')
const cors = require('cors')
const port = parseInt(process.env.PORT || 4000)
const devMode = process.env.NODE_ENV !== 'production'
const id_list = require('./assets/player_ids.json')
const teamColors = require('./assets/teamColors.json');
const fetch = require('node-fetch');
const fs = require('fs');
const cache = require('./cache.js');
const cacheFetch = require('./cache-fetch.js');
const schedule = require('node-schedule');
const delay = 10000;
const logDelay = 20000;


// all MLB team abbreviations;
const teams = ['ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CIN', 'CLE', 'COL', 'CWS', 'DET', 'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK', 'PHI', 'PIT', 'SD', 'SEA', 'SF', 'STL', 'TB', 'TEX', 'TOR', 'WAS'];

// gets mysportsfeeds api url formatted date
function getDate() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!
  var yyyy = today.getFullYear();
  if (dd < 10) dd = '0' + dd;
  if (mm < 10) mm = '0' + mm;
  return yyyy + mm + dd;
}

// MySportsFeeds fetch Options
const MSFCredentials = { Authorization: 'Basic a3Vicmlja2FuOkgzbHRvbjE3MTcu' };
var MSFHeaders = {
  credentials: 'same-origin',
    headers: MSFCredentials,
      method: 'GET',
        mode: 'cors',
}

// Get updated rosters and match to active players list

function rosterPlayers(){
  return getPlayers(getDate())
    .then(body => {
      return getTeams(body.rosterplayers.playerentry)
        .then(sortBattersPitchers)
        .then(sorted => {
          return cache.set('teamObject', sorted)
        })
    })
}
function getTeams(players) {
  // var players = body.rosterplayers.playerentry;
  var url1 = 'https://api.mysportsfeeds.com/v1.2/pull/mlb/2018-regular/active_players.json';
  return cacheFetch(url1, MSFHeaders, 0)
    .then(resp => {
      var teamRosters = {};
      var unassignedPlayers = [];
      var allPlayers = resp.activeplayers.playerentry;
      for (let team of teams) {
        teamRosters[team] = {}
      };
      for (let player of players) {
        if (player.team) {
          var colors = teamColors.mlbColors.filter(color => {
            if (player.team.Name === color.name) return color;
          });
          var border = {
            border: '6px solid ' + colors[0].colors.secondary,
            backgroundColor: colors[0].colors.primary,
          };
          var logo = colors[0].logo;
        } else {
          var colors = [{ colors: {} }];
          border = {};
        }
        let a = allPlayers.filter(p => {
          if (p.player.ID == player.player.ID) return p;
        })
        var IDs = id_list.filter(id => {
          let name = player.player.FirstName + ' ' + player.player.LastName;
          let normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
          if (normalized === id.espn_name) return id;
        })
        if (IDs[0] !== undefined) {
          var IDSet = {
            bref_id: IDs[0].bref_id,
            mlb_id: IDs[0].mlb_id,
            fg_id: IDs[0].fg_id,
            espn_id: IDs[0].espn_id,
            rotowire_id: IDs[0].rotowire_id,
            msf_id: player.player.ID
          }
        } else var IDSet = {};
        if (a[0] !== undefined) {
          player.info = {
            ID: a[0].player.ID,
            LastName: a[0].player.LastName,
            FirstName: a[0].player.FirstName,
            JerseyNumber: a[0].player.JerseyNumber,
            Position: a[0].player.Position,
            Image: a[0].player.officialImageSrc,
            Handedness: a[0].player.handedness,
            Age: a[0].player.Age,
            Height: a[0].player.Height,
            Weight: a[0].player.Weight,
            Birthday: a[0].player.BirthDate,
            BirthCity: a[0].player.BirthCity,
            BirthCountry: a[0].player.BirthCountry,
            IsRookie: a[0].player.IsRookie,
            IDs: IDSet,
            Team: {
              City: player.team.City,
              Name: player.team.Name,
              Abbreviation: player.team.Abbreviation,
              Colors: colors[0].colors,
              Border: border,
              logo: logo
            }
          }
          if (player.team) {
            teamRosters[player.team.Abbreviation][player.info.ID] = player.info;
          } else {
            unassignedPlayers.push(player.player)
          }
        }
      }
      return teamRosters
    }).catch(err=>{console.log(err)});
    
}
function getPlayers(forDate) {
  var url = 'https://api.mysportsfeeds.com/v1.2/pull/mlb/2018-regular/roster_players.json?fordate=' + forDate;
  return cacheFetch(url, MSFHeaders)
}
function sortBattersPitchers(obj) {
  let rosterObj = obj
  var teams = Object.keys(rosterObj);
  for (let team of teams) {
    var players = Object.keys(rosterObj[team]);
    rosterObj[team].batters = {};
    rosterObj[team].pitchers = {};
    for (let player of players) {
      if (rosterObj[team][player].Position === 'P') {
        rosterObj[team].pitchers[player] = rosterObj[team][player];
      } else {
        rosterObj[team].batters[player] = rosterObj[team][player]
      }
    }
    rosterObj[team] = {
      pitchers: rosterObj[team].pitchers,
      batters: rosterObj[team].batters
    }
  }
  return rosterObj
}

// take batter or pitcher object and return url safe id list
function urlIdList(set){
  var commaSeparated = '';
  for (let playerId of set) {
    commaSeparated += playerId + ','
  }
  return commaSeparated;
}


// get team's batter's urls
function getBatterUrls() {
  cache.get('teamObject')
  .then(playerObject=>{
    var urlList = [];
    for (let team of teams) {
      var batterIds = Object.keys(playerObject[team].batters)
      var idCommaList = urlIdList(batterIds);
      // years to be added to stats
      var years = ['2017', '2018']
      for (let year of years) {
        let url = `https://api.mysportsfeeds.com/v1.2/pull/mlb/${year}-regular/cumulative_player_stats.json?player=${idCommaList}&playerstats=AB,R,H,2B,3B,HR,RBI,BB,SO,AVG,SLG,OPS,PA,LOB,GroB,FlyB,LD,NP,StrM,Swi`;
        urlList.push(url)
      }
    }
    cache.set('batterStatUrls', urlList)
    return urlList
  }).catch(err => { console.log(err) })
}

function fetchBatterCumulative(){
  cache.get('batterStatUrls')
  .then(urlList=>{
    return Promise.all(urlList.map((url, i) => {
      return cacheFetch(url, MSFHeaders, (i * delay))
        .then(data => ({ ...data, url })).catch(err => { console.log(err) })
    }))
  })
}
// let url = `https://api.mysportsfeeds.com/v1.2/pull/mlb/${year}-regular/cumulative_player_stats.json?player=${pitcherIds}&playerstats=W,L,ERA,IP,H,2B,3B,ER,HR,BB,StrM,GroB,FlyB,LD,SO,AVG,WHIP,TBF,NP,OBP,SLG,OPS,GS,SLG`;

function getPitcherUrls(){
  cache.get('teamObject')
  .then(playerObject=>{
    var urlList = [];
    for (let team of teams) {
      var pitcherIds = Object.keys(playerObject[team].pitchers)
      var idCommaList = urlIdList(pitcherIds);
      // years to be added to stats
      var years = ['2017', '2018']
      for (let year of years) {
        let url = `https://api.mysportsfeeds.com/v1.2/pull/mlb/${year}-regular/cumulative_player_stats.json?player=${pitcherIds}`;
        urlList.push(url)
      }
    }
    cache.set('pitcherStatUrls', urlList)
    return urlList  
  }).catch(err => { console.log(err) })
}

function fetchPitcherCumulative(urlList) {
  cache.get('pitcherStatUrls')
  .then(urlList=>{
    return Promise.all(urlList.map((url, i) => {
      return cacheFetch(url, MSFHeaders, (i * delay))
        .then(data => ({ ...data, url })).catch(()=>{console.log(err, 'problemUrl', url)})
    }))
  })
}



// get game logs
function getBatterLogUrls(){
  cache.get('teamObject')
  .then(playerObject=>{
    var urlList = []
    for (let team of teams) {
      var batterList = urlIdList(Object.keys(playerObject[team].batters))
      let url = `https://api.mysportsfeeds.com/v1.2/pull/mlb/current/player_gamelogs.json?player=${batterList}&date=since-10-days-ago&playerstats=AB,R,H,2B,3B,HR,RBI,BB,SO,AVG,SLG,OPS,PA,LOB,GroB,FlyB,LD,NP,StrM,Swi,HBP,TB,SF`;
      urlList.push(url)
    }
    cache.set('batterLogUrls', urlList)
    return urlList
  })
}
// let url = `https://api.mysportsfeeds.com/v1.2/pull/mlb/current/player_gamelogs.json?player=${pitcherList}&playerstats=W,L,ERA,SV,SVO,IP,H,2B,3B,R,ER,HR,BB,Swi,Str,StrF,StrM,StrL,GroB,FlyB,LD,SF,SO,AVG,WHIP,HB,HLD,TBF,NP,OBP,OPS,ABP,GS,SLG`
function getPitcherLogUrls() {
  cache.get('teamObject')
  .then(playerObject=>{
    var urlList = []
    for (let team of teams) {
      var pitcherList = urlIdList(Object.keys(playerObject[team].pitchers))
      let url = `https://api.mysportsfeeds.com/v1.2/pull/mlb/current/player_gamelogs.json?player=${pitcherList}&playerstats=W,L,ERA,SV,SVO,IP,H,2B,3B,R,ER,HR,BB,Swi,Str,StrF,StrM,StrL,GroB,FlyB,LD,SF,SO,AVG,WHIP,HB,HLD,TBF,NP,OBP,OPS,ABP,GS,SLG`;      
      urlList.push(url)
    }
    cache.set('pitcherLogUrls', urlList)
    return urlList
  })
}
function fetchBatterLogs() {
  cache.get('batterLogUrls')
  .then(urlList=>{
    return Promise.all(urlList.map((url, i) => {
      return cacheFetch(url, MSFHeaders, ((i * logDelay)))
        .then(data => ({ ...data, url })).catch(err => { console.error(err) })
    }))
  })
}
function fetchPitcherLogs() {
  cache.get('pitcherLogUrls')
  .then(urlList=>{
    return Promise.all(urlList.map((url, i) => {
      return cacheFetch(url, MSFHeaders, ((i * logDelay)))
        .then(data => ({ ...data, url })).catch(err => { console.log(err) })
    }))
  })
}

const makeFetches = () => {
  return Promise.all([
  fetchBatterCumulative(),
  fetchPitcherCumulative(),
  fetchBatterLogs(),
  fetchPitcherLogs(),
  ])
}
function go(){
  rosterPlayers()
    .then(getBatterUrls)
    .then(getPitcherUrls)
    .then(getBatterLogUrls)
    .then(getPitcherLogUrls)
    .then(makeFetches)
}

module.exports = { getBatterUrls, getPitcherUrls, getBatterLogUrls, getPitcherLogUrls, fetchBatterCumulative, makeFetches, rosterPlayers, go }

// const makeFetches = () => {
//   return Promise.all([
//     getBatterUrls(),
//     fetchBatterCumulative(),
//     getPitcherUrls(),
//     fetchPitcherCumulative(),
//     getBatterLogUrls(),
//     fetchBatterLogs(),
//     getPitcherLogUrls(),
//     fetchPitcherLogs(),
//   ])
// }