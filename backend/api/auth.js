const jwt = require('jsonwebtoken')

const jwtAuthMiddleware = (req, res, next) => {
    let passedJwtToken = req.signedCookies.accessToken

    if(!passedJwtToken)
        return res.status(401).send('You need to login to use the app')

    jwt.verify(passedJwtToken, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err) {
            console.log(err)        
            res.clearCookie('accessToken', { httpOnly: true, signed: true })
            return res.status(403).send('Your session has expired, please login again')
        }
        req.user = user
        next()
    })
    
}
 
module.exports = jwtAuthMiddleware