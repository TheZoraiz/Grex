import { createSlice } from '@reduxjs/toolkit'

export const sessionSlice = createSlice({
    name: 'session',
    initialState: {
        socket: null,
    },
    reducers: {
        setSocket: (state, action) => {
            state.socket = action.payload
        },
    },
})

// Action creators are generated for each case reducer function
export const { setSocket } = sessionSlice.actions

export default sessionSlice.reducer