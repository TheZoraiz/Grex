const jwtAuthMiddleware = (req, res, next) => {
    console.log('Auth confirmation')
    next()
}
 
module.exports = jwtAuthMiddleware