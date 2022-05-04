const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')

router.get('/login', (req, res) => {
    res.send('<h1>This is the api login route</h1>')
})
 
module.exports = router