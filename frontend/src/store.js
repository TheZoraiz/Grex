import { configureStore } from '@reduxjs/toolkit'
import userReducer from './screens/slices/userSlice'
import sessionReducer from './screens/slices/sessionSlice'
import credentialsReducer from './screens/slices/credentialsSlice'
import groupReducer from './screens/slices/groupSlice'
import globalReducer from './screens/globalSlice'

export default configureStore({
    reducer: {
        user: userReducer,
        session: sessionReducer,
        credentials: credentialsReducer,
        groups: groupReducer,
        global: globalReducer,
    },
})