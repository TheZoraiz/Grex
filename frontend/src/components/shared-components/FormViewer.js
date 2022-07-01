import React, { useEffect, useRef, useState } from 'react'
import {
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField,
    Divider,
    Checkbox,
} from '@mui/material'

const FormViewer = (props) => {
    const [formTitle, setFormTitle] = useState('')
    const [formSubmitter, setFormSubmitter] = useState(null)
    const [submittedForm, setSubmittedForm] = useState([])

    useEffect(() => {
        if(props.submission) {
            setFormTitle(props.submission.formId.formTitle)
            setFormSubmitter(props.submission.userId)
            setSubmittedForm(JSON.parse(props.submission.submittedData))
        }
    }, [])

    return (
        <>
            <DialogTitle>
                <Typography variant='h4' className='font-bold'>
                    {formTitle + ' (' + formSubmitter?.name + ')'}
                </Typography>
            </DialogTitle>
            <DialogContent>
                {submittedForm.map((formQuestion, index) => (
                    <div>
                        <Divider className='my-3' />
                            <Typography
                                variant='body1'
                                className='cursor-text'
                            >
                                { formQuestion.question }
                            </Typography>

                        {formQuestion.type === 'mcq' && (
                            <RadioGroup>
                                {formQuestion.options.map((option, i) => (
                                    <FormControlLabel
                                        disabled
                                        value={option}
                                        label={option}
                                        checked={formQuestion.chosenOption === option}
                                        control={<Radio size='small' />}
                                    />
                                ))}
                            </RadioGroup>
                        )}

                        {formQuestion.type === 'checkbox' && formQuestion.answerOptions.map((option, i) => (
                            <FormControlLabel
                                disabled
                                value={option.value}
                                checked={option.checked}
                                control={<Checkbox size='small' />}
                                label={option.value}
                            />
                        ))}

                        {(formQuestion.type === 'short' || formQuestion.type === 'long') && (
                            <TextField
                                disabled
                                fullWidth
                                className='mt-2'
                                variant='outlined'
                                multiline={formQuestion.type === 'long'}
                                minRows={3}
                                label={formQuestion.type === 'short' ? 'Short answer...' : 'Long answer...'}
                                value={formQuestion.answer}
                            />
                        )}
                    </div>
                ))}
            </DialogContent>
            <DialogActions className='flex justify-end'>
                <Button
                    className='normal-case mr-2'
                    onClick={() => props.handleClose()}
                >
                    Close
                </Button>
            </DialogActions>
        </>
    )
}

export default FormViewer