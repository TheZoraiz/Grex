import { configureStore } from '@reduxjs/toolkit'
import userReducer from './components/slices/userSlice'
import sessionReducer from './components/slices/sessionSlice'
import credentialsReducer from './components/slices/credentialsSlice'
import groupReducer from './components/slices/groupSlice'
import formsReducer from './components/slices/formsSlice'
import dashboardReducer from './components/slices/dashboardSlice'
import globalReducer from './components/globalSlice'

export default configureStore({
    reducer: {
        user: userReducer,
        session: sessionReducer,
        credentials: credentialsReducer,
        groups: groupReducer,
        forms: formsReducer,
        dashboard: dashboardReducer,
        global: globalReducer,
    },
})