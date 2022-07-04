const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const jwtAuthMiddleware = require('../api/auth')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const fs = require('fs')
const multer  = require('multer')
const upload = multer({ dest: './backend/temp_uploads' })
const path = require('path')

const util = require('./util')

// Models
const User = require('../db_schemas/User')
const EmailVerification = require('../db_schemas/EmailVerification')
const Group = require('../db_schemas/Group')
const GroupForm = require('../db_schemas/GroupForm')
const SubmittedForm = require('../db_schemas/SubmittedForm')
const Session = require('../db_schemas/Session')
const SessionAttendance = require('../db_schemas/SessionAttendance')

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    }
})

router.get('/memory', (req, res) => {
    const usedMem = process.memoryUsage().heapUsed / 1024 / 1024;
    res.send(`<h1> Approximately ${Math.round(usedMem * 100) / 100} MBs </h1>`);
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
        let userData = await User.findOne({ email: reqBody.email }).select('+password').exec()
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
            profPicPath: userData.profPicPath,
            email: userData.email,
            emailVerifiedAt: userData.emailVerifiedAt,
            createdAt: userData.createdAt
        }

        let jwtAccessToken = jwt.sign(jwtUserData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' })
    
        res.cookie('accessToken', jwtAccessToken, { httpOnly: true, signed: true })
        return res.send({
            msg: 'Login successfull',
            jwtUserData,
        })
        
    } catch (error) {

        console.log(error)
        res.status(500).send(error)
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

        let groupJoinCode = crypto.randomBytes(12).toString('base64')
        
        while(await Group.findOne({ joinCode: groupJoinCode }).exec())
            groupJoinCode = crypto.randomBytes(12).toString('base64')
            
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

router.post('/create-group-form', async(req, res) => {
    let reqBody = req.body

    try {
        await GroupForm.create({
            groupId: mongoose.Types.ObjectId(reqBody.groupId),
            formTitle: reqBody.formData.formTitle,
            formQuestions: JSON.stringify(reqBody.formData.formQuestions),
        })

        res.send('Created group form successfully')

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
})

router.get('/get-group-forms', async(req, res) => {
    try {        
        let groupForms = await GroupForm.find({ groupId: req.query.groupId }).populate('groupId').exec()
        res.send(groupForms)

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }    
})

router.get('/get-group-user-forms', async(req, res) => {
    try {        
        let groupFormIds = await GroupForm.find({ groupId: req.query.groupId }).distinct('_id').exec()
        let userForms = await SubmittedForm.find({ groupId: { $in: groupFormIds }, userId: req.query.userId, }).populate(['formId', 'userId']).exec()
        res.send(userForms)

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }    
})

router.post('/edit-group-form', async(req, res) => {
    let reqBody = req.body

    try {        
        await GroupForm.updateOne(
            { _id: reqBody.formId },
            {
                formTitle: reqBody.formData.formTitle,
                formQuestions: JSON.stringify(reqBody.formData.formQuestions)
            }
        )

        res.send('Edited group form successfully')

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }    
})

router.post('/delete-group-form', async(req, res) => {
    let reqBody = req.body

    try {        
        await GroupForm.deleteOne({ _id: reqBody.formId }).exec()
        res.send('Form deletes successfully')

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }    
})

router.get('/get-forms-submissions', async(req, res) => {
    try {
        let submittedForms = await SubmittedForm.find({ formId: req.query.formId }).populate(['formId', 'userId']).exec()
        res.send(submittedForms)

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }    
})

router.post('/upload-prof-pic', upload.single('profPicFile'), async(req, res) => {
    console.log(req.user.name)
    try {
        let picUser = await User.findById(mongoose.Types.ObjectId(req.user.id)).exec()
        let fileData = fs.readFileSync(req.file.path)
        let newFileName = req.file.filename + path.extname(req.file.originalname)

        fs.writeFileSync(__dirname + '/../public/uploads/' + newFileName, fileData)
        fs.unlinkSync(req.file.path)

        // Delete old prof pic
        if(fs.existsSync(__dirname + '/../public/' + picUser.profPicPath))
            fs.unlinkSync(__dirname + '/../public/' + picUser.profPicPath)

        picUser.profPicPath = 'uploads/'+newFileName
        await picUser.save()
        
        let jwtUserData = {
            id: picUser._id,
            name: picUser.name,
            email: picUser.email,
            profPicPath: picUser.profPicPath,
            emailVerifiedAt: picUser.emailVerifiedAt,
            createdAt: picUser.createdAt
        }

        let jwtAccessToken = jwt.sign(jwtUserData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' })
    
        res.cookie('accessToken', jwtAccessToken, { httpOnly: true, signed: true })
        return res.send({
            msg: 'Profile pic updated successfully',
            jwtUserData,
        })

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }    
})

router.get('/get-dashboard-data', async(req, res) => {
    let user = req.user

    try {
        let allUserGroups = await Group.find().or([
            { host: mongoose.Types.ObjectId(user.id) },
            { members: mongoose.Types.ObjectId(user.id) }
        ]).populate(['host', 'members']).exec()
        let groupIds = []

        allUserGroups.forEach(group => groupIds.push(mongoose.Types.ObjectId(group._id)))
        let liveSessions = await Session.find({ groupId: { $in: groupIds },  status: 'ongoing' }).populate('groupId').exec()

        let userHostGroups = await Group.find().or([
            { host: mongoose.Types.ObjectId(user.id) },
        ]).populate(['host', 'members']).exec()
        groupIds = []

        userHostGroups.forEach(group => groupIds.push(mongoose.Types.ObjectId(group._id)))
        let groupForms = await GroupForm.find({ groupId: { $in: groupIds } }).populate('groupId').exec()

        res.send({ allUserGroups, liveSessions, groupForms })

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }    
})

router.get('/get-session-attendances', async(req, res) => {
    try {
        let sessionAttendances = await SessionAttendance.find({ groupId: req.query.groupId }).populate(['sessionId', 'present', 'absent']).exec()
        res.send(sessionAttendances)

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }    
})


module.exports = router