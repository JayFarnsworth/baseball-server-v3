const db = require('monk')('localhost/baseballdb')


module.exports = {
  __db: db,
  createBatter,
  findBatter,
  findBatterByTeam,
  removeBatters,
  addBatterStat,
  addBatterCurrent,
  addBatterLast,
  addBatterTenDay,
  addBatterGameLogs,
  createFangraphsData,
  getFangraphsData,
  closeBatters,
  createPitcher,
  removePitchers,
  addPitcherStat,
  addPitcherCurrent,
  addPitcherLast,
  addPitcherTenDay,
  addPitcherGameLogs,
  findPitcher,
  findPitchersByTeam,
  createGame,
  createGameUpsert,
  findGame,
  deleteGames,
  update,
  remove,
  getIndexes,
  findTodaysGames
}

const batters = db.get('batters')
const pitchers = db.get('pitchers')
const fangraphs = db.get('fangraphs')
const games = db.get('games')
const stats = db.get('stats')


// batters
function createBatter(batter) {
  return batters.insert({
    id: batter.ID,
    FirstName: batter.FirstName,
    LastName: batter.LastName,
    Team: batter.Team.Abbreviation,
    info: batter
  })
}

function findBatter(id){
  return batters.find({id: id})
}
function findBatterByTeam(team){
  return batters.find({Team: team})
}

function removeBatters(){
  return batters.remove()
}

function addBatterStat(id, stat, year){
  var keyName = 'cum' + year
  return batters.findOneAndUpdate({ id: id }, {
    $set: {
    [keyName]: stat
  }})
}

function addBatterCurrent(id, stats) {
  return batters.findOneAndUpdate({ id: id }, {
    $set: {
      2018: stats
    }
  })
}

function addBatterLast(id, stats) {
  return batters.findOneAndUpdate({ id: id }, {
    $set: {
      2017: stats
    }
  })
}

function addBatterTenDay(id, stats) {
  return batters.findOneAndUpdate({ id: id }, {
    $set: {
      cumTenDay: stats
    }
  })
}
function addBatterGameLogs(id, games) {
  return batters.findOneAndUpdate({ id: id }, {
    $set: {
      gameLogs: games
    }
  })
}
function createFangraphsData(fanId, data) {
  return fangraphs.insert({
    fanId: fanId,
    data: {data}
  })
}
function getFangraphsData(fanId) {
  return fangraphs.find({ fanId: fanId })
}

function closeBatters(){
  return batters.close();
}

// pitchers
function createPitcher(pitcher) {
  return pitchers.insert({
    id: pitcher.ID,
    FirstName: pitcher.FirstName,
    LastName: pitcher.LastName,
    Team: pitcher.Team.Abbreviation,
    info: { pitcher }
  })
}
function removePitchers(){
  return pitchers.remove()
}
function addPitcherStat(id, stat, year) {
  var keyName = 'cum' + year
  return pitchers.findOneAndUpdate({ id: id }, {
    $set: {
      [keyName]: stat
    }
  })
}

function addPitcherCurrent(id, stats) {
  return pitchers.findOneAndUpdate({ id: id }, {
    $set: {
      2018: stats
    }
  })
}

function addPitcherLast(id, stats) {
  return pitchers.findOneAndUpdate({ id: id }, {
    $set: {
      2017: stats
    }
  })
}


function addPitcherTenDay(id, stats) {
  return pitchers.findOneAndUpdate({ id: id }, {
    $set: {
      cumTenDay: stats
    }
  })
}
function addPitcherGameLogs(id, games) {
  return pitchers.findOneAndUpdate({ id: id }, {
    $set: {
      gameLogs: games
    }
  })
}
function findPitcher(id){
  return pitchers.find({ id: id })
}
function findPitchersByTeam(team) {
  return pitchers.find({ Team: team })
}


// games
function createGame(game) {
  return games.insert(game)
}
function createGameUpsert(game) {
  return games.update({ id:game.id }, game, { upsert: true })
}
function findGame(id) {
  return games.find({ id: id })
}
function findTodaysGames(date){
  return games.find({date: date})
}
function deleteGames(){
  return games.remove()
}


// Stat Storage



function update(_id, user) {
  return games.update(_id, user)
}
function remove(query) {
  return games.remove(query)
}
function remove(_id) {
  return games.remove({ _id: _id })
}
function getIndexes() {
  return games.getIndexes()
}

function close() {
  return db.close()
}