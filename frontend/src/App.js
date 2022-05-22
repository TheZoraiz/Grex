import './App.css'
import { useEffect, useState } from 'react'
import Credentials from './screens/credentials/Credentials'
import VideoConference from './screens/video-conference/VideoConference'
import Login from './screens/login-and-registration/Login'
import Register from './screens/login-and-registration/Register'
import ForgotPassword from './screens/login-and-registration/ForgotPassword'
import Dashboard from './screens/dashboard/Dashboard'
import {
	BrowserRouter,
	Routes,
	Route,
	Navigate,
} from 'react-router-dom'
import {
	ThemeProvider,
	createTheme,
	CircularProgress,
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { verifyToken } from './screens/globalSlice'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const theme = createTheme({
	palette: {
		mode: 'dark',
		background: {
			dark: '#282c34',
			darker: '#1d2026',
		}
	},
	typography: {
		allVariants: {
			color: '#FEFEFE',
		}
	}
})

const App = () => {
    const dispatch = useDispatch()

    const [loading, setLoading] = useState(true)

	const { tokenVerifiedMsg, error } = useSelector(state => state.global)

	useEffect(() => {
		if(tokenVerifiedMsg || error)
			setLoading(false)

	}, [tokenVerifiedMsg, error])

	useEffect(() => {
		dispatch(verifyToken())
	}, [])

	if(loading)
		return (
            <CircularProgress
                className='absolute top-1/2 left-1/2'
                size={50}
                style={{ marginLeft: -25, marginTop: -25 }}
            />
		)

	return (
		<ThemeProvider theme={theme}>
			<BrowserRouter>
				<Routes>
					<Route path='/' element={<Navigate to='/login' replace />} />
					<Route path='/login' element={<Login />} />
					<Route path='/register' element={<Register />} />
					<Route path='/forgot-password' element={<ForgotPassword />} />
					<Route path='/dashboard' element={<Dashboard />} />
					<Route path='/credentials' element={<Credentials />} />
					<Route path='/conference' element={<VideoConference />} />
				</Routes>
			</BrowserRouter>

            {/* For notifications */}
            <ToastContainer
                hideProgressBar
                theme='colored'
                position='top-center'
				className='w-full md:w-4/12'
            />
		</ThemeProvider>
	);
}

export default App;
