import { createSlice } from '@reduxjs/toolkit'

export const userSlice = createSlice({
    name: 'user',
    initialState: {
        username: '',
        joinRoom: '',
    },
    reducers: {
        setUsername: (state, action) => {
            state.username = action.payload
        },
        setJoinRoom: (state, action) => {
            state.joinRoom = action.payload
        },
    },
})

// Action creators are generated for each case reducer function
export const { setUsername, setJoinRoom } = userSlice.actions

export default userSlice.reducer