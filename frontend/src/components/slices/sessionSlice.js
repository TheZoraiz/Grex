import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { toast } from 'react-toastify'
import axios from 'axios'

export const getSessionAttendances = createAsyncThunk(
    'session/getSessionAttendances',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/api/get-session-attendances?groupId=${data}`, { withCredentials: true })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
)

export const sessionSlice = createSlice({
    name: 'session',
    initialState: {
        socket: null,
        sessionInfo: null,

        sessionAttendances: null,
    },
    reducers: {
        setSocket: (state, action) => {
            state.socket = action.payload
        },
        setSessionInfo: (state, action) => {
            state.sessionInfo = action.payload
        },
    },
    extraReducers: {
        [getSessionAttendances.fulfilled]: (state, action) => {
            state.sessionAttendances = action.payload
        },
        [getSessionAttendances.rejected]: (state, action) => {
            state.sessionAttendances = null
            toast.error(action.payload)
        },
    }
})

// Action creators are generated for each case reducer function
export const { setSocket, setSessionInfo } = sessionSlice.actions

export default sessionSlice.reducer