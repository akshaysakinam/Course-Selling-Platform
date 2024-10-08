
const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
dotenv.config()
const JWT_ADMIN_PASSWORD = process.env.JWT_ADMIN_PASSWORD


function adminMiddleWare(req, res, next) {
    jwt.verify(req.headers.token, JWT_ADMIN_PASSWORD, function (err, decoded) {
        if (err) {
            res.status(403).json({
                message: "Invalid token"
            })
            return
        } else {
            req.user = decoded
            next()
        }
    })
}

module.exports = {
    adminMiddleWare: adminMiddleWare
}