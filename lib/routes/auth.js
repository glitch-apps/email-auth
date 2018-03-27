// npm
const zid = require('zid')
const namez = require('namez')
const queryString = require('query-string')

// local
const middleware = require('../middleware.js')
const cache = require('../cache.js')
const db = require('../db.js')
const email = require('../email.js')

// auth
function routes(app) {
  
  // We need to do a few things here:
  //
  // 1. check the email address is valid
  // 2. put a token into Redis (but on Glitch we'll just save it in the app)
  // 3. send a verify email to the user
  // 4. redirect to the `/confirm` page
  app.post("/", middleware.redirectToMyIfLoggedIn, middleware.validateEmail, (req, res, next) => {
    if ( !res.locals.email ) {
      return res.render('index', { err : 'Invalid email address' }) 
    }

    // get the previously validated email
    const emailAddress = res.locals.email
    db.addEvent(emailAddress, 'Login Attempt', console.log)

    const confirm = zid(12)
    const verify = zid(12)
    const human = namez({ format : 'title', separator : ' ' })
    
    // Store this info into the cache under the `verify` namespace, since
    // it will be moved to the `confirm` namespace when the `/verify`
    // endpoint is hit from the link in the email.
    const key = `verify:${verify}`
    const data = {
      // no need for the 'human' string
      verify,
      confirm,
      email : emailAddress,
    }
    cache.put(key, data, err => {
      if (err) return next(err)

      // ToDo: send an email to the user
      email.sendVerify(emailAddress, verify, human, err => {
        if (err) return next(err)    
        const qs = queryString.stringify({ confirm, human, email : emailAddress })
        res.redirect(`/confirm?${qs}`)
      })
    })
  })
   
  app.get("/confirm", middleware.redirectToMyIfLoggedIn, (req, res) => {
    // here we need both the email and the (confirm) token
    const confirm = req.query.confirm || ''
    const human = req.query.human || ''
    const email = req.query.email || ''
    
    if ( !confirm || !human || !email ) {
      return res.render('confirm', { err : 'Invalid request, some params missing.' })
    }

    res.render('confirm', {
      confirm,
      human,
      email,
    })
  })

  app.get("/verify", middleware.redirectToMyIfLoggedIn, (req, res, next) => {
    // firstly, get the email and the (verify) token
    const email = req.query.email || ''
    const verify = req.query.verify || ''

    // we should check that verify is mostly what we are expecting
    if ( !verify.match(/^[A-Za-z0-9]{8,12}$/) ) {
      return res.render('verify', { err : 'Invalid token.' })
    }

    // firstly, see if this verify token is valid
    const verifyKey = `verify:${verify}`
    cache.get(verifyKey, (err, data) => {
      if (err) return next(err)
      // console.log('data:', data)

      if (!data) {
        return res.render('verify', { err : 'Unknown token.' })
      }

      // yay, we got a token, so check the email address is the same
      if ( email !== data.email ) {
        return res.render('verify', { err : 'Unknown email address.' })
      }

      // Now that we are here, we *know* we have a verified email address, so let's
      // create an account now (essentially a new one with no logins) so that it's ready
      // for the `/confirm.json` to confirm and create a session.
      db.createAccount(email, (err, account) => {
        if (err) return next(err)

        // all good, so move this data from `verify:*` to `confirm:*`
        const confirmKey = `confirm:${data.confirm}`
        cache.put(confirmKey, data, err => {
          if (err) return next(err)

          cache.del(verifyKey, err => {
            if (err) return next(err)
            db.addEvent(data.email, 'Verified', console.log)
            res.render('verify')
          })
        })
      })
    })
  })

  app.get("/confirm.json", middleware.redirectToMyIfLoggedIn, (req, res, next) => {
    // Check if this key exists in the cache, then confirm
    // all of the details are correct, and create a session if so.

    const email = req.query.email || ''
    const confirm = req.query.confirm || ''

    // we should check that verify is mostly what we are expecting
    if ( !confirm.match(/^[A-Za-z0-9]{8,12}$/) ) {
      return res.json({ ok : false, msg : 'Invalid token.' })
    }
    
    // firstly, see if this verify token is valid
    const confirmKey = `confirm:${confirm}`
    cache.get(confirmKey, (err, data) => {
      if (err) return next(err)

      if ( !data ) {
        return res.json({ ok : false, msg : 'Unknown token.' })
      }
      
      // check the email address is the same
      if ( email !== data.email ) {
        return res.json({ ok : false, err : 'Unknown email address.' })
      }

      // we can del this verify key in the cache now asynchrnously
      cache.del(confirmKey, err => {
        // even if this failed, the cache will clean up this key in 5 mins
        if (err) console.wanr(err)
      })

      // here we know that this user exists
      db.incrementLogins(email, (err, account) => {
        if (err) return next(err)

        // console.log('db.incrementLogins():', account)
        
        // all good, so create a session cookie
        db.addEvent(email, 'Logged In', console.log)
        req.session.account = account
        res.json({ ok : true, msg : 'Logged in'})
      })
    })

  })
  
  app.get("/logout", (req, res) => {
    // destroy the session
    db.addEvent(req.session.account.email, 'Logged Out', console.log)
    req.session = null
    res.redirect('/')
  })

}

// exports
module.exports = routes
