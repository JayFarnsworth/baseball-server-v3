const fetch = require('node-fetch');
const fs = require('fs');
const cache = require('./cache.js');
const cacheFetch = require('./cache-fetch.js');
const teams = ['ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CIN', 'CLE', 'COL', 'CWS', 'DET', 'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK', 'PHI', 'PIT', 'SD', 'SEA', 'SF', 'STL', 'TB', 'TEX', 'TOR', 'WAS'];
const teamNames = {
  'ARI': 'Diamondbacks', 'ATL': 'Braves', 'BAL': 'Orioles', 'BOS': 'Red Sox', 'CHC': 'Cubs', 'CIN': 'Reds', 'CLE': 'Indians', 'COL': 'Rockies', 'CWS': 'White Sox', 'DET': 'Tigers', 'HOU': 'Astros', 'KC': 'Royals', 'LAA': 'Angels', 'LAD': 'Dodgers', 'MIA': 'Marlins', 'MIL': 'Brewers', 'MIN': 'Twins', 'NYM': 'Mets', 'NYY': 'Yankees', 'OAK': 'Athletics', 'PHI': 'Phillies', 'PIT': 'Pirates', 'SD': 'Padres', 'SEA': 'Mariners', 'SF': 'Giants', 'STL': 'Cardinals', 'TB': 'Rays', 'TEX': 'Rangers', 'TOR': 'Blue Jays', 'WAS': 'Nationals'
}
const teamNames1 = [
   'Diamondbacks',  'Braves',  'Orioles',  'Red Sox',  'Cubs',  'Reds',  'Indians',  'Rockies',  'White Sox',  'Tigers',  'Astros', 'Royals',  'Angels',  'Dodgers',  'Marlins',  'Brewers',  'Twins',  'Mets',  'Yankees',  'Athletics',  'Phillies',  'Pirates', 'Padres',  'Mariners', 'Giants',  'Cardinals', 'Rays',  'Rangers',  'Blue Jays',  'Nationals'
]
var years = ['2017', '2018'];
var mongo = require('./mongoBaseball.js');

function getBatterUrls(team){
  cache.get('playerObject')
  .then(playerObject => {
    var rockies = Object.keys(playerObject[team].batters)

    var urlList = [];
    rockies.map(id=>{
      let fgId = getFgId(playerObject[team].batters[id])
      if (fgId === undefined || fgId === null) {
        return null;
      } else {
        return urlList.push(`http://localhost:4000/getfangraphstats/?batter=${fgId}`)
      }
    })
    var cacheName = team + 'fgurls';
    cache.set(cacheName, urlList)
      .then(()=>{
        process.exit()
      })
  })
}
function getFgId(batter){
  return batter.IDs.fg_id;
}




// FanGraphs Scrape and Format

function makeFetches(team){
  var cacheName = team + 'fgurls'
  cache.get(cacheName)
    .then(urlList => {
      return Promise.all(urlList.map((url, i) => {
        cacheFetch(url, {}, (i * 4000))
          .then(data => ({ ...data, url })).catch(err => { console.log(err) })
      }))
    })
}

function constructFgObj(team){
  var cacheN = team + 'fgurls'
  cache.get(cacheN)
    .then(urls => {
      return urls.map(url => {
        return cache.get(url)
          .then(stats => {
            let statObj = eliminateBadFgData(stats);
            // let yearFiltered = filterYear(statObj, '2018')
            let noMinors = filterMinors(statObj)
            let cacheName = url + 'filtered';
            return cache.set(cacheName, noMinors)
          })
      })
    })
}
// testFgObj('http://localhost:4000/getfangraphstats/?batter=8267')
// function testFgObj(url) {
//         return cache.get(url)
//           .then(stats => {
//             if (stats.length < 3) {return null}
//             let statObj = eliminateBadFgData(stats);
//             // let yearFiltered = filterYear(statObj, '2018')
//             let noMinors = filterMinors(statObj)
//             let cacheName = url + 'formatted';
//             return cache.set(cacheName, noMinors)
//             mongo.createFangraphsData
//           })
// }

function eliminateBadFgData(object) {
  var statObject = {};
  for (let stat of object) {
    if (stat[0] === undefined) console.log(object)
    let keys = Object.keys(stat[0]);
    if (keys[0].includes('Season')) statObject[keys[0]] = stat;
  }
  return statObject;
}

function filterYear(object, year){
  var newObject = {}
  var dataSets = Object.keys(object)
  for (let dataSet of dataSets) {
    var filtered = object[dataSet].filter(dataYear => {
      if (year === dataYear[dataSet]) {
        return dataYear
      }
    })
    newObject[dataSet] = filtered
  }

  return newObject
}

function filterMinors(object) {
  var setNames = Object.keys(object);
  var newObject = {}
  for (let key of setNames) {
    var filtered = object[key].filter(dataSet => {
      var setKeys = Object.keys(dataSet);
      for (let k of setKeys) {
        if (k.includes('Team')) var teamKey = k;
        if (k.includes('Season') && object[key].length === 1) return dataSet;
      }
      var setTeam = dataSet[teamKey]
      // console.log(setTeam);
      if (teamNames1.includes(setTeam)) {
        return dataSet
      } else {
        return false
      }
    })
  newObject[key] = filtered
  }
  return newObject
}

function mongoCreateFg(){
  return cache.get('rockiesfgurls')
    .then(teamUrls => {
      return teamUrls.map(url => {
        return cache.get(url + 'filtered')
          .then(fgData => {
            return mongo.createFangraphsData(url, fgData)
          })
      })
    })
}
// getBatterUrls('ATL')
// makeFetches('ATL')
constructFgObj('ATL')
// mongoCreateFg()
// const request = async () => {
//   const batterUrls = await getBatterUrls()
//   const fetches = await makeFetches()
//   const construct = await constructFgObj()
//   const mongoCreate = await mongoCreateFg()
// }
// request()


// process.exit()
