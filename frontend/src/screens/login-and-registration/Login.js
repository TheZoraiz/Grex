import React, { useEffect, useState } from 'react'
import {
    Typography,
    TextField,
    InputAdornment,
    IconButton,
    Button,
    Link as MuiLink,
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
import { toast } from 'react-toastify'
import { loginUser, nullifyError as nullifyLoginError } from '../slices/userSlice'
import { nullifyAuthError, setUserData } from '../globalSlice'

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

    const [email, setEmail] = useState('hzoraiz2@gmail.com')
    const [password, setPassword] = useState('abcd')
    const [showPassword, setShowPassword] = useState(false)

    const { loginServerMsg, userData, error: loginError } = useSelector(state => state.user)
    const { tokenVerifiedMsg, error: authError } = useSelector(state => state.global)

    useEffect(() => {
        console.log('loginServerMsg, tokenVerifiedMsg, authError, loginError:', loginServerMsg, tokenVerifiedMsg, authError, loginError)
    }, [loginServerMsg, tokenVerifiedMsg, authError, loginError])

    useEffect(() => {

        if(authError) {
            toast.error(authError.data)
            dispatch(nullifyAuthError())
            return
        }

        if(loginError) {
            console.log(loginError)
            toast.update(
                'login',
                { render: loginError.data, type: 'error', isLoading: false, autoClose: 5000, draggable: true, closeOnClick: true }
            )
            dispatch(nullifyLoginError())
            return
        }

        if(loginServerMsg || tokenVerifiedMsg) {
            if(loginServerMsg) {
                toast.update(
                    'login',
                    { render: loginServerMsg, type: 'success', isLoading: false, autoClose: 5000, draggable: true, closeOnClick: true }
                )
                dispatch(setUserData(userData))
            }

            navigate('/dashboard')
            return
        }
    }, [loginServerMsg, loginError, authError, tokenVerifiedMsg])

    const loginSubmitHandler = () => {
        if(email === '' || password === '') {
            toast.error('Please enter your email and password')
            return
        }

        dispatch(loginUser({
            email,
            password,
        }))
        toast.loading('Logging in...', { toastId: 'login' })
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
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
                <TextField
                    className='mb-5 w-8/12'
                    variant='outlined'
                    label='Enter your password'
                    type={showPassword ? 'text' : 'password'}
                    value={password}
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
                        startIcon={<SendIcon />}
                    >
                        Submit
                    </Button>
                </div>
            </div>
            <div className={clsx('m-2 w-full md:w-6/12 flex justify-center items-center', classes.loginImage)}>
                <img src={grex_login_image} className='h-full m-2' />
            </div>
        </div>
    )
}

export default Login