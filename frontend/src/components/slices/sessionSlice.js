import { createSlice } from '@reduxjs/toolkit'

export const sessionSlice = createSlice({
    name: 'session',
    initialState: {
        socket: null,
        sessionInfo: null,
    },
    reducers: {
        setSocket: (state, action) => {
            state.socket = action.payload
        },
        setSessionInfo: (state, action) => {
            state.sessionInfo = action.payload
        },
    },
})

// Action creators are generated for each case reducer function
export const { setSocket, setSessionInfo } = sessionSlice.actions

export default sessionSlice.reducer