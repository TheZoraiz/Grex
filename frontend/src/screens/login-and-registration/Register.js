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
    useTheme,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    Send as SendIcon,
} from '@mui/icons-material'
import { Link } from 'react-router-dom'
import validator from 'validator'
import clsx from 'clsx'
import { useSelector, useDispatch } from 'react-redux'
import { registerUser, nullifyError } from './userSlice'

import grex_login_image from '../../assets/images/grex_login_image.png'

const useStyles = makeStyles(theme => ({
    loginImage: {
        borderRadius: 15,
        backgroundColor: theme.palette.background.darker,
    },
}))

const Register = () => {
    const theme = useTheme()
    const classes = useStyles()
    const dispatch = useDispatch()

    const [username, setUsername] = useState('Zoraiz')
    const [email, setEmail] = useState('hzoraiz2@gmail.com')
    const [password, setPassword] = useState('dilwale')
    const [retypedPassword, setRetypedPassword] = useState('dilwale')
    const [showPassword, setShowPassword] = useState(false)

    const [loading, setLoading] = useState(false)

    const [validationError, setValidationError] = useState(null)
    const [openSnackbar, setOpenSnackbar] = useState(false)

    const { userData, error } = useSelector(state => state.user)

    useEffect(() => {
        console.log(userData, error)
        if(error) {
            setOpenSnackbar(true)
            setValidationError({
                msg: error.data,
                severity: 'error'
            })
            dispatch(nullifyError())
            setLoading(false)
        }

        if(userData) {
            setOpenSnackbar(true)
            setValidationError({
                msg: userData,
                severity: 'success'
            })
            dispatch(nullifyError())
            setLoading(false)
        }
    }, [userData, error])

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
            setValidationError({
                msg: errorMsg,
                severity: 'error'
            })
            setOpenSnackbar(true)
            return
        }

        dispatch(registerUser({
            username,
            email,
            password,
            retypedPassword,
        }))
        setLoading(true)
    }

    const handleSnackbarClose = () => {
        setOpenSnackbar(false)
        setValidationError(null)
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
                open={openSnackbar && validationError}
                autoHideDuration={3000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={validationError ? validationError.severity : 'warning'}
                    variant='filled'
                    sx={{ width: '100%' }}
                >
                    { validationError ? validationError.msg: 'An error occured' }
                </Alert>
            </Snackbar>
        </div>
    )
}

export default Register