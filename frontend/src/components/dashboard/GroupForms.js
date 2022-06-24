import React, { useState } from 'react'
import {
    Button,
    Dialog,
} from '@mui/material'
import {
    Add as AddIcon,
} from '@mui/icons-material'

import FormBuilder from '../shared-components/FormBuilder'

const GroupForms = (props) => {
    const [newFormDialogOpen, setNewFormDialogOpen] = useState(false)

    const handleDialogsClosure = () => {
        setNewFormDialogOpen(false)
    }

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
                        handleClose={handleDialogsClosure}
                    />
                </Dialog>
            </div>
        </>
    )
}

export default GroupForms