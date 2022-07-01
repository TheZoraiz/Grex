import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'

export const createGroupForm = createAsyncThunk(
    'forms/createGroupForm',
    async (data, { rejectWithValue }) => {
        try {
            toast.loading('Creating group form...', { toastId: 'create-group-form' })
            let response = await axios.post(`${process.env.REACT_APP_BACKEND_URI}/api/create-group-form`, data, { withCredentials: true })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
)

export const getGroupForms = createAsyncThunk(
    'forms/getGroupForms',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/api/get-group-forms?groupId=${data}`, { withCredentials: true })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
)

export const editGroupForm = createAsyncThunk(
    'forms/editGroupForm',
    async (data, { rejectWithValue }) => {
        try {
            toast.loading('Submitting edit...', { toastId: 'edit-group-form' })
            let response = await axios.post(`${process.env.REACT_APP_BACKEND_URI}/api/edit-group-form`, data, { withCredentials: true })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
)

export const deleteGroupForm = createAsyncThunk(
    'forms/deleteGroupForm',
    async (data, { rejectWithValue }) => {
        try {
            toast.loading('Deleting form...', { toastId: 'delete-group-form' })
            let response = await axios.post(`${process.env.REACT_APP_BACKEND_URI}/api/delete-group-form`, data, { withCredentials: true })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
)

export const getFormSubmissions = createAsyncThunk(
    'forms/getFormSubmissions',
    async (data, { rejectWithValue }) => {
        try {
            let response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/api/get-forms-submissions?formId=${data}`, { withCredentials: true })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
)

export const formsSlice = createSlice({
    name: 'forms',
    initialState: {
        groupForms: null,
        formRefresh: false,
        tempFormSubmissions: null,
    },
    reducers: {
        formRefreshed: (state, action) => {
            state.formRefresh = false
        }
    },
    extraReducers: {
        [createGroupForm.fulfilled]: (state, action) => {
            toast.update(
                'create-group-form',
                { render: action.payload, type: 'success', isLoading: false, autoClose: 5000, draggable: true, closeOnClick: true }
            )
        },
        [createGroupForm.rejected]: (state, action) => {
            toast.update(
                'create-group-form',
                { render: action.payload, type: 'error', isLoading: false, autoClose: 5000, draggable: true, closeOnClick: true }
            )
        },


        [getGroupForms.fulfilled]: (state, action) => {
            state.formRefresh = true
            state.groupForms = action.payload
        },
        [getGroupForms.rejected]: (state, action) => {
            state.groupForms = null
            toast.error(action.payload)
        },


        [editGroupForm.fulfilled]: (state, action) => {
            state.formRefresh = true
            toast.update(
                'edit-group-form',
                { render: action.payload, type: 'success', isLoading: false, autoClose: 5000, draggable: true, closeOnClick: true }
            )
        },
        [editGroupForm.rejected]: (state, action) => {
            toast.update(
                'edit-group-form',
                { render: action.payload, type: 'error', isLoading: false, autoClose: 5000, draggable: true, closeOnClick: true }
            )
        },


        [deleteGroupForm.fulfilled]: (state, action) => {
            state.formRefresh = true
            toast.update(
                'delete-group-form',
                { render: action.payload, type: 'success', isLoading: false, autoClose: 5000, draggable: true, closeOnClick: true }
            )
        },
        [deleteGroupForm.rejected]: (state, action) => {
            toast.update(
                'delete-group-form',
                { render: action.payload, type: 'error', isLoading: false, autoClose: 5000, draggable: true, closeOnClick: true }
            )
        },


        [getFormSubmissions.fulfilled]: (state, action) => {
            state.tempFormSubmissions = action.payload
        },
        [getFormSubmissions.rejected]: (state, action) => {
            state.tempFormSubmissions = null
            toast.error(action.payload)
        },
    }
})

// Action creators are generated for each case reducer function
export const { formRefreshed } = formsSlice.actions

export default formsSlice.reducer