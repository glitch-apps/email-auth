// local
const middleware = require('../middleware.js')
const db = require('../db.js')

// /my/
function routes(app) {
  
  app.get("/my/", middleware.checkLoggedIn, (req, res, next) => {
    const email = req.session.account.email
    db.getEvents(email, (err, events) => {
      if (err) return next(err)
      res.render('my', { account : req.session.account, events })
    })
  })
    
}

// exports
module.exports = routes
