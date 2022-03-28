import React, { useEffect, useState, useRef } from 'react'
import { Grid, Typography } from '@mui/material'
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
    buttomPane: {
        backgroundColor: 'black',
        height: '20%',
    },
}))

const ParticipantWindow = (props) => {
    const classes = useStyles()

	const partSelfVidEl = useRef(null);
	const partScreenVidEl = useRef(null);

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
        if(partSelfVidEl && selfStream)
            partSelfVidEl.current.srcObject = selfStream
            
        if(partScreenVidEl && screenStream)
            partScreenVidEl.current.srcObject = screenStream
        
    }, [partSelfVidEl, partScreenVidEl, selfStream, screenStream])

    return (
        <Grid container className={classes.participantContainer}>
            {selfStream && (
                <Grid item xs={screenStream ? 6 : 12} className='flex justify-center items-center' style={{ height: '80%' }}>
                    <video
                        id={props.id}
                        autoPlay
                        ref={partSelfVidEl}
                        className={clsx('h-full', classes.videoFlip)}
                        muted={props.isMuted}
                    />
                </Grid>
            )}
            {screenStream && (
                <Grid item xs={selfStream ? 6 : 12} className='flex justify-center items-center' style={{ height: '80%' }}>
                    <video
                        autoPlay
                        ref={partScreenVidEl}
                        muted={props.isMuted}
                        className='h-full'
                    />
                </Grid>
            )}
            <div className={clsx('w-full p-3', classes.buttomPane)}>
                <Typography>
                    { props.username }
                </Typography>
            </div>
        </Grid>
    )
}

export default ParticipantWindow