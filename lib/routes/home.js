// local
const middleware = require('../middleware.js')

// /my/
function routes(app) {
  
  app.get("/", middleware.redirectToMyIfLoggedIn, (req, res) => {
    res.render('index')
  })
    
}

// exports
module.exports = routes
