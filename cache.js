const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')
const crypto = require('crypto')



function get (key) {
  var hashedName = crypto.createHash('sha256').update(key, 'utf8').digest('hex')
  const fileName = path.resolve("/tmp", hashedName)
  console.log(key, ' reading ', fileName)
  return fs.readFileAsync(fileName, 'utf8')
  .catch(error=>{
    console.log('cache miss ' + key + ' not found')
    return null
  })
  .then(rawData=>{
    return rawData && JSON.parse(rawData)
  })
}
function set (key, value) {
  var hashedName = crypto.createHash('sha256').update(key, 'utf8').digest('hex')
  const fileName = path.resolve("/tmp", hashedName)
  console.log(key, ' writing to ', fileName)
  return fs.writeFileAsync(fileName, JSON.stringify(value))
}


module.exports = {get, set}