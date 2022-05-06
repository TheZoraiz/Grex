import React, { useEffect, useState } from 'react'
import {
    Typography,
    TextField,
    InputAdornment,
    IconButton,
    Button,
    Link as MuiLink,
    Snackbar,
    Alert,
    CircularProgress as CircularProgressIcon,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Send as SendIcon,
} from '@mui/icons-material'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useSelector, useDispatch } from 'react-redux'
import { loginUser, nullifyError } from './userSlice'
import { nullifyAuthError } from '../globalSlice'

import grex_login_image from '../../assets/images/grex_login_image.png'

const useStyles = makeStyles(theme => ({
    loginImage: {
        borderRadius: 15,
        backgroundColor: theme.palette.background.darker,
    },
}))

const Login = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const classes = useStyles()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    
    const [loading, setLoading] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false)
    const [snackbarError, setSnackbarError] = useState(null)

    const { userData, error } = useSelector(state => state.user)
    const { tokenVerifiedMsg, error: authError } = useSelector(state => state.global)

    useEffect(() => {

        if(authError) {
            setOpenSnackbar(true)
            setSnackbarError({
                msg: authError.data,
                severity: 'error'
            })
            dispatch(nullifyAuthError())
            setLoading(false)
            return
        }

        if(error) {
            console.log(error)
            setOpenSnackbar(true)
            setSnackbarError({
                msg: error.data,
                severity: 'error'
            })
            setLoading(false)
            return
        }

        if(userData || tokenVerifiedMsg) {
            setOpenSnackbar(true)
            setSnackbarError({
                msg: userData?.serverMsg || tokenVerifiedMsg,
                severity: 'success'
            })
            setLoading(false)
            navigate('/dashboard')
            return
        }
    }, [userData, error, authError, tokenVerifiedMsg])

    const loginSubmitHandler = () => {
        if(email === '' || password === '') {
            setOpenSnackbar(true)
            setSnackbarError({
                msg: 'Please enter your email and password',
                severity: 'error'
            })
            return
        }

        dispatch(loginUser({
            email,
            password,
        }))
        setLoading(true)
    }

    const handleSnackbarClose = () => {
        setOpenSnackbar(false)
        setSnackbarError(null)
        dispatch(nullifyError())
    }

    return (
        <div className='px-2 w-full flex flex-col md:flex-row justify-center items-center' style={{ height: '100vh' }}>
            <div className='m-2 w-full md:w-6/12 flex flex-col items-center'>
                <Typography className='w-8/12 mb-2' variant='h3'>
                    Sign in
                </Typography>
                <Typography className='w-8/12 mb-10'>
                    Don't have an account?
                    <MuiLink component='div'>
                        <Link to='/register' >Register Here!</Link>
                    </MuiLink>
                </Typography>

                <TextField
                    className='mb-5 w-8/12'
                    variant='outlined'
                    label='Enter your email'
                    onChange={(event) => setEmail(event.target.value)}
                />
                <TextField
                    className='mb-5 w-8/12'
                    variant='outlined'
                    label='Enter your password'
                    type={showPassword ? 'text' : 'password'}
                    onChange={(event) => setPassword(event.target.value)}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end" className='mr-0.5'>
                                <IconButton
                                    aria-label="toggle password visibility"
                                    onClick={() => setShowPassword(!showPassword)}
                                    onMouseDown={(event) => event.preventDefault()}
                                    edge="end"
                                >
                                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                            </InputAdornment>
                        )
                    }}
                />

                <MuiLink component='div' className='w-8/12 text-right'>
                    <Link to='/forgot-password' >Forgot Password?</Link>
                </MuiLink>

                <div className='w-8/12'>
                    <Button
                        className='normal-case font-bold'
                        variant='contained'
                        onClick={loginSubmitHandler}
                        startIcon={
                            loading
                            ? <CircularProgressIcon size={25} sx={{ color: (theme) => theme.palette.background.dark }} />
                            : <SendIcon />
                        }
                    >
                        Submit
                    </Button>
                </div>
            </div>
            <div className={clsx('m-2 w-full md:w-6/12 flex justify-center items-center', classes.loginImage)}>
                <img src={grex_login_image} className='h-full m-2' />
            </div>

            {/* To show errors */}
            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbarError ? snackbarError.severity : 'warning'}
                    variant='filled'
                    sx={{ width: '100%' }}
                >
                    { snackbarError ? snackbarError.msg: 'An error occured' }
                </Alert>
            </Snackbar>
        </div>
    )
}

export default Login