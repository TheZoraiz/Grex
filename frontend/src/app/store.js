import { configureStore } from '@reduxjs/toolkit'
import userReducer from '../screens/login-and-registration/userSlice'
import sessionReducer from '../screens/video-conference/sessionSlice'

export default configureStore({
    reducer: {
        user: userReducer,
        session: sessionReducer,
    },
})