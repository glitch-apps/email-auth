// For the purposes of this example app, we're just going to use LevelDB
// as a local store. In the real world you'd probably use a relational database,
// a NoSQL store, or some kind of cloud hosted data store.

// core
const path = require('path')

// npm
const level = require('level')

// setup
const dir = path.join(__dirname, '..', '.data', 'db')
const db = level(dir, { valueEncoding : 'json' })

function createAccount(email, callback) {
  // Hit your database and create an account. If the account already exists
  // then just return it as-is. This is performed on the `/verify` step, not
  // the `/confirm.json` step so here we create a verified account only.
  const key = 'account~' + email
  db.get(key, (err, data) => {
    if (err) {
      if (err.notFound) {
        const now = (new Date()).toISOString()
        const account = {
          email,
          logins   : 0,
          inserted : now,
          updated  : now
        }
        db.put(key, account, err => {
          if (err) return callback(err)
          db.get(key, callback)
        })
      }
      return callback(err)
    }
    callback(null, data)
  })
}

function incrementLogins(email, callback) {
  const key = 'account~' + email
  db.get(key, (err, account) => {
    if (err) {
      if (err.notFound) {
        // this shouldn't ever happen
      }
      return callback(err)
    }
    const now = (new Date()).toISOString()
    account.logins = account.logins + 1
    account.updated = now
    db.put(key, account, err => {
      if (err) return callback(err)
      db.get(key, callback)
    })
  })
}

function login(email, callback) {
  const key = 'account~' + email
  // ToDo: increment the number of `logins` (and `updated`) and save the account.
  db.get(key, callback)
}

function addEvent(email, msg, callback) {
  const now = (new Date()).toISOString()
  const key = `log~${email}~${now}`
  db.put(key, { msg, now }, callback)
}

function getEvents(email, callback) {
  const events = []
  const opts = {
    gt : `log~${email}~`,
    lt : `log~${email}~~`,
    reverse : true,
    limit : 10,
  }
  db.createReadStream(opts)
    .on('data', (data) => {
      // console.log('data:', data)
      events.push(data.value)
    })
    .on('end', () => {
      console.log('events.length:', events.length)
      callback(null, events)
    })
    .on('error', function (err) {
      callback(err)
    })
  ;
}

// exports
module.exports = {
  createAccount,
  incrementLogins,
  login,
  addEvent,
  getEvents,
}
