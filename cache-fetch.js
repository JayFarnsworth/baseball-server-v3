const cache = require('./cache.js');
const fetch = require('node-fetch');



function getJSON(url, options={}, msec) {
  console.log('cache fetch', url)
  return Promise.resolve()
    .then(()=>{
      return cache.get(url)
      .then(data=>{
        // if (data){
        //   return data
        // } 
        return delay(msec)
        .then(()=>{
          return fetch(url, options)
            .then(request => request.json())
            .then(data=>{
              cache.set(url, data)
              return data
            })
        })
      })
    }).catch(err=>console.log(err))
}

function delay(msec) {
  return new Promise(resolve => {
    setTimeout(resolve, msec);
  })
}

module.exports = getJSON;