import React, { useState, useEffect, useRef } from 'react'
import {
    Typography,
    Grid,
    Button,
    IconButton,
} from '@mui/material'
import { ScreenShare as ScreenShareIcon } from '@mui/icons-material';
import { makeStyles } from '@mui/styles'
import * as mediasoupClient from 'mediasoup-client'
import { useSelector } from 'react-redux'
import { io } from 'socket.io-client'
import clsx from 'clsx'

import ParticipantWindow from './ParticipantWindow'

const videoConstraints = {
    video: {
        width: { max: 640 },
        height: { max: 480 },
        // facingMode: { exact: 'user' }
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
    }
}

const screenConstraints = {
    video: {
        cursor: 'always',
        displaySurface: 'application',
    },
    audio: {
        echoCancellation: true,
    }
}

let globalParams = {
    // mediasoup params
    encoding: [
        {
            rid: 'r0',
            maxBitrate: 100000,
            scalabilityMode: 'S1T3',
        },
        {
            rid: 'r1',
            maxBitrate: 300000,
            scalabilityMode: 'S1T3',
        },
        {
            rid: 'r2',
            maxBitrate: 900000,
            scalabilityMode: 'S1T3',
        },
    ],
    codecOptions: {
        videoGoogleStartBitrate: 1000,
    }
}

// To be updated with global params
let cameraParams = {}
let micParams = {}
let screenVideoParams = {}
let screenAudioParams = {}

let sharingMode = 'self'

let device = null
let producerTransport = null
let consumerTransport = null
let tempConsumers = {}

const useStyles = makeStyles(theme => ({
    participantsContainer: {
        height: '85vh',
    },
    controlsPane: {
        height: '10vh',
    },
    controlsContainer: {
        backgroundColor: '#3C3C3C',
        borderRadius: 100,
        boxShadow: '10px 10px 15px'
    },
    controlIcon: {
        backgroundColor: `${theme.palette.primary.main} !important`,
    },
    participantWindow: {
        maxHeight: 250,
    },
}))

const VideoConference = (props) => {
    const classes = useStyles()

    const { username, joinRoom } = useSelector(state => state.user)
    const [socket, setSocket] = useState(null)
    const [localStream, setLocalStream] = useState(null);
    const [localScreenShareStream, setLocalScreenShareStream] = useState(null);
    const [routerRtpCapabilities, setRouterRtpCapabilities] = useState(null)
    // const [device, setDevice] = useState(null)
    const [error, setError] = useState('')

    // Producers
    const [cameraVideoProducer, setCameraVideoProducer] = useState(null)
    const [micAudioProducer, setMicAudioProducer] = useState(null)
    const [screenVideoProducer, setScreenVideoProducer] = useState(null)
    const [screenAudioProducer, setScreenAudioProducer] = useState(null)

    // Consumers hashmap
    const [consumers, setConsumers] = useState({});
    const consumersRef = useRef(consumers);

    const assignProducerTransportEvents = () => {
        producerTransport.on('connect', async({ dtlsParameters }, callback, errback) => {
            try {
                // Send local DTLS transport paramters to server-side transport
                await socket.emit('transport-connect', {
                    // transportId: producerTransport.id,
                    dtlsParameters,
                    room: joinRoom,
                    isConsumer: false,
                })
    
                // Tell the local transport that paramters were submitted to server-side
                callback()
            } catch (error) {
                errback(error)
            }
        })
    
        producerTransport.on('produce', async(parameters, callback, errback) => {
            try {
                await socket.emit('transport-produce', {
                    // transportId: producerTransport.id,
                    kind: parameters.kind,
                    rtpParameters: parameters.rtpParameters,
                    appData: parameters.appData,
                    room: joinRoom,
                    sharingMode
    
                }, ({ id }) => {
                    // On socket.io callback, tell local transport that parameters were submitted to server-side
                    // and provide it with server-side's transport's id
                    callback({ id })
                })
            } catch (error) {
                errback(error)
            }
        })
    }

    const assignProducerEvents = (streamType) => {
        const trackEnded = () => console.log('Track ended...')
        const transportClose = () => console.log('Transport closed...')

        switch(streamType) {
            case 'self':
                cameraVideoProducer.on('trackended', trackEnded)
                cameraVideoProducer.on('transportclose', transportClose)
                micAudioProducer.on('trackended', trackEnded)
                micAudioProducer.on('transportclose', transportClose)
                break

            case 'screen':
                screenVideoProducer.on('trackended', trackEnded)
                screenVideoProducer.on('transportclose', transportClose)
                screenAudioProducer.on('trackended', trackEnded)
                screenAudioProducer.on('transportclose', transportClose)
                break
        }
    }

    const assignConsumerTransportEvents = (consumerTransportId) => {
    
        consumerTransport.on('connect', async({ dtlsParameters }, callback, errback) => {
            try {
                // Send local DTLS transport paramters to server-side transport
                await socket.emit('transport-connect', {
                    dtlsParameters,
                    room: joinRoom,
                    isConsumer: true,
                    consumerTransportId,
                })
    
                // Tell the local transport that paramters were submitted to server-side
                callback()
            } catch (error) {
                errback(error)
            }
        })
    }

    const getScreenShare = async() => {
        sharingMode = 'screen'
        
        let stream = await navigator.mediaDevices.getDisplayMedia(screenConstraints);
        setLocalScreenShareStream(stream)
    
        let screenVideoTrack = stream.getVideoTracks()[0]
        let screenAudioTrack = stream.getAudioTracks()[0]
    
        screenVideoParams = {
            track: screenVideoTrack,
            ...globalParams,
        }
        screenAudioParams = {
            track: screenAudioTrack,
            ...globalParams,
        }
        
        setScreenVideoProducer(await producerTransport.produce(screenVideoParams))
        setScreenAudioProducer(await producerTransport.produce(screenAudioParams))
    }

    const consumeParticipant = (participantSocketId, streamType) => {
        return new Promise(async(resolve, reject) => {
            await socket.emit('consume-participant', {
                rtpCapabilities: device.rtpCapabilities,
                participantSocketId,
                room: joinRoom,
                sharingMode: streamType
            
            }, async({ consumerParams }) => {

                console.log('consumerParams', consumerParams)

                for(let i = 0; i < consumerParams.length; i++) {
                    let params = consumerParams[i]

                    if(params && params.error) {
                        console.log(params.error)
                        return
                    }
                    
                    let tempConsumer = await consumerTransport.consume({
                        id: params.id,
                        producerId: params.producerId,
                        kind: params.kind,
                        rtpParameters: params.rtpParameters
                    })
            
                    console.log('Consumer made:', tempConsumer)
            
                    // Tell server to resume this specific consumer
                    await socket.emit('consumer-resume', {
                        room: joinRoom,
                        participantSocketId: params.participantSocketId,
                        producerType: params.producerType,
                    }, () => {
                        tempConsumers[params.participantSocketId] = {
                            ...tempConsumers[params.participantSocketId],
                            [params.producerType]: tempConsumer,
                            username: params.participantUsername
                        }

                        if(i === consumerParams.length - 1)
                            resolve()
                    })
                }
            })
        })
    }

    // Numerous useEffects because a lot of states are updated on initial media server connection

    useEffect(async() => {
        if(routerRtpCapabilities) {
            await device.load({ routerRtpCapabilities })
            console.log('Device created', device)

            socket.emit('web-rtc-transport', { room: joinRoom, username }, async({ params }) => {
                // Callback fires when we get transport parameters on the server-side after it's created
                if(params.error) {
                    setError(params.error)
                    return
                }
    
                console.log('Router transport params recieved', params)
    
                // Create local send transport
                producerTransport = await device.createSendTransport(params)
                assignProducerTransportEvents()
                console.log('producerTransport', producerTransport)
        
                setCameraVideoProducer(await producerTransport.produce(cameraParams))
                setMicAudioProducer(await producerTransport.produce(micParams))
            })
        }
    }, [routerRtpCapabilities])

    useEffect(() => {
        if(cameraVideoProducer && micAudioProducer)
            assignProducerEvents('self')
    }, [cameraVideoProducer, micAudioProducer])


    useEffect(() => {
        if(screenVideoProducer && screenAudioProducer)
            assignProducerEvents('screen')
    }, [screenVideoProducer, screenAudioProducer])
    
    useEffect(() => {
        setSocket(io(process.env.REACT_APP_MEDIA_SERVER_SOCKET_URL))
    }, [])

    useEffect(async() => {
        if(socket) {
            // All socket methods assigned in one go
            socket.on('connected', ({ socketId }) => {
                console.log('Local socket id:', socketId)
            })
    
            socket.on('rtp-capabilities', async(data) => {
                // setDevice(new mediasoupClient.Device())
                device = new mediasoupClient.Device()
                setRouterRtpCapabilities(data.rtpCapabilities)
            })

            socket.on('server-consumer-transport-created', async({ serverConsumerTransportParams }) => {
                if(device) {
                    consumerTransport = await device.createRecvTransport(serverConsumerTransportParams)
                    assignConsumerTransportEvents(serverConsumerTransportParams.id)
                }
            })

            socket.on('other-participants', async({ otherParticipants, streamType }) => {
                tempConsumers = { ...tempConsumers, ...consumersRef.current }
                
                for(let i = 0; i < otherParticipants.length; i++) {
                    await consumeParticipant(otherParticipants[i], streamType)
                }

                setConsumers(currConsumers => {
                    let newConsumers = {
                        ...currConsumers,
                        ...tempConsumers,
                    }
                    consumersRef.current = newConsumers
                    return newConsumers
                })
                tempConsumers = {}
            })

            socket.on('new-stream', async({ participantSocketId, streamType }) => {
                tempConsumers = { ...tempConsumers, ...consumersRef.current }

                await consumeParticipant(participantSocketId, streamType)

                setConsumers(currConsumers => {
                    let newConsumers = {
                        ...currConsumers,
                        ...tempConsumers,
                    }
                    consumersRef.current = newConsumers
                    return newConsumers
                })
                tempConsumers = {}
            })

            socket.on('participant-disconnected', (disconnectedSocketId) => {
                setConsumers(currConsumers => {
                    let newConsumers = { ...currConsumers }
                    delete newConsumers[disconnectedSocketId]

                    consumersRef.current = newConsumers
                    return newConsumers
                })
            })

            // new-participant is still left !!
    
            let stream = await navigator.mediaDevices.getUserMedia(videoConstraints)
            setLocalStream(stream)
        
            let cameraVideoTrack = stream.getVideoTracks()[0]
            let micAudioTrack = stream.getAudioTracks()[0]
        
            cameraParams = {
                track: cameraVideoTrack,
                ...globalParams,
            }
            micParams = {
                track: micAudioTrack,
                ...globalParams,
            }
            socket.emit("create-or-join", joinRoom)
        }

    }, [socket])

    return (
        <div className='w-full flex flex-col justify-center'>
            <div className={clsx('mx-5 my-3', classes.participantsContainer)}>
                <Grid container spacing={3}>
                    <Grid item xs={6} sm={4} className={classes.participantWindow}>
                        {localStream && (
                            <ParticipantWindow 
                                id="local"
                                username={username}
                                selfStream={localStream}
                                screenStream={localScreenShareStream}
                                isMuted={true}
                            />
                        )}
                    </Grid>
                    {Object.values(consumers).map(consumer => {
                        console.log('Total consumers', consumers)
                        
                        return (
                            <Grid item xs={6} sm={4} key={consumer} className={classes.participantWindow}>
                                <ParticipantWindow
                                    username={consumer.username}
                                    consumers={{
                                        cameraVideoConsumer: consumer.cameraVideoProducer,
                                        micAudioConsumer: consumer.micAudioProducer,
                                        screenVideoConsumer: consumer.screenVideoProducer,
                                        screenAudioConsumer: consumer.screenAudioProducer,
                                    }}
                                    isMuted={false}
                                />
                            </Grid>
                        )
                    })}
                </Grid>
            </div>
            <div className={clsx('flex justify-center items-center', classes.controlsPane)}>
                <div className={clsx('p-2', classes.controlsContainer)}>
                    <IconButton
                        color='primary'
                        className={classes.controlIcon}
                        onClick={() => getScreenShare()}
                    >
                        <ScreenShareIcon htmlColor='#3C3C3C' />
                    </IconButton>
                </div>
            </div>
        </div>
    )
}


export default VideoConference