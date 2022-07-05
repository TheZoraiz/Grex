import React from 'react'
import {
    Typography,
    Avatar,
    Divider,
} from '@mui/material'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'

dayjs.extend(advancedFormat)

const SessionMessage = (props) => {
    return (
        <>
            <div className='w-full my-2 flex'>
                <Avatar
                    className='mr-2'
                    src={process.env.REACT_APP_BACKEND_URI + '/' + props.senderPic}
                />
                <div>
                    <Typography variant='body1' className='font-bold mb-2 mt-1'>
                        { props.senderName }
                    </Typography>
                    <Typography variant='body1' style={{ whiteSpace: 'pre-wrap' }}>
                        { props.message }
                    </Typography>
                </div>
            </div>
            <Divider />
        </>
    )
}

export default SessionMessage
