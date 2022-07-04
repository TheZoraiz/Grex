import React, { useEffect, useState } from 'react'
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Typography,
    CircularProgress,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
} from '@mui/material'
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material'
import { makeStyles } from '@mui/styles'
import { useSelector, useDispatch } from 'react-redux'
import clsx from 'clsx'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'

import {
    createGroupForm,
    getGroupForms,
    editGroupForm,
    deleteGroupForm,
    formRefreshed,
    getFormSubmissions,
    getGroupUserForms,

} from '../slices/formsSlice'
import { nullifyFormRedirect } from '../slices/groupSlice'

import FormBuilder from '../shared-components/FormBuilder'
import FormViewer from '../shared-components/FormViewer'

dayjs.extend(advancedFormat)

const useStyles = makeStyles(theme => ({
    groupFormBar: {
        borderRadius: 5,
    }
}))

const GroupForms = (props) => {
    const classes = useStyles()
    const dispatch = useDispatch()

    const [newFormDialogOpen, setNewFormDialogOpen] = useState(false)
    const [editFormDialogOpen, setEditFormDialogOpen] = useState(false)
    const [formSubmissionsDialogOpen, setFormSubmissionsDialogOpen] = useState(false)
    const [submittedFormViewDialogOpen, setSubmittedFormViewDialogOpen] = useState(false)
    const [tempForm, setTempForm] = useState(false)
    
    const [formSubmissionsLoading, setFormSubmissionsLoading] = useState(false)
    const [formToView, setFormToView] = useState(null)

    const { userData } = useSelector(state => state.global)
    const { formRedirect } = useSelector(state => state.groups)
    const { groupForms, groupUserForms, tempFormSubmissions, formRefresh } = useSelector(state => state.forms)

    const handleDialogsClosure = () => {
        setNewFormDialogOpen(false)
        setEditFormDialogOpen(false)
        setFormSubmissionsDialogOpen(false)
    }

    const handleNewFormSubmit = (newForm) => {
        handleDialogsClosure()
        dispatch(createGroupForm({
            groupId: props.group._id,
            formData: newForm,
        }))
    }

    const handleEditFormSubmit = (newForm) => {
        handleDialogsClosure()
        dispatch(editGroupForm({
            formId: tempForm._id,
            formData: newForm,
        }))
    }

    const handleEditFormClick = (groupForm) => {
        setTempForm(groupForm)
        setEditFormDialogOpen(true)
    }

    const handleDeleteGroupForm = (groupForm) => {
        if(window.confirm('Are you sure you want to delete this form?\n\nThis action is irreversible.')) {
            dispatch(deleteGroupForm({
                formId: groupForm._id
            }))
        }
    }

    const handleViewSubmissionsClick = (groupForm) => {
        setTempForm(groupForm)
        setFormSubmissionsLoading(true)
        dispatch(getFormSubmissions(groupForm._id))
    }

    const handleUserViewSubmission = (submittedForm) => {
        setSubmittedFormViewDialogOpen(true)
        setFormToView(submittedForm)
    }

    useEffect(() => {
        if(props.group.host._id === userData.id)
            dispatch(getGroupForms(props.group._id))
        else
            dispatch(getGroupUserForms({ groupId: props.group._id, userId: userData.id }))

        return () => handleDialogsClosure()
    }, [])

    useEffect(() => {
        setFormSubmissionsLoading(false)
        if(tempFormSubmissions)
            setFormSubmissionsDialogOpen(true)

    }, [tempFormSubmissions])

    useEffect(() => {
        if(formRefresh) {
            dispatch(getGroupForms(props.group._id))
            dispatch(formRefreshed())
        }
    }, [formRefresh])

    useEffect(() => {
        if(groupForms && formRedirect) {
            groupForms?.forEach(form => {
                if(form._id === formRedirect) handleEditFormClick(form)
            })
            dispatch(nullifyFormRedirect())
        }
    }, [formRedirect])

    return (
        <>
            {(props.group.host._id === userData.id) ? (
                <>
                    <div className='h-10 flex justify-end'>
                        <Button
                            className='mr-3 normal-case'
                            variant='contained'
                            startIcon={<AddIcon />}
                            onClick={() => setNewFormDialogOpen(true)}
                        >
                            New Form
                        </Button>
                        
                        <Dialog
                            fullWidth
                            maxWidth='md'
                            open={newFormDialogOpen}
                            onClose={handleDialogsClosure}
                        >
                            <FormBuilder
                                handleSubmit={handleNewFormSubmit}
                                handleClose={handleDialogsClosure}
                            />
                        </Dialog>
                    </div>
                    {groupForms?.length === 0 && (
                        <Typography variant='body1'>
                            No group forms...
                        </Typography>
                    )}

                    {groupForms?.map(groupForm => (
                        <ListItem disablePadding>
                            <ListItemButton
                                onClick={() => handleEditFormClick(groupForm)}
                                className={clsx('p-3 mt-2 flex items-center justify-between', classes.groupFormBar)}
                            >
                                <Typography>
                                    {groupForm.formTitle}
                                </Typography>

                                <div className='flex items-center'>
                                    {(tempForm._id === groupForm._id && formSubmissionsLoading) ? (
                                        <CircularProgress size={25} />
                                    ) : (
                                        <IconButton title='View submissions' onClick={() => handleViewSubmissionsClick(groupForm)}>
                                            <VisibilityIcon />
                                        </IconButton>
                                    )}
                                    <IconButton title='Edit form' onClick={() => handleEditFormClick(groupForm)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton title='Delete form' onClick={() => handleDeleteGroupForm(groupForm)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </div>
                            </ListItemButton>
                        </ListItem>
                    ))}
                </>

            ) : (
                <>
                    {groupUserForms?.length === 0 && (
                        <Typography variant='body1'>
                            No forms submitted...
                        </Typography>
                    )}

                    {groupUserForms?.map(submittedForm => (
                        <ListItem disablePadding>
                            <ListItemButton
                                onClick={() => handleUserViewSubmission(submittedForm)}
                                className={clsx('p-3 mt-2 flex items-center justify-between', classes.groupFormBar)}
                            >
                                <Typography>
                                    {submittedForm.formId.formTitle} ... {dayjs(submittedForm.createdAt).format('hh:mma - Do MMM, YYYY')}
                                </Typography>

                                <IconButton title='View submission' onClick={() => handleUserViewSubmission(submittedForm)}>
                                    <VisibilityIcon />
                                </IconButton>
                            </ListItemButton>
                        </ListItem>
                    ))}
                </>
            )}

            {/* Build form */}
            <Dialog
                fullWidth
                maxWidth='md'
                open={editFormDialogOpen}
                onClose={handleDialogsClosure}
            >
                <FormBuilder
                    form={tempForm}
                    handleSubmit={handleEditFormSubmit}
                    handleClose={handleDialogsClosure}
                />
            </Dialog>

            {/* View form submissions */}
            <Dialog
                fullWidth
                maxWidth='md'
                open={formSubmissionsDialogOpen}
                onClose={handleDialogsClosure}
            >
                <DialogTitle>
                    <Typography variant='h4' className='font-bold'>
                        {tempForm.formTitle}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    {tempFormSubmissions?.length === 0 && (
                        <Typography>
                            No submissions for this form yet...
                        </Typography>
                    )}
                    {tempFormSubmissions?.map(submission => (
                        <ListItem disablePadding>
                            <ListItemButton
                                className='flex justify-between'
                                onClick={() => {
                                    setSubmittedFormViewDialogOpen(true)
                                    setFormToView(submission)
                                }}
                            >
                                <Typography>
                                    {submission.userId.name}
                                </Typography>
                                <Typography>
                                    {dayjs(submission.createdAt).format('hh:mma - Do MMM, YYYY')}
                                </Typography>
                            </ListItemButton>
                        </ListItem>
                    ))}
                </DialogContent>
                <DialogActions className='flex justify-end'>
                    <Button
                        className='normal-case mr-2'
                        onClick={handleDialogsClosure}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                fullWidth
                maxWidth='md'
                open={submittedFormViewDialogOpen}
                onClose={() => setSubmittedFormViewDialogOpen(false)}
            >
                <FormViewer
                    submission={formToView}
                    handleClose={() => setSubmittedFormViewDialogOpen(false)}
                />
            </Dialog>
        </>
    )
}

export default GroupForms