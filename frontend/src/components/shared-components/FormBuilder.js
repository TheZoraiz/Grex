import React, { useState } from 'react'
import {
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Menu,
    MenuItem,
} from '@mui/material'
import {
    Add as AddIcon,
} from '@mui/icons-material'

const FormBuilder = (props) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const questionMenuOpen = Boolean(anchorEl);

    const handleQuestionMenuClick = (event) => {
        setAnchorEl(event.currentTarget)
    }

    const handleQuestionMenuClose = () => {
        setAnchorEl(null)
    }

    return (
        <>
            <DialogTitle>Create new form</DialogTitle>
            <DialogContent>
                FormBuilder

            </DialogContent>
            <DialogActions className='flex justify-between'>
                <div>
                    <Button
                        className='normal-case'
                        startIcon={<AddIcon />}
                        onClick={handleQuestionMenuClick}
                    >
                        Add Question
                    </Button>

                    <Menu
                        anchorEl={anchorEl}
                        open={questionMenuOpen}
                        onClose={handleQuestionMenuClose}
                    >
                        <MenuItem>MCQ</MenuItem>
                        <MenuItem>Checkbox Question</MenuItem>
                        <MenuItem>Short Question</MenuItem>
                        <MenuItem>Long Question</MenuItem>
                    </Menu>
                </div>

                <div>
                    <Button
                        className='normal-case'
                        onClick={() => props.handleClose()}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant='contained'
                        className='normal-case'
                    >
                        Submit
                    </Button>
                </div>
            </DialogActions>
        </>
    )
}

export default FormBuilder