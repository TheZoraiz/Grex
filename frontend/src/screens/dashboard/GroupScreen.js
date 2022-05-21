import React, { useState, useEffect } from 'react'
import {
    Typography,
    Tabs,
    Tab,
    Box,
    Button,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

const GroupScreen = (props) => {
    const navigate = useNavigate()

    return (
        <div>
            <Button
                variant='contained'
                className='normal-case'
                onClick={() => navigate('/credentials')}
            >
                Navigate to Demo
            </Button>
            <pre>
                {JSON.stringify(props.group, null, 2)}
            </pre>
        </div>
    )
}

export default GroupScreen