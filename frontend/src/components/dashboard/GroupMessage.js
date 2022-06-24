import React from 'react'
import {
    Typography,
    Avatar,
    Divider,
} from '@mui/material'

const GroupMessage = (props) => {

    return (
        <>
            <div className='w-full my-2 flex'>
                <Avatar
                    className='mr-2'
                    src={props.senderPic}
                />
                <div>
                    <Typography variant='body1' className='font-bold mb-2 mt-1'>
                        { props.senderName }
                        &nbsp;&nbsp;
                        <Typography variant='caption' className='font-italic'>
                            at { props.messageTime }
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