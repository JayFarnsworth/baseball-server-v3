const fetch = require('node-fetch');
const fs = require('fs');
const cache = require('./cache.js');
const cacheFetch = require('./cache-fetch.js');
const teams = ['ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CIN', 'CLE', 'COL', 'CWS', 'DET', 'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK', 'PHI', 'PIT', 'SD', 'SEA', 'SF', 'STL', 'TB', 'TEX', 'TOR', 'WAS'];
var years = ['2017', '2018'];
var mongo = require('./mongoBaseball.js');

function get() {
  cache.get('teamObject')
    .then(teamObject => {
      teams.map(team => {
        let batterIDs = Object.keys(teamObject[team].batters);
        let pitcherIDs = Object.keys(teamObject[team].pitchers);
        var fullBatters = batterIDs.map(id => {
          return mongo.findBatter(id)
            .then()
        })

      })
    })
}


function getAllBatters(){
  var teamsAll = teams.map(team => {
    return mongo.findBatterByTeam(team)
      // .then(teamPlayers)
  })
  return Promise.all(teamsAll)
    .then(allPlayerArr => {
      return cache.get('teamObject')
        .then(teamObject => {
          newTeamObject = {}
          teams.forEach(team => {
            newTeamObject[team] = {
              
            }
            let batters = teamObject[team].batters;
            var filtered = allPlayerArr.filter(array => {
              if (array[0].Team === team) return team
            })
            let newBatters = {};
            filtered[0].forEach(player => {
              newBatters[player.id] = player
            })
            return newTeamObject[team].batters = newBatters;
          })
          cache.set('testObj', newTeamObject)
          return newTeamObject
        })
    })
    .then(withBatters => getAllPitchers(withBatters))
    
}
function getAllPitchers(withBatters) {
  var teamsAll = teams.map(team => {
    return mongo.findPitchersByTeam(team)
    // .then(teamPlayers)
  })
  return Promise.all(teamsAll)
    .then(allPlayerArr => {
      console.log(allPlayerArr)
      return cache.get('teamObject')
        .then(teamObject => {
          newTeamObject = {}
          teams.forEach(team => {
            newTeamObject[team] = {

            }
            let pitchers = teamObject[team].pitchers;
            // console.log(pitchers)
            var filtered = allPlayerArr.filter(array => {
              if (array[0].Team === team) return team
            })
            let newPitchers = {};
            filtered[0].forEach(player => {
              newPitchers[player.id] = player
            })
            newTeamObject[team].pitchers = newPitchers;
            newTeamObject[team].batters = withBatters[team].batters
            return newTeamObject
          })
          // console.log(newTeamObject)

          cache.set('testObj1', newTeamObject)
          return newTeamObject
        })
    })

}


getAllBatters()