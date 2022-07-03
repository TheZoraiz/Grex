require('dotenv').config()

const express = require('express')
let cors = require('cors')
const app = express(cors())
const mongoose = require('mongoose')

const config = require('./config')

let httpServer
const https = require('https')
const http = require('http')
const path = require('path')
const fs = require('fs')

if(process.env.RUNNING_MODE === 'production') {
    httpServer = https.createServer(
        {
          key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
          cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem')),
        },
        app
    )
} else {
    httpServer = http.createServer(app)
}

const { Server } = require('socket.io')

let io = new Server(httpServer, {
    cors: {
        origin: '*',
    }
})

const GroupMessage = require('./db_schemas/GroupMessage')
const Session = require('./db_schemas/Session')
const GroupForm = require('./db_schemas/GroupForm')
const SubmittedForm = require('./db_schemas/SubmittedForm')

config.connectDb()
mongoose.connection.once('error', () => {
    console.log('Error connecting to database')
    process.exit()
})
mongoose.connection.once('connected', () => console.log('Database connected'))

// ________________________
// API endpoints henceforth


const apiRoutes = require('./api/routes')
const cookieParser = require('cookie-parser')

app.use(cors({ credentials: true, origin: true }))
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(express.json())
app.use(express.static('public'))
app.use(express.static('public/uploads'))
app.use('/api', apiRoutes)
app.all('*', (req, res) => {
    res.redirect('/');
});


// ____________________________________________
// Socket.io and mediasoup SFU logic henceforth

const mediasoup = require('mediasoup')

let worker

const createWorker = async () => {
    worker = await mediasoup.createWorker({
        logLevel: 'error',
        rtcMinPort: 40000,
        rtcMaxPort: 49999,
    })

    console.log('Mediasoup worker', worker.pid, 'created')

    worker.on('died', error => {
        console.log('Mediasoup worker', worker.pid, 'died', err)
        setTimeout(() => process.exit(1), 2000)
    })
}
createWorker()

httpServer.listen(config.socketPort, () => {
    console.log('Server listening on', config.socketPort)
})

let routers = {}
let transports = {}
let mediaCodecs = [
    {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2
    },
    {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
            'x-google-start-bitrate': 1000
        }
    },
    {
        kind: "video",
        mimeType: "video/H264",
        clockRate: 90000,
        parameters: {
          'packetization-mode': 1,
          'level-asymmetry-allowed': 1,
          'profile-level-id': "42e01f",
        }
    }    
]
let groupMessages = {}
let groupSessions = {}

io.on('connection', async (socket) => {

    // _________________________________
    // Group socket endpoints henceforth

    socket.on('get-group-data', async (groupId, callback) => {
        // if(!groupMessages[groupId])
            groupMessages[groupId] = await GroupMessage.find({ groupId }).populate('userId').exec()

        // if(!groupSessions[groupId])
            groupSessions[groupId] = await Session.find({ groupId }).populate('groupId').exec()
        
        socket.join(groupId)
        callback({
            groupMessages: groupMessages[groupId],
            groupSessions: groupSessions[groupId],
        })
    })
    
    socket.on('start-group-session', async (groupId, callback) => {
        const newSession = new Session({
            groupId,
            status: 'ongoing',
        })
        await newSession.save()
        await newSession.populate('groupId')

        groupSessions[groupId].push(newSession)
        socket.to(groupId).emit('new-group-session-started', newSession);
        callback(newSession)
    })

    socket.on('send-group-message', async ({ userId, groupId, message }, callback) => {
        const newMessage = new GroupMessage({
            userId: mongoose.Types.ObjectId(userId),
            groupId: mongoose.Types.ObjectId(groupId),
            message,
        })
        await newMessage.save()
        await newMessage.populate('userId')
        
        groupMessages[groupId].push(newMessage)    
        io.to(groupId).emit('new-group-message', groupMessages[groupId]);
    })


    // ___________________________________________
    // Media streaming socket endpoints henceforth

    socket.on('create-or-join', async ({ room, user }) => {

        if(transports[room]?.participants) {
            let roomUserIds = Object.values(transports[room]['participants']).map(participant => participant.user.id)
            if(roomUserIds.indexOf(user.id) !== -1) {
                io.to(socket.id).emit('already-joined')
                return
            }
        }

        let settings

        // if room exists
        if (routers[room]) {
            isCreator = false
        } else {

            let newRouter = await worker.createRouter({ mediaCodecs })
            routers[room] = newRouter

            isCreator = true

            console.log('New router added', routers)
        }

        socket.join(room)

        console.log(socket.id, 'joined room', room)
        
        io.to(socket.id).emit('rtp-capabilities', {
            rtpCapabilities: routers[room].rtpCapabilities,
            isCreator
        })
    })

    socket.on('web-rtc-transport', async ({ room, user, isHost, hostControls }, callback) => {

        if(!transports[room]) {
            if(isHost)
                transports[room] = { participants: {}, hostControls }
            else
                transports[room] = { participants: {} }
        }
        
        if(isHost && !transports[room]['hostControls'])
            transports[room]['hostControls'] = hostControls
        
        if(!isHost && transports[room]['hostControls']?.liveForm)
            io.to(socket.id).emit('new-live-form', {
                form: transports[room]['hostControls'].liveForm,
                formsStatus: transports[room]['hostControls'].submittedForms,
            })

        else if(isHost && transports[room]['hostControls']?.liveForm)
            io.to(socket.id).emit('your-live-form-is-active', {
                form: transports[room]['hostControls'].liveForm,
                formsStatus: transports[room]['hostControls'].submittedForms,
            })

        transports[room]['participants'] = {
            ...transports[room]['participants'],
            [socket.id]: {
                username: user.name,
                user,
                producerTransport: await createWebRtcTransport(room, socket.id, callback),
                consumerTransport: await createWebRtcTransport(room, socket.id, undefined),
            }
        }

        let serverConsumerTransportParams = {
            id:             transports[room]['participants'][socket.id].consumerTransport.id,
            iceParameters:  transports[room]['participants'][socket.id].consumerTransport.iceParameters,
            iceCandidates:  transports[room]['participants'][socket.id].consumerTransport.iceCandidates,
            dtlsParameters: transports[room]['participants'][socket.id].consumerTransport.dtlsParameters,
        }

        io.to(socket.id).emit('server-consumer-transport-created', { serverConsumerTransportParams })

        console.log('transports', transports)
        console.log(`transports[${room}]`, transports[room])
    })

    socket.on('transport-connect', async ({ dtlsParameters, consumerTransportId, isConsumer, room }) => {
        console.log(`${socket.id}'s ${isConsumer ? 'consumer' : 'producer'} transport is connecting`)
        
        try {
            if(isConsumer) {
                await transports[room]['participants'][socket.id].consumerTransport.connect({ dtlsParameters })
                // await transports[room][socket.id]['consumerTransport'].connect({ dtlsParameters })
    
            } else {
                await transports[room]['participants'][socket.id].producerTransport.connect({ dtlsParameters })
            }
        
        } catch (error) {
            console.log(error)
            io.to(socket.id).emit('transport-connect-failed', error);
        }
    })

    socket.on('transport-produce', async ({ room, kind, rtpParameters, appData, sharingMode }, callback) => {
        let socketProducerTransport = transports[room]['participants'][socket.id]['producerTransport']

        let producerName = ''

        // Decide name of server-side producer
        switch(sharingMode) {
            case 'self':
                if(kind === 'video')
                    producerName = 'cameraVideoProducer'
                if(kind === 'audio')
                    producerName = 'micAudioProducer'
                break
            
            case 'screen':
                if(kind === 'video')
                    producerName = 'screenVideoProducer'
                if(kind === 'audio')
                    producerName = 'screenAudioProducer'
                break

            case 'projection':
                if(kind === 'video')
                    producerName = 'projectionVideoProducer'
                if(kind === 'audio')
                    producerName = 'projectionAudioProducer'
                break
        }

        let tempProducer

        try {

            if(sharingMode === 'projection') {
                if(!transports[room]['projection'])
                    transports[room]['projection'] = {}

                transports[room]['projection']['username'] = transports[room]['participants'][socket.id]['username']
                transports[room]['projection']['userSocketId'] = socket.id
                transports[room]['projection'][producerName] = await socketProducerTransport.produce({
                    kind, rtpParameters
                })
                tempProducer = transports[room]['projection'][producerName]

            } else {
                transports[room]['participants'][socket.id][producerName] = await socketProducerTransport.produce({
                    kind, rtpParameters
                })
                tempProducer = transports[room]['participants'][socket.id][producerName]
            }

            tempProducer.on('transportclose', () => {
                console.log('Producer for', socket.id, 'has closed')
                tempProducer.close()
            })

            // Inform everyone of new participant, and new participant of other participants
            // AFTER new participant's producer has been made on server and locally
            if(
                sharingMode === 'self'
                && transports[room]['participants'][socket.id]['cameraVideoProducer']
                && transports[room]['participants'][socket.id]['micAudioProducer']
            ) {
                let otherParticipants = []
        
                otherParticipants = Object.keys(transports[room]['participants']).filter(id => id !== socket.id);

                let breakoutRoomsArray = getBreakoutRoomsArray(room)

                // Tell newly joined participant about breakout rooms if they exist
                if(breakoutRoomsArray.length > 0) {
                    let newBreakoutRooms = breakoutRoomsArray.map(breakoutRoom => {
                        return {
                            ...breakoutRoom,
                            participants: Object.keys(transports[breakoutRoom.id]['participants']).length
                        }
                    })
                    // Update participant numbers
                    transports[newBreakoutRooms[0].id]['breakoutRooms'] = newBreakoutRooms

                    // Tell each room of new participant numbers and rooms
                    breakoutRoomsArray.forEach(breakoutRoom => {
                        io.to(breakoutRoom.id).emit('existing-breakout-rooms', newBreakoutRooms)
                    })
                }
        
                if(otherParticipants.length > 0) {
                    // Send list of participants to newly joined participant
                    io.to(socket.id).emit('other-participants', {
                        otherParticipants,
                        streamType: 'all',
                    })

                    // Tell new participant that a screen is being projected
                    if(transports[room]['projection']) {
                        io.to(socket.id).emit('new-stream', {
                            otherParticipants,
                            streamType: 'projection',
                        })
                    }
            
                    // Send newly joined participant's info to all other participants
                    otherParticipants.forEach(socketId => {
                        io.to(socketId).emit('new-stream', {
                            participantSocketId: socket.id,
                            streamType: sharingMode,
                        })
                    })
                }
            }

            if(
                (sharingMode === 'screen' && transports[room]['participants'][socket.id]['screenVideoProducer'])
                || (sharingMode === 'projection' && transports[room]['projection']['projectionVideoProducer'])
                // && transports[room][socket.id]['screenAudioProducer']
            ) {
                otherParticipants = Object.keys(transports[room]['participants']).filter(id => id !== socket.id);
        
                if(otherParticipants.length > 0) {
                    // Tell others participant that participant is sharing screen
                    otherParticipants.forEach(socketId => {
                        io.to(socketId).emit('new-stream', {
                            participantSocketId: socket.id,
                            streamType: sharingMode,
                        })
                    })
                }
            }

            if(
                sharingMode === 'projection'
                && transports[room]['projection']['projectionVideoProducer']
            ) {
                otherParticipants = Object.keys(transports[room]['participants']).filter(id => id !== socket.id);
        
                if(otherParticipants.length > 0) {
                    // Tell others participant that participant is projecting screen
                    socket.broadcast.emit('projecting', {
                        streamType: sharingMode,
                    })
                }
            }

            console.log('transports', transports)
            console.log(`transports[${room}]`, transports[room])

            callback({ id: tempProducer.id })

        } catch(error) {
            console.log(error)
            io.to(socket.id).emit('transport-produce-failed', error);
        }
    })

    socket.on('consume-participant', async({ rtpCapabilities, participantSocketId, room, sharingMode }, callback) => {
        try {
            let participantProducers = {}

            switch(sharingMode) {
                case 'self':
                    participantProducers = {
                        cameraVideoProducer: transports[room]['participants'][participantSocketId]['cameraVideoProducer'],
                        micAudioProducer: transports[room]['participants'][participantSocketId]['micAudioProducer'],
                    }
                    break

                case 'screen':
                    participantProducers = {
                        screenVideoProducer: transports[room]['participants'][participantSocketId]['screenVideoProducer'],
                    }

                    // Because screens may or may not have audio
                    if(transports[room]['participants'][participantSocketId]['screenAudioProducer'])
                        Object.assign(participantProducers, {
                            screenAudioProducer: transports[room]['participants'][participantSocketId]['screenAudioProducer'],
                        })
                    break

                case 'projection':
                    participantProducers = {
                        projectionVideoProducer: transports[room]['projection']['projectionVideoProducer'],
                    }
                    if(transports[room]['projection']['projectionAudioProducer'])
                        Object.assign(participantProducers, {
                            projectionAudioProducer: transports[room]['projection']['projectionAudioProducer'],
                        })
                    break
                
                case 'all':
                    // Check if participant has paused mic or camera. We always initialize camera and mic
                    // consumers on server and client-side so we use booleans to decide whether to show them
                    // or not
                    if(transports[room]['participants'][participantSocketId].hasOwnProperty('cameraPaused'))
                        Object.assign(participantProducers, {
                            cameraPaused: transports[room]['participants'][participantSocketId]['cameraPaused'],
                        })
                    if(transports[room]['participants'][participantSocketId].hasOwnProperty('micPaused'))
                        Object.assign(participantProducers, {
                            micPaused: transports[room]['participants'][participantSocketId]['micPaused'],
                        })

                    participantProducers = {
                        ...participantProducers,
                        cameraVideoProducer: transports[room]['participants'][participantSocketId]['cameraVideoProducer'],
                        micAudioProducer: transports[room]['participants'][participantSocketId]['micAudioProducer'],
                    }

                    // Because participant may or may not be sharing a screen
                    if(transports[room]['participants'][participantSocketId]['screenVideoProducer'])
                        Object.assign(participantProducers, {
                            screenVideoProducer: transports[room]['participants'][participantSocketId]['screenVideoProducer'],
                        })
                    if(transports[room]['participants'][participantSocketId]['screenAudioProducer'])
                        Object.assign(participantProducers, {
                            screenAudioProducer: transports[room]['participants'][participantSocketId]['screenAudioProducer'],
                        })
                    break
            }

            let consumerParams = []
            let participantUsername = ''
            let participantUserId = transports[room]['participants'][participantSocketId]?.userId

            if(sharingMode === 'projection')
                participantUsername = transports[room]['projection']['username']
            else
                participantUsername = transports[room]['participants'][participantSocketId]['username']

            let participantProducerTypes = Object.keys(participantProducers)

            for(let i = 0; i < participantProducerTypes.length; i++) {
                let producerType = participantProducerTypes[i]

                if(producerType === 'cameraPaused' || producerType === 'micPaused') {
                    consumerParams.push({
                        [producerType]: participantProducers[producerType],
                        participantSocketId,
                        participantUsername,
                    })
                    continue
                }

                let tempProducer = participantProducers[producerType]

                if(routers[room].canConsume({
                    producerId: tempProducer.id,
                    rtpCapabilities
                })) {
    
                    if( !transports[room]['participants'][socket.id].consumersList ) {
                        transports[room]['participants'][socket.id] = {
                            ...transports[room]['participants'][socket.id],
                            consumersList: {}
                        }
                    }
    
                    let tempConsumerTransport = transports[room]['participants'][socket.id].consumerTransport
    
                    let tempConsumer = await tempConsumerTransport.consume({
                        producerId: tempProducer.id,
                        rtpCapabilities,
                        paused: true
                    })
    

                    if(sharingMode === 'projection') {
                        transports[room]['participants'][socket.id].consumersList = {
                            ...transports[room]['participants'][socket.id].consumersList,
                            [producerType]: tempConsumer,
                        }
                    } else {
                        transports[room]['participants'][socket.id].consumersList[participantSocketId] = {
                            ...transports[room]['participants'][socket.id].consumersList[participantSocketId],
                            [producerType]: tempConsumer,
                        }
                    }
            
                    console.log('transports', transports)
                    console.log(`transports[${room}]`, transports[room])
    
                    tempConsumer.on('transportclose', () => {
                        console.log('Transport for', socket.id, 'has closed')
                    })
    
                    tempConsumer.on('producerclose', () => {
                        console.log('Producer of', socket.id, 'consumer has closed')
                    })
                    
                    consumerParams.push({
                        id: tempConsumer.id,
                        producerId: tempProducer.id,
                        kind: tempConsumer.kind,
                        rtpParameters: tempConsumer.rtpParameters,
                        producerType,
                        participantSocketId,
                        participantUsername,
                        participantUserId,
                    })
    
                } else {
                    // Tell participant that this specific producer cannot be consumed
                    console.log('Cannot consume', participantSocketId+'\'s', producerType)
                    io.to(socket.id).emit('cannot-consume-producer', { participantSocketId, producerType })
                    break
                }
            }
            
            callback({ consumerParams })            

        } catch(error) {
            console.log('Error on consuming:', error.message)
            callback({
                params: {
                    error
                }
            })
        }
    })

    socket.on('consumer-resume', ({ room, participantSocketId, producerType, projection }, callback) => {
        if(projection)
            transports[room]['participants'][socket.id].consumersList[producerType].resume()
        else
            transports[room]['participants'][socket.id].consumersList[participantSocketId][producerType].resume()
        callback()
    })

    socket.on('can-project-screen', ({ room }, callback) => {
        if(transports[room]['projection'])
            callback({
                projectionExists: true,
                projectingUser: transports[room]['projection']['username'],
            })
        else
            callback({
                projectionExists: false,
                projectingUser: null,
            })
    })

    socket.on('host-controls-changed', ({ room, hostControls }) => {
        try {
            transports[room].hostControls = hostControls

            let roomSockets = Object.keys(transports[room]['participants'])
            roomSockets = roomSockets.filter(socketId => socketId !== socket.id)

            roomSockets.forEach(socketId => {
                io.to(socketId).emit('new-host-controls', hostControls)
            })

        } catch(error) {
            console.log(error)
        }
    })

    socket.on('stopped-screenshare', ({ room }) => {
        delete transports[room]['participants'][socket.id].screenVideoProducer
        delete transports[room]['participants'][socket.id].screenAudioProducer

        Object.keys(transports[room]['participants'])
            .filter(key => key !== socket.id)
            .forEach(socketId => {
                delete transports[room]['participants'][socketId].consumersList[socket.id].screenVideoProducer
                delete transports[room]['participants'][socketId].consumersList[socket.id].screenAudioProducer
            })

        socket.to(room).emit('participant-stopped-screenshare', { participantSocketId: socket.id })
    })

    socket.on('stopped-projecting', ({ room }) => {
        let projectingUsername = transports[room]['projection']['username']
        delete transports[room]['projection']

        Object.keys(transports[room]['participants'])
            .filter(key => key !== socket.id)
            .forEach(socketId => {
                delete transports[room]['participants'][socketId].consumersList[socket.id].projectionVideoProducer
                delete transports[room]['participants'][socketId].consumersList[socket.id].projectionAudioProducer
            })

        socket.to(room).emit('projection-stopped', projectingUsername)
    })

    socket.on('camera-toggle', ({ room, paused, resumed }) => {
        try {
            if(paused) {
                socket.to(room).emit('participant-camera-stopped', socket.id)
                transports[room]['participants'][socket.id]['cameraPaused'] = true
            }
    
            if(resumed) {
                socket.to(room).emit('participant-camera-resumed', socket.id)
                transports[room]['participants'][socket.id]['cameraPaused'] = false
            }

        } catch(error) {
            console.log(error)
        }
    })

    socket.on('mic-toggle', ({ room, paused, resumed }) => {
        try {
            if(paused) {
                socket.to(room).emit('participant-mic-stopped', socket.id)
                transports[room]['participants'][socket.id]['micPaused'] = true
            }

            if(resumed) {
                socket.to(room).emit('participant-mic-resumed', socket.id)
                transports[room]['participants'][socket.id]['micPaused'] = false
            }

        } catch(error) {
            console.log(error)
        }
    })

    socket.on('breakout-room-created', roomTabs => {
        let hostRoom = null

        roomTabs.forEach(roomTab => {
            if(roomTab.name === 'Main Room') {
                transports[roomTab.id]['breakoutRooms'] = roomTabs
                hostRoom = roomTab

            } else if(hostRoom && transports[roomTab.id]) {
                transports[roomTab.id]['hostRoom'] = hostRoom
            }
            
            socket.to(roomTab.id).emit('new-breakout-room', roomTabs)

            if(!transports[roomTab.id])
                transports[roomTab.id] = {
                    participants: {},
                    hostRoom
                }
        })
    })

    socket.on('participant-breakout-room-transfer', ({ tabIndex, chosenParticipants }) => {
        try {
            chosenParticipants.forEach(participant => {
                io.to(participant.socketId).emit('transferred-to-breakout-room', tabIndex)
            })

        } catch(error) {
            console.log(error)
        }
    })

    socket.on('get-live-forms', async({ groupId }, callback) => {
        callback(await GroupForm.find({ groupId }).exec())
    })

    socket.on('issue-live-form', ({ room, form }, callback) => {
        transports[room]['hostControls'].liveForm = form
        transports[room]['hostControls'].submittedForms = []
        socket.to(room).emit('new-live-form', { form, formsStatus: [] })
        callback()
    })

    socket.on('end-live-form', ({ room }, callback) => {

        try {
            let tempForm = transports[room]['hostControls'].liveForm
            delete transports[room]['hostControls'].liveForm
            delete transports[room]['hostControls'].submittedForms

            socket.to(room).emit('live-form-ended', tempForm)
            callback()

        } catch(error) {
            console.log(error)
            io.to(socket.id).emit('error', error);
        }
    })

    socket.on('submit-form', async({ room, user, submissionForm }) => {
        try {
            const newSubmittedForm = new SubmittedForm({
                formId: submissionForm.formId,
                userId: user.id,
                submittedData: submissionForm.submissionForm
            })
            transports[room]['hostControls'].submittedForms?.push({ user, submissionForm })
            socket.to(room).emit('form-status-update', transports[room]['hostControls'].submittedForms)
            io.to(socket.id).emit('form-status-update', transports[room]['hostControls'].submittedForms)

            await newSubmittedForm.save()

        } catch(error) {
            console.log(error)
            io.to(socket.id).emit('error', error);
        }
    })

    socket.on('end-session', async(room, callback) => {

        try {
            socket.to(room).emit('session-ended')
            
            let breakoutRooms = getBreakoutRoomsArray(room)
            
            if(breakoutRooms.length > 0) {
                breakoutRooms.forEach(breakoutRoom => {
                    io.to(breakoutRoom.id).emit('session-ended')
                    delete transports[breakoutRoom.id]
                })
            }
            delete transports[room]
            callback()
    
            let session = await Session.findById(room).exec()
            session.status = 'finished'
            await session.save()
    
            let groupId = session.groupId.toString()
    
            groupSessions[groupId] = await Session.find({ groupId }).populate('groupId').exec()
            socket.to(groupId).emit('new-session-data', groupSessions[groupId])

        } catch(error) {
            console.log(error)
            io.to(socket.id).emit('end-session-cascading-failed', error);
        }

    })

    socket.on('disconnect', () => {
        console.log(socket.id, 'disconnected')

        Object.keys(transports).forEach(room => {
            delete transports[room]['participants'][socket.id]

            // If left participant was projecting to a room
            if(transports[room]['projection'] && transports[room]['projection']['userSocketId'] === socket.id) {
                let projectingUsername = transports[room]['projection']['username']
                delete transports[room]['projection']

                Object.keys(transports[room]['participants']).forEach(socketId => {
                    delete transports[room]['participants'][socketId].consumersList.projectionVideoProducer
                    delete transports[room]['participants'][socketId].consumersList.projectionAudioProducer
                })

                socket.to(room).emit('projection-stopped', projectingUsername)
            }

            let breakoutRooms = getBreakoutRoomsArray(room)
            
            // Update breakout rooms' participants number info
            if(breakoutRooms.length > 0) {
                let newBreakoutRooms =  breakoutRooms.map(breakoutRoom => {
                    return {
                        ...breakoutRoom,
                        participants: Object.keys(transports[breakoutRoom.id]['participants']).length
                    }
                })

                // Change breakoutRooms property of parent room
                transports[newBreakoutRooms[0].id]['breakoutRooms'] = newBreakoutRooms

                // Tell each room of new participant numbers and rooms
                breakoutRooms.forEach(breakoutRoom => {
                    io.to(breakoutRoom.id).emit('existing-breakout-rooms', newBreakoutRooms)
                })
            }
        })

        socket.broadcast.emit('participant-disconnected', socket.id)
    })
})

const createWebRtcTransport = async (room, currSocketId, callback) => {
    try {
        const webRtcTransportOptions = {
            listenIps: [
                {
                    ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0', // replace with server's public IP address
                    announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || '127.0.0.1',
                }
            ],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
        }

        let transport = await routers[room].createWebRtcTransport(webRtcTransportOptions)
        console.log('Transport', transport.id, 'created')

        transport.on('dtlsstatechange', dtlsState => {
            if (dtlsState === 'closed') {
                transport.close()
            }
        })

        transport.on('close', () => {
            console.log('Transport', transport.id, 'closed')
        })

        if(callback) {
            callback({
                params: {
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                }
            })
        }

        return transport

    } catch (error) {
        console.log(error)

        // Callback to client with error
        if(callback) {
            callback({
                params: {
                    error: error
                }
            })
        }
    }
}

// Later to be changed to roomId
const getBreakoutRoomsArray = (roomId) => {
    
    if(transports[roomId]['breakoutRooms'] || transports[roomId]['hostRoom']) {
        if(transports[roomId]['breakoutRooms'])
            return transports[roomId]['breakoutRooms']
        else {
            let mainRoomId = transports[roomId]['hostRoom'].id
            return transports[mainRoomId]['breakoutRooms']
        }
    }

    return []
}