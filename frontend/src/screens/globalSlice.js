import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'
import {  } from './login-and-registration/userSlice'
import axios from 'axios'

export const verifyToken = createAsyncThunk(
    'users/verifyToken',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/api/verifyToken`, { withCredentials: true })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response);
        }
    }
)

export const globalSlice = createSlice({
    name: 'global',
    initialState: {
        tokenVerifiedMsg: null,
        userData: null,
        error: null,
    },
    reducers: {
        nullifyAuthError: (state, action) => {
            state.error = null
        },
        setUserData: (state, action) => {
            state.userData = action.payload
        },
    },
    extraReducers: {
        [verifyToken.fulfilled]: (state, action) => {
            state.tokenVerifiedMsg = action.payload.msg
            state.userData = action.payload.userData
        },
        [verifyToken.rejected]: (state, action) => {
            state.error = action.payload
        },
    },
})

// Action creators are generated for each case reducer function
export const { nullifyAuthError, setUserData } = globalSlice.actions

export default globalSlice.reducer