const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const jwtAuthMiddleware = require('../api/auth')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')

const util = require('./util')

// Models
const User = require('../db_schemas/User')
const EmailVerification = require('../db_schemas/EmailVerification')
const Group = require('../db_schemas/Group')

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    }
})

router.get('/verifyEmail', async(req, res) => {
    try {
        let verificationEntry = await EmailVerification.findOne({ verificationToken: req.query.token }).exec()
        await User.updateOne({ _id: verificationEntry.userId }, { emailVerifiedAt: new Date() })

        res.send('<h3>Your email has been verified!</h3>')

    } catch(error) {
        console.log(error)
        res.status(400).send(error)
    }
})

router.post('/login', async(req, res) => {
    let reqBody = req.body

    try {
        let userData = await User.findOne({ email: reqBody.email }).exec()
        if(!userData)
            return res.status(404).send('Email is not registered')
    
        // If not verified, resend verification link and notify user
        if(!userData.emailVerifiedAt) {
    
            let emailVerificationEntry = await EmailVerification.findOne({ userId: userData._id }).exec()
            let verificationToken
    
            if(!emailVerificationEntry) {
                verificationToken = crypto.createHash('sha256').update(userData.email).digest('hex')
                await EmailVerification.create({
                    userId: userData._id,
                    verificationToken,
                })
            } else {
                verificationToken = emailVerificationEntry.verificationToken
            }
    
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
    
            return res.status(403).send('Please verify your email. A verification link has been resent')
        }
        
        if(!bcrypt.compareSync(reqBody.password, userData.password))
            return res.status(403).send('Password is incorrect')
            
        let jwtUserData = {
            id: userData._id,
            name: userData.name,
            email: userData.email,
            emailVerifiedAt: userData.emailVerifiedAt
        }

        let jwtAccessToken = jwt.sign(jwtUserData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' })
    
        res.cookie('accessToken', jwtAccessToken, { httpOnly: true, signed: true })
        return res.send({
            msg: 'Login successfull',
            jwtUserData,
        })
        
    } catch (error) {

        console.log(error)
        res.status(400).send(error)
    }
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
    
        let verificationToken = crypto.createHash('sha256').update(reqBody.email).digest('hex')
        await EmailVerification.create({
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

// JWT Auth middleware used henceforth
router.use(jwtAuthMiddleware)

// If token is invalid, middleware will return an error and never proceed to this route
router.get('/verifyToken', (req, res) => {
    res.send({
        msg: 'Token is authentic',
        userData: req.user,
    })
})

router.get('/logout', (req, res) => {
    res.clearCookie('accessToken', { httpOnly: true, signed: true })
    res.send('Successfully logged out')
})

router.post('/create-group', async(req, res) => {
    let reqBody = req.body
    let user = req.user

    try {
        if(await Group.findOne({ host: user.id, name: reqBody.groupName }).exec())
            return res.status(409).send(`You've already created group ${reqBody.groupName}`)

        let groupJoinCode = crypto.randomBytes(10).toString('base64')
        
        while(await Group.findOne({ joinCode: groupJoinCode }).exec())
            groupJoinCode = crypto.randomBytes(10).toString('base64')
            
        await Group.create({
            name: reqBody.groupName,
            joinCode: groupJoinCode,
            host: mongoose.Types.ObjectId(user.id)
        })

        res.send(`Group ${reqBody.groupName} created successfully`)

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
})

router.post('/join-group', async(req, res) => {
    let reqBody = req.body
    let user = req.user

    try {
        let groupToJoin = await Group.findOne({ joinCode: reqBody.joinCode }).exec()
        if(!groupToJoin)
            return res.status(404).send('There is no such group with this join code')

        if(groupToJoin.host.toString() === user.id)
            return res.status(403).send('You cannot join this group because you are its host')

        if(groupToJoin.members.indexOf(mongoose.Types.ObjectId(user.id)) !== -1)
            return res.status(403).send('You are already a member of this group')

        groupToJoin.members.push(mongoose.Types.ObjectId(user.id))
        await groupToJoin.save()

        res.send(`Joined group ${groupToJoin.name} successfully`)

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
})

router.get('/get-user-groups', async(req, res) => {
    let user = req.user
    
    try {        
        let userGroups = await Group.find().or([
            { host: mongoose.Types.ObjectId(user.id) },
            { members: mongoose.Types.ObjectId(user.id) }
        ]).populate(['host', 'members']).exec()
        
        res.send(userGroups)

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }    
})


module.exports = router