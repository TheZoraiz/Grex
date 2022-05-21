import React, { useState, useEffect, useRef } from 'react'
import {
    Typography,
    Grid,
    Button,
    IconButton,
    Snackbar,
    Slide,
    Menu,
    MenuItem,
    ListItemIcon,
    Tooltip,
    Alert,
    Popover,
    Slider,
} from '@mui/material'
import { tooltipClasses } from '@mui/material/Tooltip'
import {
    ScreenShare as ScreenShareIcon,
    SmartDisplay as ProjectScreenIcon,
    Mic as MicIcon,
    Videocam as VideocamIcon,
    GridView as GridViewIcon,
} from '@mui/icons-material';
import { makeStyles, styled } from '@mui/styles'
import * as mediasoupClient from 'mediasoup-client'
import { useSelector, useDispatch } from 'react-redux'
import { io } from 'socket.io-client'
import clsx from 'clsx'

import ParticipantWindow from './ParticipantWindow'
import { setSocket } from '../slices/sessionSlice'

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
let projectionVideoParams = {}
let projectionAudioParams = {}

let sharingMode = 'self'

let device = null
let producerTransport = null
let consumerTransport = null
let tempConsumers = {}

const useStyles = makeStyles(theme => ({
    participantsContainer: {
        overflowY: 'scroll',
        height: '80vh',
    },
    controlsPane: {
        height: '10vh',
    },
    controlsContainer: {
        backgroundColor: '#3C3C3C',
        borderRadius: 100,
        boxShadow: '10px 10px 15px #222222'
    },
    controlIcon: {
        backgroundColor: `${theme.palette.primary.main} !important`,
    },
    controlIconStop: {
        backgroundColor: `#E94335 !important`,
    },
    participantWindow: {
        // maxHeight: 250,
    },
    projectionVideoStyle: {
        borderRadius: 10,
        boxShadow: '0 0 10px'
    },
}))

const CustomTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
))({
    [`& .${tooltipClasses.tooltip}`]: {
        maxWidth: 300,
        fontSize: 15,
    },
});

const SessionScreen = (props) => {
    const classes = useStyles()
    const dispatch = useDispatch()

    const { username, joinRoom } = props;

    const { socket } = useSelector(state => state.session)
    // const [socket, setSocket] = useState(null)

    const [localStream, setLocalStream] = useState(null);
    const [localScreenShareStream, setLocalScreenShareStream] = useState(null);
    const [localProjectionStream, setLocalProjectionStream] = useState(null);

    const [routerRtpCapabilities, setRouterRtpCapabilities] = useState(null)
    // const [device, setDevice] = useState(null)
    const [error, setError] = useState('')

    // Producers
    const [cameraVideoProducer, setCameraVideoProducer] = useState(null)
    const [micAudioProducer, setMicAudioProducer] = useState(null)
    const [screenVideoProducer, setScreenVideoProducer] = useState(null)
    const [screenAudioProducer, setScreenAudioProducer] = useState(null)
    const [projectionVideoProducer, setProjectionVideoProducer] = useState(null)
    const [projectionAudioProducer, setProjectionAudioProducer] = useState(null)

    const [cameraPaused, setCameraPaused] = useState(false)
    const [micPaused, setMicPaused] = useState(false)

    const [snackbarInfo, setSnackbarInfo] = useState({
        message: '',
        severity: '',
    })
    const [snackbarOpen, setSnackbarOpen] = useState(false)
    const [anchorEl, setAnchorEl] = useState(null)

    const [gridAnchorEl, setGridAnchorEl] = useState(null)
    const [gridAnchorElOpen, setGridAnchorElOpen] = useState(false)
    const [gridHorizontalValue, setGridHorizontalValue] = useState(0)
    const [gridVerticalValue, setGridVerticalValue] = useState(100)

    // Consumers hashmap
    const [consumers, setConsumers] = useState({})
    const consumersRef = useRef(consumers)

    const [projectingUsername, setProjectingUsername] = useState('')
    const [projectionVideoConsumer, setProjectionVideoConsumer] = useState(null)
    const [projectionAudioConsumer, setProjectionAudioConsumer] = useState(null)

    const [sessionLog, setSessionLog] = useState([])

	const projectionVidEl = useRef(null);

    const logAlert = (message, severity) => {
        setSnackbarInfo({ message, severity })
        // setSessionLog(currSessionLog => [...currSessionLog, message])
        setSessionLog([...sessionLog, message])
        setSnackbarOpen(true)
    }

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
        setScreenVideoProducer(await producerTransport.produce(screenVideoParams))

        if(screenAudioTrack) {
            screenAudioParams = {
                track: screenAudioTrack,
                ...globalParams,
            }
            
            setScreenAudioProducer(await producerTransport.produce(screenAudioParams))
        }
    }

    const getScreenProjection = async() => {
        sharingMode = 'projection'
        
        let stream = await navigator.mediaDevices.getDisplayMedia(screenConstraints);
        setLocalProjectionStream(stream)
    
        let projectionVideoTrack = stream.getVideoTracks()[0]
        let projectionAudioTrack = stream.getAudioTracks()[0]
    
        projectionVideoParams = {
            track: projectionVideoTrack,
            ...globalParams,
        }
        setProjectionVideoProducer(await producerTransport.produce(projectionVideoParams))

        if(projectionAudioTrack) {
            projectionAudioParams = {
                track: projectionAudioTrack,
                ...globalParams,
            }
            setProjectionAudioProducer(await producerTransport.produce(projectionAudioParams))
        }
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

                    if(params.hasOwnProperty('cameraPaused')) {
                        Object.assign(tempConsumers[params.participantSocketId], {
                            cameraPaused: params.cameraPaused,
                        })
                        continue
                    }
                    if(params.hasOwnProperty('micPaused')) {
                        Object.assign(tempConsumers[params.participantSocketId], {
                            micPaused: params.micPaused,
                        })
                        continue
                    }
                    
                    let tempConsumer = await consumerTransport.consume({
                        id: params.id,
                        producerId: params.producerId,
                        kind: params.kind,
                        rtpParameters: params.rtpParameters
                    })
            
                    console.log('Consumer made:', tempConsumer)
            
                    if(streamType === 'projection') {
                        await socket.emit('consumer-resume', {
                            room: joinRoom,
                            producerType: params.producerType,
                            projection: true,
                        }, () => {
                            if(params.producerType === 'projectionVideoProducer')
                                setProjectionVideoConsumer(tempConsumer)

                            else if(params.producerType === 'projectionAudioProducer')
                                setProjectionAudioConsumer(tempConsumer)

                            setProjectingUsername(params.participantUsername)
    
                            if(i === consumerParams.length - 1)
                                resolve()
                        })
                    } else {
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
        if(projectionVidEl.current && localProjectionStream)
            projectionVidEl.current.srcObject = localProjectionStream

        if(projectionVidEl.current && projectionVideoConsumer) {
            let tempStream = new MediaStream()
            let { track: vidTrack } = projectionVideoConsumer
            tempStream.addTrack(vidTrack)

            // Because projection may not have audio
            if(projectionAudioConsumer) {
                let { track: audTrack } = projectionAudioConsumer
                tempStream.addTrack(audTrack)
            }

            projectionVidEl.current.srcObject = tempStream
        }

    }, [projectionVidEl, localProjectionStream, projectionVideoConsumer, projectionAudioConsumer])

    useEffect(() => {
        let totalParticipants = 1 + Object.keys(consumers).length

        switch(totalParticipants) {
            case 1:
                setGridHorizontalValue(0)
                setGridVerticalValue(100)
                break
            
            case 2:
                setGridHorizontalValue(6)
                setGridVerticalValue(100)
                break
            
            case 3:
                setGridHorizontalValue(6)
                setGridVerticalValue(50)
                break
        }

        if(totalParticipants >= 4) {
            setGridHorizontalValue(8)
            setGridVerticalValue(50)
        }
    }, [consumers])
    
    useEffect(() => {
        dispatch(setSocket(io(process.env.REACT_APP_BACKEND_URI)))
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
                if(streamType !== 'projection')
                    tempConsumers = { ...tempConsumers, ...consumersRef.current }

                await consumeParticipant(participantSocketId, streamType)

                if(streamType !== 'projection') {
                    setConsumers(currConsumers => {
                        let newConsumers = {
                            ...currConsumers,
                            ...tempConsumers,
                        }
                        consumersRef.current = newConsumers
                        return newConsumers
                    })

                    tempConsumers = {}
                }
            })

            socket.on('participant-disconnected', (disconnectedSocketId) => {
                logAlert(`${consumersRef.current[disconnectedSocketId].username} has left the session`, 'info')

                setConsumers(currConsumers => {
                    let newConsumers = { ...currConsumers }
                    delete newConsumers[disconnectedSocketId]

                    consumersRef.current = newConsumers
                    return newConsumers
                })
            })

            socket.on('participant-stopped-screenshare', ({ participantSocketId }) => {
                logAlert(`${consumersRef.current[participantSocketId].username} stopped sharing screen`, 'info')

                setConsumers(currConsumers => {
                    let newConsumers = { ...currConsumers }
                    delete newConsumers[participantSocketId].screenVideoProducer
                    delete newConsumers[participantSocketId].screenAudioProducer

                    consumersRef.current = newConsumers
                    return newConsumers
                })
            })

            socket.on('participant-camera-stopped', participantSocketId => {
                setConsumers(currConsumers => {
                    let newConsumers = { ...currConsumers }
                    newConsumers[participantSocketId].cameraPaused = true

                    consumersRef.current = newConsumers
                    return newConsumers
                })
            })

            socket.on('participant-camera-resumed', participantSocketId => {
                setConsumers(currConsumers => {
                    let newConsumers = { ...currConsumers }
                    newConsumers[participantSocketId].cameraPaused = false

                    consumersRef.current = newConsumers
                    return newConsumers
                })
            })

            socket.on('participant-mic-stopped', participantSocketId => {
                setConsumers(currConsumers => {
                    let newConsumers = { ...currConsumers }
                    newConsumers[participantSocketId].micPaused = true

                    consumersRef.current = newConsumers
                    return newConsumers
                })
            })

            socket.on('participant-mic-resumed', participantSocketId => {
                setConsumers(currConsumers => {
                    let newConsumers = { ...currConsumers }
                    newConsumers[participantSocketId].micPaused = false

                    consumersRef.current = newConsumers
                    return newConsumers
                })
            })

            socket.on('new-breakout-room', roomTabs => {
                props.setRoomTabs(roomTabs)
            })
            
            socket.on('existing-breakout-rooms', existingBreakoutRooms => {
                props.setRoomTabs(existingBreakoutRooms)
            })

            socket.on('projection-stopped', (projectingUsername) => {
                setLocalProjectionStream(null)
                setProjectionVideoProducer(null)
                setProjectionAudioProducer(null)
                setProjectionVideoConsumer(null)
                setProjectionAudioConsumer(null)

                logAlert(`${projectingUsername} has stopped projecting the screen`, 'info')
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

            // In case participant changed to breakout room and sharingMode is different
            sharingMode = 'self'

            socket.emit('create-or-join', joinRoom)
        }

        return () => {
            device = null
            producerTransport = null
            consumerTransport = null
        }
    }, [socket])

    // -----------------------
    // UI functions henceforth

    const handleSnackbarClose = (event, reason) => {
        if(reason === 'clickaway') return
        setSnackbarOpen(false)
    }

    const screenShareClick = () => {
        getScreenShare()
        setAnchorEl(null)
    }

    const projectShareClick = () => {
        socket.emit('can-project-screen', { room: joinRoom }, ({ projectionExists, projectingUser }) => {
            if(projectionExists) {
                logAlert(
                    projectingUser === username ? 'You are already projecting to this session' : `${projectingUser} is already projecting to this session`,
                    'error',
                )
            } else {
                getScreenProjection()
                setAnchorEl(null)
            }
        })
    }

    // Works for projection as well
    const stopSharingScreen = () => {
        if(window.confirm('Stop sharing screen?')) {
            if(localScreenShareStream) {
                localScreenShareStream.getTracks().forEach(track => track.stop())

                setLocalScreenShareStream(null)
                socket.emit('stopped-screenshare', { room: joinRoom })
            }

            if(localProjectionStream) {
                localProjectionStream.getTracks().forEach(track => track.stop())

                setLocalProjectionStream(null)
                socket.emit('stopped-projecting', { room: joinRoom })
            }
        }
    }

    const toggleSelfStream = (type) => {
        switch(type) {
            case 'camera':
                cameraVideoProducer.paused ? cameraVideoProducer.resume() : cameraVideoProducer.pause()
                setCameraPaused(cameraVideoProducer.paused)
                socket.emit('camera-toggle', {
                    room: joinRoom,
                    paused: cameraVideoProducer.paused,
                    resumed: !cameraVideoProducer.paused,
                })

                break

            case 'mic':
                micAudioProducer.paused ? micAudioProducer.resume() : micAudioProducer.pause()
                setMicPaused(micAudioProducer.paused)
                socket.emit('mic-toggle', {
                    room: joinRoom,
                    paused: micAudioProducer.paused,
                    resumed: !micAudioProducer.paused,
                })

                break
        }
    }

    return (
        <div className='w-full flex flex-col justify-center'>
            <div className={clsx('flex mx-5 my-3', classes.participantsContainer)}>
                {(Boolean(localProjectionStream) || projectionVideoConsumer) && (
                    <div className='flex flex-col justify-center items-center pr-2' style={{ flex: 1 }}>
                        <video
                            autoPlay
                            ref={projectionVidEl}
                            className={clsx('w-full', classes.projectionVideoStyle)}
                            muted={Boolean(localProjectionStream)}
                        />
                        <Typography className='text-center my-3' variant='h6'>
                            { Boolean(localProjectionStream) ? username : projectingUsername } is projecting a screen
                        </Typography>
                    </div>
                )}
                <Grid container spacing={3} style={{ flex: 1 }} className='pl-2'>
                    <Grid item xs={12 - gridHorizontalValue} className={classes.participantWindow} style={{ height: `${gridVerticalValue}%` }}>
                        <ParticipantWindow 
                            id='local'
                            username={username}
                            selfStream={localStream}
                            screenStream={localScreenShareStream}
                            cameraPaused={cameraPaused}
                            micPaused={micPaused}
                            isMuted={true}
                        />
                    </Grid>
                    {Object.values(consumers).map(consumer => {
                        console.log('Total consumers', consumers)
                        return (
                            <Grid item xs={12 - gridHorizontalValue} key={consumer} className={classes.participantWindow} style={{ height: `${gridVerticalValue}%` }}>
                                <ParticipantWindow
                                    username={consumer.username}
                                    consumers={{
                                        cameraVideoConsumer: consumer.cameraVideoProducer,
                                        micAudioConsumer: consumer.micAudioProducer,
                                        screenVideoConsumer: consumer.screenVideoProducer,
                                        screenAudioConsumer: consumer.screenAudioProducer,
                                    }}
                                    cameraPaused={consumer.cameraPaused}
                                    micPaused={consumer.micPaused}
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
                        title={cameraPaused ? 'Resume camera' : 'Pause camera'}
                        className={clsx('mr-1', cameraPaused ? classes.controlIcon : classes.controlIconStop)}
                        onClick={() => toggleSelfStream('camera')}
                    >
                        <VideocamIcon htmlColor='#3C3C3C' />
                    </IconButton>
                    <IconButton
                        color='primary'
                        title={micPaused ? 'Resume microphone' : 'Pause microphone'}
                        className={clsx('mx-1', micPaused ? classes.controlIcon : classes.controlIconStop)}
                        onClick={() => toggleSelfStream('mic')}
                    >
                        <MicIcon htmlColor='#3C3C3C' />
                    </IconButton>
                    <IconButton
                        color='primary'
                        title='Share or project a screen'
                        className={clsx('mx-1', (localScreenShareStream || localProjectionStream) ? classes.controlIconStop : classes.controlIcon)}
                        onClick={(event) => (localScreenShareStream || localProjectionStream) ? stopSharingScreen() : setAnchorEl(event.currentTarget)}
                    >
                        <ScreenShareIcon htmlColor='#3C3C3C' />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                        <CustomTooltip arrow enterDelay={1000} placement='right' title='Share screen only inside your user component'>
                            <MenuItem onClick={() => screenShareClick()}>
                                <ListItemIcon>
                                    <ScreenShareIcon fontSize='small'/>
                                </ListItemIcon>
                                Share Screen
                            </MenuItem>
                        </CustomTooltip>
                        <CustomTooltip arrow enterDelay={1000} placement='right' title='Project screen to the whole session'>
                            <MenuItem onClick={() => projectShareClick()}>
                                <ListItemIcon>
                                    <ProjectScreenIcon fontSize='small'/>
                                </ListItemIcon>
                                Project Screen
                            </MenuItem>
                        </CustomTooltip>
                    </Menu>
                    <IconButton
                        color='primary'
                        title='Choose grid items numbering'
                        className={clsx('ml-1', classes.controlIcon)}
                        onClick={(event) => {
                            setGridAnchorEl(event.currentTarget)
                            setGridAnchorElOpen(true)
                        }}
                    >
                        <GridViewIcon htmlColor='#3C3C3C'/>
                    </IconButton>
                    <Popover
                        open={gridAnchorElOpen}
                        onClose={() => {
                            setGridAnchorEl(null)
                            setGridAnchorElOpen(false)
                        }}
                        anchorEl={gridAnchorEl}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                        transformOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                    >
                        <div className='p-2' style={{ width: 200 }}>
                            <Slider
                                aria-label="grid value"
                                defaultValue={gridHorizontalValue}
                                step={1}
                                marks
                                min={0}
                                max={11}
                                onChange={(event, val) => {
                                    setGridHorizontalValue(val)
                                    let vertVal = 100 - ((val/11) * 100)
                                    setGridVerticalValue(vertVal)
                                }}
                            />
                        </div>
                    </Popover>
                </div>
            </div>
            
            {/* For user alerts */}
            <Snackbar
                open={snackbarOpen}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                autoHideDuration={3000}
                onClose={handleSnackbarClose}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarInfo.severity} variant='filled'>
                    { snackbarInfo.message }
                </Alert>
            </Snackbar>
        </div>
    )
}


export default SessionScreen
