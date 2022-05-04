import React, { useState } from 'react'
import {
    Typography,
    TextField,
    InputAdornment,
    IconButton,
    Button,
} from '@mui/material'
import {
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className='px-2 w-full flex flex-col justify-center items-center' style={{ height: '100vh' }}>
            <Typography className='w-full text-center mb-5' variant='h5'>
                Grex Login
            </Typography>
            <div className='w-full md:w-8/12 flex flex-col md:flex-row'>
                <div className='m-1 w-full md:w-6/12 flex flex-col items-end'>
                    <TextField
                        fullWidth
                        className='mb-5'
                        variant='outlined'
                        label='Enter your email'
                        onChange={(event) => setEmail(event.target.value)}
                    />
                    <TextField
                        fullWidth
                        className='mb-5'
                        variant='outlined'
                        label='Enter your password'
                        type={showPassword ? 'text' : 'password'}
                        onChange={(event) => setPassword(event.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
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
                </div>
                <div className='m-1 w-full md:w-6/12'>
                    Picture
                </div>

            </div>
            <div className='w-full md:w-8/12'>
                <Button className='normal-case font-bold' variant='contained'>
                    Submit
                </Button>
            </div>

        </div>
    )
}

export default Login