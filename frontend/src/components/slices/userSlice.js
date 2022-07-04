import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'

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

export const uploadProfPic = createAsyncThunk(
    'users/uploadProfPic',
    async (data, { rejectWithValue }) => {
        try {
            toast.loading('Uploading profile pic...', { toastId: 'uploading-prof-pic' })
            let response = await axios.post(`${process.env.REACT_APP_BACKEND_URI}/api/upload-prof-pic`, data, { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } })
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
            state.registrationMsg = null
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


        [uploadProfPic.fulfilled]: (state, action) => {
            state.userData = action.payload.jwtUserData
            toast.update(
                'uploading-prof-pic',
                { render: action.payload.msg, type: 'success', isLoading: false, autoClose: 5000, draggable: true, closeOnClick: true }
            )
            window.location.reload()
        },
        [uploadProfPic.rejected]: (state, action) => {
            toast.update(
                'uploading-prof-pic',
                { render: action.payload, type: 'error', isLoading: false, autoClose: 5000, draggable: true, closeOnClick: true }
            )
        },
    },
})

// Action creators are generated for each case reducer function
export const { nullifyError } = userSlice.actions

export default userSlice.reducer