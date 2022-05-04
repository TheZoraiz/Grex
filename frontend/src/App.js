import './App.css'
import { useState } from 'react'
import Credentials from './screens/credentials/Credentials'
import VideoConference from './screens/video-conference/VideoConference'
import Login from './screens/login-and-registration/Login'
import {
	BrowserRouter,
	Routes,
	Route,
	Navigate,
} from 'react-router-dom'
import {
	ThemeProvider,
	createTheme,
} from '@mui/material'

const theme = createTheme({
	palette: {
		mode: 'dark',
	},
	typography: {
		allVariants: {
			color: '#FEFEFE',
		}
	}
})

const App = () => {
	return (
		<ThemeProvider theme={theme}>
			<BrowserRouter>
				<Routes>
					<Route path='/' element={<Navigate to='/login' replace />} />
					<Route path='/login' element={<Login />} />
					<Route path='/credentials' element={<Credentials />} />
					<Route path='/conference' element={<VideoConference />} />
				</Routes>
			</BrowserRouter>
		</ThemeProvider>
	);
}

export default App;
