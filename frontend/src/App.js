import './App.css'
import { useState } from 'react'
import Credentials from './screens/credentials/Credentials'
import VideoConference from './screens/video-conference/VideoConference'
import {
	BrowserRouter,
	Routes,
	Route,
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
					<Route path='/' element={<Credentials />} />
					<Route path='/conference' element={<VideoConference />} />
				</Routes>
			</BrowserRouter>
		</ThemeProvider>
	);
}

export default App;
