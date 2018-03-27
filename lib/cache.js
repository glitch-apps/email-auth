// For the purposes of this example app, we're just keeping a local copy of
// these confirm and verify tokens, and associated email address.
//
// In the real world, you'd most likely use Redis (or Memcache) so that:
//
// 1. your tokens survive app restarts (esp. on Glitch, Heroku, Zeit, etc)
// 2. you can automatically expire your keys in Redis

const cache = {}

function put(key, data, callback) {
  // console.log('put() - cache:', cache)
  process.nextTick(() => {
    cache[key] = data
    // console.log('put() - cache:', cache)
    callback()
  })

  // expire this key in 5 mins
  const id = setTimeout(() => {
    delete cache[key]
  }, 5 * 60 * 1000)
  data.id = id
}

function get(key, callback) {
  // We're using a callback here to show how this would work in production
  // using Redis or Memcache, which requires an async call.
  process.nextTick(() => {
    callback(null, cache[key])
  })
}

function del(key, callback) {
  // console.log('del() - cache:', cache)
  process.nextTick(() => {
    if ( cache[key] && cache[key].id ) {
      clearTimeout(cache[key].id)
    }
    delete cache[key]
    // console.log('del() - cache:', cache)
    callback()
  })
}

// exports
module.exports = {
  put,
  get,
  del,
}
