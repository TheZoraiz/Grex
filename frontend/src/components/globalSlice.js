import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'
import {  } from './slices/userSlice'
import axios from 'axios'

export const verifyToken = createAsyncThunk(
    'global/verifyToken',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/api/verifyToken`, { withCredentials: true })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response);
        }
    }
)

export const logout = createAsyncThunk(
    'global/logout',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/api/logout`, { withCredentials: true })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
)

export const globalSlice = createSlice({
    name: 'global',
    initialState: {
        tokenVerifiedMsg: null,
        logoutMsg: null,
        userData: null,
        error: null,
    },
    reducers: {
        nullifyAuthError: (state, action) => {
            state.error = null
        },
        nullifyLogoutData: (state, action) => {
            state.logoutMsg = null
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


        [logout.fulfilled]: (state, action) => {
            state.logoutMsg = action.payload
        },
        [logout.rejected]: (state, action) => {
            state.error = action.payload
        },
    },
})

// Action creators are generated for each case reducer function
export const { nullifyAuthError, setUserData, nullifyLogoutData } = globalSlice.actions

export default globalSlice.reducer