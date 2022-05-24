import React, { useEffect, useState, useRef } from 'react'
import { Grid, Typography, Avatar } from '@mui/material'
import { makeStyles } from '@mui/styles'
import clsx from 'clsx'

const useStyles = makeStyles(theme => ({
    participantContainer: {
        backgroundColor: '#1e1e28',
        overflow: 'hidden',
        borderRadius: 10,
        height: '100%',
    },
    videoFlip: {
        transform: 'scaleX(-1)',
    },
    participantAvatar: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: 50,
        height: 50,
        marginLeft: -25,
        marginTop: -25,
    },
}))

const ParticipantWindow = (props) => {
    const classes = useStyles()

	const partSelfVidEl = useRef(null);
	const partScreenVidEl = useRef(null);
	const selfMicAudioEl = useRef(null);

    const [selfStream, setSelfStream] = useState(null)
    const [screenStream, setScreenStream] = useState(null)

    useEffect(() => {
        if(props.consumers) {
            let tempSelfStream = null
            let tempScreenStream = null

            Object.keys(props.consumers).forEach(consumerName => {
                if(!props.consumers[consumerName])
                    return

                let { track } = props.consumers[consumerName]

                switch(consumerName) {
                    case 'cameraVideoConsumer':
                    case 'micAudioConsumer':
                        if(!tempSelfStream) tempSelfStream = new MediaStream()
                        tempSelfStream.addTrack(track)
                        break

                    case 'screenVideoConsumer':
                    case 'screenAudioConsumer':
                        if(!tempScreenStream) tempScreenStream = new MediaStream()
                        tempScreenStream.addTrack(track)
                        break
                }
            })

            setSelfStream(tempSelfStream)
            setScreenStream(tempScreenStream)
        }
        
        if(props.id === 'local') {
            setSelfStream(props.selfStream)
            setScreenStream(props.screenStream)
        }

    }, [props.consumers, props.selfStream, props.screenStream])

    useEffect(() => {
        if(props.cameraPaused) {
            if(selfMicAudioEl.current && selfStream) {
                selfMicAudioEl.current.srcObject = selfStream
                partSelfVidEl.current.srcObject = null
            }

        } else {
            if(partSelfVidEl.current && selfStream) {
                partSelfVidEl.current.srcObject = selfStream
                selfMicAudioEl.current.srcObject = null
            }
        }
        
        if(partScreenVidEl.current && screenStream)
            partScreenVidEl.current.srcObject = screenStream

        
    }, [partSelfVidEl, partScreenVidEl, selfMicAudioEl, selfStream, screenStream])

    return (
        <Grid container className={clsx('relative', classes.participantContainer)}>
            {props.cameraPaused && !screenStream && (
                <Avatar
                    className={classes.participantAvatar}
                    src={props.participantPic}
                />
            )}
            {selfStream &&  (
                <>
                    <audio ref={selfMicAudioEl} style={{ display: 'none' }} autoPlay />
                    <Grid
                        item
                        xs={screenStream ? 6 : 12}
                        className={'h-full flex justify-center items-center ' + (props.cameraPaused ? 'hidden' : 'block')}
                    >
                        <video
                            id={props.id}
                            autoPlay
                            ref={partSelfVidEl}
                            className={clsx('h-full', classes.videoFlip)}
                            muted={props.isMuted}
                        />
                    </Grid>
                </>
            )}
            {screenStream && (
                <Grid item xs={props.cameraPaused ? 12 : 6} className='h-full flex justify-center items-center'>
                    <video
                        autoPlay
                        ref={partScreenVidEl}
                        muted={props.isMuted}
                        className='h-full'
                    />
                </Grid>
            )}
            <div className='w-full p-3 absolute bottom-0 left-0'>
                <Typography style={{ textShadow: '0 0 10px black' }}>
                    { props.username }
                </Typography>
            </div>
        </Grid>
    )
}

export default ParticipantWindow