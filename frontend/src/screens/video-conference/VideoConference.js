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
let usedParams = {} // To be updated with global params

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

	const localVidEl = useRef(null);

    const [videoProducer, setVideoProducer] = useState(null)
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
            console.log('Local \'producerTransport\' parameters', parameters)
    
            try {
                await socket.emit('transport-produce', {
                    // transportId: producerTransport.id,
                    kind: parameters.kind,
                    rtpParameters: parameters.rtpParameters,
                    appData: parameters.appData,
                    room: joinRoom
    
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
        videoProducer.on('trackended', () => {
            // Close video track
            console.log('Track ended...')
        })
    
        videoProducer.on('transportclose', () => {
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
            
            }, async({ params }) => {
                if(params && params.error) {
                    console.log(params.error)
                    return
                }
        
                console.log('Received params for server-side consumer for socket', participantSocketId)
        
                let tempConsumer = await consumerTransport.consume({
                    id: params.id,
                    producerId: params.producerId,
                    kind: params.kind,
                    rtpParameters: params.rtpParameters
                })
        
                console.log('Recieved track for producer '+params.producerId)
        
                // Tell server to resume this specific consumer
                await socket.emit('consumer-resume', {
                    consumerId: params.id,
                    room: joinRoom
                }, () => {
                    tempConsumers = {
                        ...tempConsumers,
                        [params.producerId]: tempConsumer,
                    }
                    resolve()
                })
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
        
                setVideoProducer(await producerTransport.produce(usedParams))
            })
        }
    }, [routerRtpCapabilities])

    useEffect(() => {
        if(videoProducer) {
            assignProducerEvents()
            console.log('videoProducer', videoProducer)
        }
    }, [videoProducer])
    
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
                console.log('otherParticipants', otherParticipants)
                for(let i = 0; i < otherParticipants.length; i++) {
                    await consumeParticipant(otherParticipants[i])
                }

                setConsumers(currConsumers => ({
                    ...currConsumers,
                    ...tempConsumers
                }))
                tempConsumers = {}
            })

            socket.on('new-participant', async({ participantSocketId }) => {
                console.log('New participant', participantSocketId)
                await consumeParticipant(participantSocketId)

                setConsumers(currConsumers => ({
                    ...currConsumers,
                    ...tempConsumers
                }))
                tempConsumers = {}
            })

            // new-participant is still left !!
    
            let stream = await navigator.mediaDevices.getUserMedia(videoConstraints)
            // let stream = await navigator.mediaDevices.getDisplayMedia(screenConstraints);
            setLocalStream(stream)
        
            let track = stream.getVideoTracks()[0]
        
            usedParams = {
                track,
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
                            />
                        )}
                    </Grid>
                    {Object.values(consumers).map(consumer => {
                        console.log('Total consumers:', consumers)
                        const { track } = consumer

                        return (
                            <Grid item xs={6} sm={4}>
                                <VideoComponent
                                    track={track}
                                    className={classes.video}
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