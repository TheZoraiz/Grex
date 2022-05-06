import React, { useEffect } from 'react'
import {
    Typography
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

const Dashboard = () => {
    const dispatch = useDispatch()

    const { serverMsg, userData, error: authError } = useSelector(state => state.global)

    if(authError)
        return (<Navigate to='/' />)

    return (
        <>
            <Typography>Dashboard</Typography>
            <pre style={{color: 'white'}}>
                { JSON.stringify(userData, null, 2) }
            </pre>
        </>
    )
}

export default Dashboard