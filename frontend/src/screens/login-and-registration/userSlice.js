import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const registerUser = createAsyncThunk(
    'users/registerUser',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.post(`${process.env.REACT_APP_BACKEND_URI}/api/register`, {
                username: data.username,
                email: data.email,
                password: data.password,
                retypedPassword: data.retypedPassword,

            }, { withCredentials: true })

            return response.data
        } catch (error) {
            return rejectWithValue(error.response);
        }
    }
)

export const loginUser = createAsyncThunk(
    'users/loginUser',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.post(`${process.env.REACT_APP_BACKEND_URI}/api/login`, {
                email: data.email,
                password: data.password,

            }, { withCredentials: true })

            return response.data
        } catch (error) {
            return rejectWithValue(error.response);
        }
    }
)

export const userSlice = createSlice({
    name: 'user',
    initialState: {
        registrationMsg: null,
        loginServerMsg: null,
        error: null,
    },
    reducers: {
        nullifyError: (state, action) => {
            state.error = null
        },
    },
    extraReducers: {
        [registerUser.fulfilled]: (state, action) => {
            state.registrationMsg = action.payload
        },
        [registerUser.rejected]: (state, action) => {
            state.error = action.payload
        },


        [loginUser.fulfilled]: (state, action) => {
            state.loginServerMsg = action.payload.msg
            state.userData = action.payload.jwtUserData
        },
        [loginUser.rejected]: (state, action) => {
            state.error = action.payload
        },
    },
})

// Action creators are generated for each case reducer function
export const { nullifyError } = userSlice.actions

export default userSlice.reducer