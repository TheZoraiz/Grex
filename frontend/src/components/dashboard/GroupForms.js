import React, { useEffect, useState } from 'react'
import {
    Button,
    Dialog,
    IconButton,
    Typography,
} from '@mui/material'
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material'
import { makeStyles } from '@mui/styles'
import { createGroupForm, getGroupForms, editGroupForm, deleteGroupForm, formRefreshed } from '../slices/formsSlice'
import { useSelector, useDispatch } from 'react-redux'
import clsx from 'clsx'

import FormBuilder from '../shared-components/FormBuilder'

const useStyles = makeStyles(theme => ({
    groupFormBar: {
        borderRadius: 5,
        boxShadow: '0 0 3px black'
    }
}))

const GroupForms = (props) => {
    const classes = useStyles()
    const dispatch = useDispatch()

    const [newFormDialogOpen, setNewFormDialogOpen] = useState(false)
    const [editFormDialogOpen, setEditFormDialogOpen] = useState(false)
    const [tempForm, setTempForm] = useState(false)

    const { groupForms, formRefresh } = useSelector(state => state.forms)

    const handleDialogsClosure = () => {
        setNewFormDialogOpen(false)
        setEditFormDialogOpen(false)
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

    useEffect(() => {
        dispatch(getGroupForms(props.group._id))
    }, [])

    useEffect(() => {
        if(formRefresh) {
            dispatch(getGroupForms(props.group._id))
            dispatch(formRefreshed())
        }
    }, [formRefresh])

    return (
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

            {groupForms?.map(groupForm => (
                <div className={clsx('p-3 mt-2 flex items-center justify-between', classes.groupFormBar)}>
                    <Typography>
                        {groupForm.formTitle}
                    </Typography>

                    <div className='flex'>
                        <IconButton onClick={() => handleEditFormClick(groupForm)}>
                            <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteGroupForm(groupForm)}>
                            <DeleteIcon />
                        </IconButton>
                    </div>
                </div>
            ))}

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
        </>
    )
}

export default GroupForms