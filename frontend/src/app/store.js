import { configureStore } from '@reduxjs/toolkit'
import userReducer from '../screens/login-and-registration/userSlice'
import sessionReducer from '../screens/video-conference/sessionSlice'
import globalSlice from '../screens/globalSlice'

export default configureStore({
    reducer: {
        user: userReducer,
        session: sessionReducer,
        global: globalSlice,
    },
})