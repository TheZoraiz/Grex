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
import validator from 'validator'
import clsx from 'clsx'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { registerUser, nullifyError } from '../slices/userSlice'

import grex_login_image from '../../assets/images/grex_login_image.png'

const useStyles = makeStyles(theme => ({
    loginImage: {
        borderRadius: 15,
        backgroundColor: theme.palette.background.darker,
    },
}))

const Register = () => {
    const navigate = useNavigate()
    const classes = useStyles()
    const dispatch = useDispatch()

    const [username, setUsername] = useState('Zoraiz')
    const [email, setEmail] = useState('hzoraiz2@gmail.com')
    const [password, setPassword] = useState('abcd')
    const [retypedPassword, setRetypedPassword] = useState('abcd')
    const [showPassword, setShowPassword] = useState(false)

    const { registrationMsg, error } = useSelector(state => state.user)

    useEffect(() => {
        if(error) {
            toast.update(
                'registration',
                { render: error.data, type: 'error', isLoading: false, autoClose: 5000, draggable: true, closeOnClick: true }
            )
            dispatch(nullifyError())
        }

        if(registrationMsg) {
            toast.update(
                'registration',
                { render: registrationMsg, type: 'success', isLoading: false, autoClose: 5000, draggable: true, closeOnClick: true }
            )
            dispatch(nullifyError())
            setTimeout(() => navigate('/login'), 3000)
        }
    }, [registrationMsg, error])

    const validationErrorMsg = () => {
        if(username === '' || email === '' || password === '' || retypedPassword === '')
            return 'Some fields are missing'

        if(password !== retypedPassword)
            return 'Passwords don\'t match'

        if(!validator.isEmail(email))
            return 'Email isn\'t valid'

        return ''
    }

    const registrationSubmitHandler = () => {
        let errorMsg = validationErrorMsg()

        if(errorMsg !== '') {
            toast.error(errorMsg)
            return
        }

        dispatch(registerUser({
            username,
            email,
            password,
            retypedPassword,
        }))
        toast.loading('Registering user...', { toastId: 'registration' })
    }

    return (
        <div className='px-2 w-full flex flex-col md:flex-row justify-center items-center' style={{ height: '100vh' }}>
            <div className='m-2 w-full md:w-6/12 flex flex-col items-center'>
                <Typography className='w-8/12 mb-2' variant='h3'>
                    Registration
                </Typography>
                <Typography className='w-8/12 mb-10'>
                    Already have an account?
                    <MuiLink component='div'>
                        <Link to='/login' >Login!</Link>
                    </MuiLink>
                </Typography>

                <TextField
                    className='mb-5 w-8/12'
                    variant='outlined'
                    label='Enter your username'
                    type='text'
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                />
                <TextField
                    className='mb-5 w-8/12'
                    variant='outlined'
                    label='Enter your email'
                    type='email'
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
                <TextField
                    className='mb-5 w-8/12'
                    variant='outlined'
                    label='Re-enter your password'
                    type={showPassword ? 'text' : 'password'}
                    value={retypedPassword}
                    onChange={(event) => setRetypedPassword(event.target.value)}
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

                <div className='w-8/12'>
                    <Button
                        className='normal-case font-bold'
                        variant='contained'
                        onClick={registrationSubmitHandler}
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

export default Register