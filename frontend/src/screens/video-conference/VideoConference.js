import React, { useState, useEffect, useRef } from 'react'
import {
    Typography,
    Grid
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import * as mediasoupClient from 'mediasoup-client'
import { useSelector } from 'react-redux'
import { io } from 'socket.io-client'

import VideoComponent from './VideoComponent'

const useStyles = makeStyles(theme => ({
    video: {
        transform: 'scaleX(-1)',
        borderRadius: 10,
    }
}))

const videoConstraints = {
    video: {
        width: { max: 640 },
        height: { max: 480 },
    },
    audio: {
        echoCancellation: true
    }
}

const screenConstraints = {
    video: {
        cursor: 'always' | 'motion' | 'never',
        displaySurface: 'application' | 'browser' | 'monitor' | 'window',
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

let device = null
let producerTransport = null
let consumerTransport = null
let tempConsumers = {}

const VideoConference = (props) => {
	const classes = useStyles()

    const { username, joinRoom } = useSelector(state => state.user)
    const [socket, setSocket] = useState(null)
    const [localStream, setLocalStream] = useState(null);
    const [routerRtpCapabilities, setRouterRtpCapabilities] = useState(null)
    // const [device, setDevice] = useState(null)
    const [error, setError] = useState('')

    const [sharingMode, setSharingMode] = useState('self');

    const [cameraVideoProducer, setCameraVideoProducer] = useState(null)
    const [micAudioProducer, setMicAudioProducer] = useState(null)
    const [consumers, setConsumers] = useState({});

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

    const assignProducerEvents = () => {
        cameraVideoProducer.on('trackended', () => {
            // Close video track
            console.log('Track ended...')
        })
    
        cameraVideoProducer.on('transportclose', () => {
            // Close video track
            console.log('Transport closed...')
        })

        micAudioProducer.on('trackended', () => {
            // Close video track
            console.log('Track ended...')
        })
    
        micAudioProducer.on('transportclose', () => {
            // Close video track
            console.log('Transport closed...')
        })
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

    const consumeParticipant = (participantSocketId) => {
        return new Promise(async(resolve, reject) => {
            await socket.emit('consume-participant', {
                rtpCapabilities: device.rtpCapabilities,
                participantSocketId,
                room: joinRoom,
            
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

            socket.emit('web-rtc-transport', { room: joinRoom }, async({ params }) => {
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
            assignProducerEvents()

    }, [cameraVideoProducer, micAudioProducer])
    
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

            socket.on('other-participants', async({ otherParticipants }) => {
                for(let i = 0; i < otherParticipants.length; i++) {
                    await consumeParticipant(otherParticipants[i])
                }

                console.log('tempConsumers', tempConsumers)
                setConsumers(currConsumers => ({
                    ...currConsumers,
                    ...tempConsumers,
                }))
                tempConsumers = {}
            })

            socket.on('new-participant', async({ participantSocketId }) => {
                console.log('New participant', participantSocketId)
                await consumeParticipant(participantSocketId)

                console.log('tempConsumers', tempConsumers)
                setConsumers(currConsumers => ({
                    ...currConsumers,
                    ...tempConsumers,
                }))
                tempConsumers = {}
            })

            socket.on('consume-made', async({ params }) => {
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
                    }
                })
            })

            // new-participant is still left !!
    
            let stream = await navigator.mediaDevices.getUserMedia(videoConstraints)
            // let stream = await navigator.mediaDevices.getDisplayMedia(screenConstraints);
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
            {/* <Typography>
                { username }
            </Typography>

            <Typography>
                { joinRoom }
            </Typography> */}

            <div className='mx-5 my-3'>
                <Grid container spacing={3}>
                    <Grid item xs={6} sm={4}>
                        {localStream && (
                            <VideoComponent 
                                id="local"
                                stream={localStream}
                                className={classes.video}
                                isMuted={true}
                            />
                        )}
                    </Grid>
                    {Object.values(consumers).map(consumer => {
                        console.log('Total consumers', consumers)

                        if(!consumer.cameraVideoProducer || !consumer.micAudioProducer)
                            return null
                        
                        let { track: cameraVideoTrack } = consumer.cameraVideoProducer
                        let { track: micAudioTrack } = consumer.micAudioProducer

                        let tracks = {
                            cameraVideoTrack,
                            micAudioTrack,
                        }

                        return (
                            <Grid item xs={6} sm={4}>
                                <VideoComponent
                                    tracks={tracks}
                                    className={classes.video}
                                    isMuted={false}
                                />
                            </Grid>
                        )
                    })}
                </Grid>
            </div>
        </div>
    )
}


export default VideoConference