import React from 'react'
import {
    Typography,
    IconButton,
    Avatar,
} from '@mui/material'
import {
    AccountCircle as AccountCircleIcon,
} from '@mui/icons-material'
import { useSelector } from 'react-redux'

const Navbar = () => {
    const { userData } = useSelector(state => state.global)

    return (
        <div className='w-full h-16 px-5 flex items-center justify-between'>
            {/* Left portion */}
            <div>
                <Typography variant='h4' className='font-bold'>
                    Grex
                </Typography>
            </div>

            {/* Right portion */}
            <div>
                <IconButton title='View Profile'>
                    <Avatar src={userData.profilePic ? userData.profilePic : ''} />
                </IconButton>
            </div>
        </div>
    )
}

export default Navbar