const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const jwtAuthMiddleware = require('../api/auth')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

// Models
const User = require('../db_schemas/User')
const EmailVerifications = require('../db_schemas/EmailVerifications')

const nodemailer = require('nodemailer')

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    }
})

router.get('/verifyEmail', async(req, res) => {
    try {
        let verificationEntry = await EmailVerifications.findOne({ verificationToken: req.query.token }).exec()
        await User.updateOne({ _id: verificationEntry.userId }, { emailVerifiedAt: new Date() })

        res.send('<h3>Your email has been verified!</h3>')

    } catch(error) {
        console.log(error)
        res.status(400).send(error)
    }
})

router.get('/login', (req, res) => {
    res.send('<h1>This is the api login route</h1>')
})

router.post('/register', async (req, res) => {
    let reqBody = req.body

    if (await User.findOne({ name: reqBody.username }).exec())
        return res.status(409).send('Username already exists')

    if (await User.findOne({ email: reqBody.email }).exec())
        return res.status(409).send('Email already exists')

    try {
        let passwordHash = bcrypt.hashSync(reqBody.password, bcrypt.genSaltSync(10))
    
        const newUser = new User({
            name: reqBody.username,
            email: reqBody.email,
            password: passwordHash,
        })
    
        await newUser.save()
    
        let verificationToken = crypto.createHash('sha256').update(reqBody.password).digest('hex')
        await EmailVerifications.create({
            userId: newUser._id,
            verificationToken,
        })

        let verificationLink = process.env.HOST_URI + '/api/verifyEmail?token=' + verificationToken
        let mailOptions = {
            from: process.env.EMAIL,
            to: reqBody.email,
            subject: 'Grex - Please verify your account',
            html: 'Please click the link below <br> <a target="_blank" href="'+verificationLink+'">'+verificationLink+'</a>'
        }

        console.log('Sending email...')
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error)
                res.status(400).send(error)
            } else {
                console.log('Email sent: ' + info.response)
                res.send('Registration successfull and verification email sent')
            }
        })

    } catch(error) {
        console.log(error)
        res.status(400).send(error)
    }

})

router.use(jwtAuthMiddleware)


module.exports = router