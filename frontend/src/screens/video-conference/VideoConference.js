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
    }
}))

let tempServerConsumerTransportId = null;

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

const VideoConference = (props) => {
	const classes = useStyles()

    const { username, joinRoom } = useSelector(state => state.user)
    const [socket, setSocket] = useState(null)
    const [localStream, setLocalStream] = useState(null);
    const [routerRtpCapabilities, setRouterRtpCapabilities] = useState(null)
    const [device, setDevice] = useState(null)
    const [error, setError] = useState('')

	const localVidEl = useRef(null);

    // Transports
    const [producerTransport, setProducerTransport] = useState(null)
    const [consumerTransport, setConsumerTransport] = useState(null)

    const [videoProducer, setVideoProducer] = useState(null)
    const [consumers, setConsumers] = useState({});
    const [consumerVidEls, setConsumerVidEls] = useState([]);

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

    const assignConsumerTransportEvents = (consumerId) => {
    
        consumerTransport.on('connect', async({ dtlsParameters }, callback, errback) => {
            try {
                // Send local DTLS transport paramters to server-side transport
                await socket.emit('transport-connect', {
                    dtlsParameters,
                    room: joinRoom,
                    isConsumer: true,
                    consumerId,
                })
    
                // Tell the local transport that paramters were submitted to server-side
                callback()
            } catch (error) {
                errback(error)
            }
        })
    }

    const consumeParticipant = async(participantSocketId) => {
    
        console.log('device', device)
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
    
            setConsumers({
                ...consumers,
                [params.producerId]: tempConsumer,
            })
            console.log('consumers:', consumers)
    
            const { track } = tempConsumer.consumer;
    
            console.log('Recieved track for producer '+params.producerId, track)
    
            // Tell server to resume this specific consumer
            await socket.emit('consumer-resume', {
                consumerId: params.id,
                room: joinRoom
            })
        })
    }

    // Numerous useEffects because a lot of states are updated on initial media server connection

    useEffect(async() => {
        if(device && routerRtpCapabilities) {
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
                setProducerTransport(await device.createSendTransport(params))
            })
        }
    }, [device, routerRtpCapabilities])

    useEffect(() => {
        let hasConsu
        Object.keys(consumers).forEach(consumer => {
            
        })
    }, [consumers])

    useEffect(async() => {
        if(producerTransport) {
            assignProducerTransportEvents()
            console.log('producerTransport', producerTransport)
    
            setVideoProducer(await producerTransport.produce(globalParams))
        }
    }, [producerTransport])

    useState(() => {
        if(videoProducer) {
            assignProducerEvents()
            console.log('videoProducer', videoProducer)
        }
    }, [videoProducer])
    
    useEffect(() => {
        console.log('ran')
        setSocket(io(process.env.REACT_APP_MEDIA_SERVER_SOCKET_URL))
    }, [])

    useEffect(() => {
        if(consumerTransport && tempServerConsumerTransportId)
            assignConsumerTransportEvents(tempServerConsumerTransportId)
        
    }, [consumerTransport])

    useEffect(async() => {
        if(socket) {
            // All socket methods assigned in one go
            socket.on('connected', ({ socketId }) => {
                console.log('Local socket id:', socketId)
            })
    
            socket.on('rtp-capabilities', async(data) => {
                setRouterRtpCapabilities(data.rtpCapabilities)
                setDevice(new mediasoupClient.Device())
            })

            socket.on('server-consumer-transport-created', async({ serverConsumerTransportParams }) => {
                if(device) {
                    tempServerConsumerTransportId = serverConsumerTransportParams.id
                    setConsumerTransport(await device.createRecvTransport(serverConsumerTransportParams))
                }
            })

            socket.on('other-participants', async({ otherParticipants }) => {
                for(let i = 0; i < otherParticipants.length; i++) {
                    consumeParticipant(otherParticipants[i])
                }
            })
    
            let stream = await navigator.mediaDevices.getUserMedia(videoConstraints)
            // let stream = await navigator.mediaDevices.getDisplayMedia(screenConstraints);
            setLocalStream(stream)
            // localVideo.srcObject = stream
            // localVideo.muted = true
        
            let track = stream.getVideoTracks()[0]
        
            globalParams = {
                track,
                ...globalParams,
            }
            console.log('globalParams', globalParams)
            socket.emit("create-or-join", joinRoom)
        }

    }, [socket])

    return (
        <div className='w-full flex flex-col justify-center'>
            <Typography>
                { username }
            </Typography>

            <Typography>
                { joinRoom }
            </Typography>

            <Grid container spacing={3}>
                <Grid xs={6} sm={4}>
                    {localStream && (
                        <VideoComponent 
                            id="local"
                            stream={localStream}
                            className={classes.video}
                        />
                    )}
                </Grid>
                {Object.keys(consumers).map(consumer => {
                    let tempConsumer = consumers[consumer];
                    const { track } = tempConsumer.consumer;

                    return (
                        <Grid xs={6} sm={4}>
                            <VideoComponent
                                stream={track}
                                className={classes.video}
                            />
                        </Grid>
                    )
                })}
            </Grid>
        </div>
    )
}


export default VideoConference