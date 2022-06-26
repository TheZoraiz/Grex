import React, { useEffect, useState } from 'react'
import {
    Button,
    Dialog,
} from '@mui/material'
import {
    Add as AddIcon,
} from '@mui/icons-material'
import { createGroupForm, getGroupForms } from '../slices/formsSlice'
import { useSelector, useDispatch } from 'react-redux'

import FormBuilder from '../shared-components/FormBuilder'

const GroupForms = (props) => {
    const dispatch = useDispatch()

    const [newFormDialogOpen, setNewFormDialogOpen] = useState(false)

    const { groupForms } = useSelector(state => state.forms)

    const handleDialogsClosure = () => {
        setNewFormDialogOpen(false)
    }

    const handleNewFormSubmit = (newForm) => {
        handleDialogsClosure()
        dispatch(createGroupForm({
            groupId: props.group._id,
            formData: newForm,
        }))
    }

    useEffect(() => {
        dispatch(getGroupForms(props.group._id))
    }, [])

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

            {groupForms?.map(groupForm => groupForm.formTitle)}
        </>
    )
}

export default GroupForms