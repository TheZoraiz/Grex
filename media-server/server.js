const express = require('express')
let cors = require('cors')
const app = express(cors())

let http = require('http').Server(app)
let io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
})

const port = process.env.PORT || 3001

const mediasoup = require('mediasoup')

let worker

const createWorker = async () => {
    worker = await mediasoup.createWorker({
        logLevel: 'error',
        rtcMinPort: 10000,
        rtcMaxPort: 59999,
    })

    console.log('Worker', worker.pid, 'created')

    worker.on('died', error => {
        console.log('Worker', worker.pid, 'died', err)
        setTimeout(() => process.exit(1), 2000)
    })
}
createWorker()

app.use(express.static('public'))

http.listen(port, () => {
    console.log('Server listening on', port)
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

io.on('connection', async (socket) => {

    socket.on('create-or-join', async (room) => {

        let isCreator

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

        io.to(socket.id).emit('rtp-capabilities', {
            rtpCapabilities: routers[room].rtpCapabilities,
            isCreator
        })
    })

    socket.on('web-rtc-transport', async ({ room, username }, callback) => {
        transports[room] = {
            ...transports[room],
            [socket.id]: {
                username,
                producerTransport: await createWebRtcTransport(room, socket.id, callback),
                consumerTransport: await createWebRtcTransport(room, socket.id, undefined),
            }
        }

        let serverConsumerTransportParams = {
            id:             transports[room][socket.id].consumerTransport.id,
            iceParameters:  transports[room][socket.id].consumerTransport.iceParameters,
            iceCandidates:  transports[room][socket.id].consumerTransport.iceCandidates,
            dtlsParameters: transports[room][socket.id].consumerTransport.dtlsParameters,
        }

        io.to(socket.id).emit('server-consumer-transport-created', { serverConsumerTransportParams })

        console.log('transports', transports)
    })

    socket.on('transport-connect', async ({ dtlsParameters, consumerTransportId, isConsumer, room }) => {
        console.log('dtlsParameters recieved from socket', socket.id)
        
        if(isConsumer) {
            await transports[room][socket.id].consumerTransport.connect({ dtlsParameters })
            // await transports[room][socket.id]['consumerTransport'].connect({ dtlsParameters })

        } else {
            await transports[room][socket.id].producerTransport.connect({ dtlsParameters })
        }
    })

    socket.on('transport-produce', async ({ room, kind, rtpParameters, appData, sharingMode }, callback) => {
        let socketProducerTransport = transports[room][socket.id]['producerTransport']

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

        if(sharingMode === 'projection') {
            if(!transports[room]['projection'])
                transports[room]['projection'] = {}

            transports[room]['projection']['username'] = transports[room][socket.id]['username']
            transports[room]['projection']['userSocketId'] = socket.id
            transports[room]['projection'][producerName] = await socketProducerTransport.produce({
                kind, rtpParameters
            })
            tempProducer = transports[room]['projection'][producerName]

        } else {
            transports[room][socket.id][producerName] = await socketProducerTransport.produce({
                kind, rtpParameters
            })
            tempProducer = transports[room][socket.id][producerName]
        }

        tempProducer.on('transportclose', () => {
            console.log('Transport for', socket.id, 'has closed')
            tempProducer.close()
        })

        // Inform everyone of new participant, and new participant of other participants
        // AFTER new participant's producer has been made on server and locally
        if(
            sharingMode === 'self'
            && transports[room][socket.id]['cameraVideoProducer']
            && transports[room][socket.id]['micAudioProducer']
        ) {
            let otherParticipants = []
    
            otherParticipants = Object.keys(transports[room]).filter(id => id !== socket.id && id !== 'projection');
    
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
            (sharingMode === 'screen' && transports[room][socket.id]['screenVideoProducer'])
            || (sharingMode === 'projection' && transports[room]['projection']['projectionVideoProducer'])
            // && transports[room][socket.id]['screenAudioProducer']
        ) {
            otherParticipants = Object.keys(transports[room]).filter(id => id !== socket.id);
    
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
            otherParticipants = Object.keys(transports[room]).filter(id => id !== socket.id);
    
            if(otherParticipants.length > 0) {
                // Tell others participant that participant is projecting screen
                socket.broadcast.emit('projecting', {
                    streamType: sharingMode,
                })
            }
        }

        console.log('transports', transports)

        callback({ id: tempProducer.id })
    })

    socket.on('consume-participant', async({ rtpCapabilities, participantSocketId, room, sharingMode }, callback) => {
        try {
            let participantProducers = {}

            switch(sharingMode) {
                case 'self':
                    participantProducers = {
                        cameraVideoProducer: transports[room][participantSocketId]['cameraVideoProducer'],
                        micAudioProducer: transports[room][participantSocketId]['micAudioProducer'],
                    }
                    break

                case 'screen':
                    participantProducers = {
                        screenVideoProducer: transports[room][participantSocketId]['screenVideoProducer'],
                    }

                    // Because screens may or may not have audio
                    if(transports[room][participantSocketId]['screenAudioProducer'])
                        participantProducers = {
                            ...participantProducers,
                            screenAudioProducer: transports[room][participantSocketId]['screenAudioProducer'],
                        }
                    break

                case 'projection':
                    participantProducers = {
                        projectionVideoProducer: transports[room]['projection']['projectionVideoProducer'],
                    }
                    if(transports[room]['projection']['projectionAudioProducer'])
                        participantProducers = {
                            ...participantProducers,
                            projectionAudioProducer: transports[room]['projection']['projectionAudioProducer'],
                        }
                    break
                
                case 'all':
                    participantProducers = {
                        cameraVideoProducer: transports[room][participantSocketId]['cameraVideoProducer'],
                        micAudioProducer: transports[room][participantSocketId]['micAudioProducer'],
                    }

                    // Because participant may or may not be sharing a screen
                    if(transports[room][participantSocketId]['screenVideoProducer'])
                        participantProducers = {
                            ...participantProducers,
                            screenVideoProducer: transports[room][participantSocketId]['screenVideoProducer'],
                        }
                    if(transports[room][participantSocketId]['screenAudioProducer'])
                        participantProducers = {
                            ...participantProducers,
                            screenAudioProducer: transports[room][participantSocketId]['screenAudioProducer'],
                        }
                    break
            }

            let consumerParams = []
            let participantUsername = ''

            if(sharingMode === 'projection')
                participantUsername = transports[room]['projection']['username']
            else
                participantUsername = transports[room][participantSocketId]['username']

            let participantProducerTypes = Object.keys(participantProducers)

            for(let i = 0; i < participantProducerTypes.length; i++) {
                let producerType = participantProducerTypes[i]
                let tempProducer = participantProducers[producerType]

                if(routers[room].canConsume({
                    producerId: tempProducer.id,
                    rtpCapabilities
                })) {
    
                    if( !transports[room][socket.id].consumersList ) {
                        transports[room][socket.id] = {
                            ...transports[room][socket.id],
                            consumersList: {}
                        }
                    }
    
                    let tempConsumerTransport = transports[room][socket.id].consumerTransport
    
                    let tempConsumer = await tempConsumerTransport.consume({
                        producerId: tempProducer.id,
                        rtpCapabilities,
                        paused: true
                    })
    

                    if(sharingMode === 'projection') {
                        transports[room][socket.id].consumersList = {
                            ...transports[room][socket.id].consumersList,
                            [producerType]: tempConsumer,
                        }
                    } else {
                        transports[room][socket.id].consumersList[participantSocketId] = {
                            ...transports[room][socket.id].consumersList[participantSocketId],
                            [producerType]: tempConsumer,
                        }
                    }
            
                    console.log('transports', transports)
    
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
                    })
    
                } else {
                    // Tell participant that this specific producer cannot be consumed
                    console.log('Cannot consume', participantSocketId+'\'s', producerType)
                    io.to(socket.id).emit('cannot-consume-producer', { participantSocketId, producerType })
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
            transports[room][socket.id].consumersList[producerType].resume()
        else
            transports[room][socket.id].consumersList[participantSocketId][producerType].resume()
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

    socket.on('stopped-screenshare', ({ room }) => {
        delete transports[room][socket.id].screenVideoProducer
        delete transports[room][socket.id].screenAudioProducer

        Object.keys(transports[room])
            .filter(key => key !== 'projection' && key !== socket.id)
            .forEach(socketId => {
                delete transports[room][socketId].consumersList[socket.id].screenVideoProducer
                delete transports[room][socketId].consumersList[socket.id].screenAudioProducer
            })

        socket.to(room).emit('participant-stopped-screenshare', { participantSocketId: socket.id })
    })

    socket.on('stopped-projecting', ({ room }) => {
        let projectingUsername = transports[room]['projection']['username']
        delete transports[room]['projection']

        Object.keys(transports[room])
            .filter(key => key !== 'projection' && key !== socket.id)
            .forEach(socketId => {
                delete transports[room][socketId].consumersList[socket.id].projectionVideoProducer
                delete transports[room][socketId].consumersList[socket.id].projectionVideoProducer
            })

        socket.to(room).emit('projection-stopped', projectingUsername)
    })

    socket.on('camera-toggle', ({ room, paused, resumed }) => {
        if(paused)
            socket.to(room).emit('participant-camera-stopped', socket.id)

        if(resumed)
            socket.to(room).emit('participant-camera-resumed', socket.id)
    })

    socket.on('mic-toggle', ({ room, paused, resumed }) => {
        if(paused)
            socket.to(room).emit('participant-mic-stopped', socket.id)

        if(resumed)
            socket.to(room).emit('participant-mic-resumed', socket.id)
    })

    socket.on('disconnect', () => {
        console.log(socket.id, 'disconnected')

        Object.keys(transports).forEach(room => {
            delete transports[room][socket.id]

            if(transports[room]['projection'] && transports[room]['projection']['userSocketId'] === socket.id) {
                let projectingUsername = transports[room]['projection']['username']
                delete transports[room]['projection']

                Object.keys(transports[room]).forEach(socketId => {
                    delete transports[room][socketId].consumersList.projectionVideoProducer
                    delete transports[room][socketId].consumersList.projectionAudioProducer
                })

                socket.to(room).emit('projection-stopped', projectingUsername)
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
                    ip: '0.0.0.0', // replace with server's public IP address
                    announcedIp: '127.0.0.1',
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
