import React, { useEffect } from 'react'
import {
    Typography
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

import Navbar from '../shared-components/Navbar'

const Dashboard = () => {
    const dispatch = useDispatch()

    const { serverMsg, userData, error: authError } = useSelector(state => state.global)

    if(authError)
        return (<Navigate to='/' />)

    return (
        <div>
            <Navbar />

            <pre style={{ color: 'white' }}>
                { JSON.stringify(userData, null, 2) }
            </pre>
        </div>
    )
}

export default Dashboard