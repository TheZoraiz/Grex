import React, { useState } from 'react'
import {
    Typography,
    TextField,
    Button,
} from '@mui/material';
import { makeStyles } from '@mui/styles'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setUsername, setRoomName } from '../slices/credentialsSlice'

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    }
}))

const Credentials = (props) => {
    const navigate = useNavigate();
    const dispatch = useDispatch()
	const classes = useStyles()

    return (
        <div className={classes.root}>
            <Typography variant='h4'>
                Enter your name and room
            </Typography>
            <br />

            <TextField
                label='Name'
                variant='outlined'
                onChange={(e) => dispatch(setUsername(e.target.value))}
            />
            <br />

            <TextField
                label='Room'
                variant='outlined'
                onChange={(e) => dispatch(setRoomName(e.target.value))}
            />
            <br />

            <Button
                variant='contained'
                color='primary'
                onClick={() => navigate('/conference')}
            >
                Submit
            </Button>
        </div>
    )
}

export default Credentials;
