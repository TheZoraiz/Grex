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
            });

            return response.data
        } catch (error) {
            return rejectWithValue(error.response);
        }
    }
)

export const userSlice = createSlice({
    name: 'user',
    initialState: {
        userData: null,
        jwtAccessToken: null,
        error: null,
    },
    reducers: {
        nullifyError: (state, action) => {
            state.error = null
        },
    },
    extraReducers: {
        [registerUser.fulfilled]: (state, action) => {
            state.jwtAccessToken = action.payload.jwtAccessToken
            state.userData = action.payload
        },
        [registerUser.rejected]: (state, action) => {
            state.error = action.payload
        },
    },
})

// Action creators are generated for each case reducer function
export const { nullifyError } = userSlice.actions

export default userSlice.reducer