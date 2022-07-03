import React from 'react'
import {
    Typography,
    Avatar,
    Divider,
} from '@mui/material'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'

dayjs.extend(advancedFormat)

const GroupMessage = (props) => {
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
                        &nbsp;
                        <Typography variant='caption' className='font-italic'>
                            at { dayjs(props.messageTime).format('hh:mma - Do MMM, YYYY') }
                        </Typography>
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

export default GroupMessage
