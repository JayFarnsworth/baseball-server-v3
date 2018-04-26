const fetch = require('node-fetch');
const fs = require('fs');
const cache = require('./cache.js');
const cacheFetch = require('./cache-fetch.js');
const teams = ['ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CIN', 'CLE', 'COL', 'CWS', 'DET', 'HOU', 'KC', 'LAA', 'LAD', 'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK', 'PHI', 'PIT', 'SD', 'SEA', 'SF', 'STL', 'TB', 'TEX', 'TOR', 'WAS'];
var years = ['2017', '2018'];
var mongo = require('./mongoBaseball.js');
const batterCum = require('./batterCum.js');
const batterLogs = require('./batterLogs.js');
const pitcherCum = require('./pitcherCum.js');
const pitcherLogs = require('./pitcherLogs.js');


batterCum.getBatterStats()
batterLogs.getBatterLogs()
pitcherLogs.getPitcherUrls()
pitcherCum.getPitcherUrls()