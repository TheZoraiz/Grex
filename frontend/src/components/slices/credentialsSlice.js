import { createSlice } from '@reduxjs/toolkit'

export const credentialsSlice = createSlice({
    name: 'credentials',
    initialState: {
        username: null,
        roomName: '',
    },
    reducers: {
        setUsername: (state, action) => {
            state.username = action.payload
        },
        setRoomName: (state, action) => {
            state.roomName = action.roomName
        },
    },
})

// Action creators are generated for each case reducer function
export const { setUsername, setRoomName } = credentialsSlice.actions

export default credentialsSlice.reducer