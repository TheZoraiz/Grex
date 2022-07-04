import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'

export const getDashboardData = createAsyncThunk(
    'dashboard/getDashboardData',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/api/get-dashboard-data`, { withCredentials: true })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response);
        }
    }
)

export const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState: {
        groups: null,
        liveSessions: null,
        groupForms: null,
        dashboardRefresh: false,
    },
    reducers: {
        
    },
    extraReducers: {
        [getDashboardData.fulfilled]: (state, action) => {
            state.groups = action.payload.allUserGroups
            state.liveSessions = action.payload.liveSessions
            state.groupForms = action.payload.groupForms
        },
        [getDashboardData.rejected]: (state, action) => {
            toast.error(action.payload)
        },
    },
})

// Action creators are generated for each case reducer function
export const {  } = dashboardSlice.actions

export default dashboardSlice.reducer