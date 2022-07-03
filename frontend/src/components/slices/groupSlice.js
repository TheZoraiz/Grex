import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

export const createGroup = createAsyncThunk(
    'groups/createGroup',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.post(`${process.env.REACT_APP_BACKEND_URI}/api/create-group`, { groupName: data }, { withCredentials: true })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
)

export const joinGroup = createAsyncThunk(
    'groups/joinGroup',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.post(`${process.env.REACT_APP_BACKEND_URI}/api/join-group`, { joinCode: data }, { withCredentials: true })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
)

export const getUserGroups = createAsyncThunk(
    'groups/getUserGroups',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/api/get-user-groups`, { withCredentials: true })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
)

export const groupSlice = createSlice({
    name: 'groups',
    initialState: {
        userGroups: null,
        responseMsg: null,
        fetchError: null,
        error: null,

        groupRedirect: null,
    },
    reducers: {
        setGroupRedirect: (state, action) => {
            state.groupRedirect = action.payload
        },
        nullifyGroupRedirect: (state, action) => {
            state.groupRedirect = null
        },
        nullifyRequestData: (state, action) => {
            state.responseMsg = null
            state.error = null
        },
    },
    extraReducers: {
        [createGroup.fulfilled]: (state, action) => {
            state.responseMsg = action.payload
        },
        [createGroup.rejected]: (state, action) => {
            state.error = action.payload
        },


        [joinGroup.fulfilled]: (state, action) => {
            state.responseMsg = action.payload
        },
        [joinGroup.rejected]: (state, action) => {
            state.error = action.payload
        },


        [getUserGroups.fulfilled]: (state, action) => {
            state.userGroups = action.payload
        },
        [getUserGroups.rejected]: (state, action) => {
            state.fetchError = action.payload
        },
    }
})

// Action creators are generated for each case reducer function
export const { setGroupRedirect, nullifyGroupRedirect, nullifyRequestData } = groupSlice.actions

export default groupSlice.reducer