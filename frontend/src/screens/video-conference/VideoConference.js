import React from 'react'
import {
    Typography
} from '@mui/material'
import { useSelector } from 'react-redux';

const VideoConference = (props) => {
    const { username, joinRoom } = useSelector(state => {
        console.log('state', state)
        return state.user
    })
    console.log('username', username)
    console.log('joinRoom', joinRoom)

    return (
        <div className='w-full flex justify-center'>
            <Typography>
                { username }
            </Typography>
            <br />

            <Typography>
                { joinRoom }
            </Typography>
        </div>
    )
}


export default VideoConference