import { configureStore } from '@reduxjs/toolkit'
import userReducer from '../screens/credentials/userSlice'

export default configureStore({
    reducer: {
        user: userReducer,
    },
})