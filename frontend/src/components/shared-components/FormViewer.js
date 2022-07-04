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
import { green, red } from '@mui/material/colors'

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
                                        checked={formQuestion.chosenOption === option}
                                        control={<Radio size='small' />}
                                        label={(
                                            <div className='flex items-center'>
                                                <Typography className='cursor-text' variant='body1'>
                                                    {option}
                                                </Typography>

                                                {formQuestion.correctOption === option && (
                                                    <Typography variant='body1' className='ml-2' color={green[400]}>
                                                        (Correct Choice)
                                                    </Typography>
                                                )}
                                                {(formQuestion.chosenOption === option && formQuestion.chosenOption !== formQuestion.correctOption) && (
                                                    <Typography variant='body1' className='ml-2' color={red[500]}>
                                                        (Wrong Choice)
                                                    </Typography>
                                                )}
                                            </div>
                                        )}
                                    />
                                ))}
                            </RadioGroup>
                        )}

                        {formQuestion.type === 'checkbox' && formQuestion.answerOptions.map((option, i) => (
                            <>
                                <FormControlLabel
                                    disabled
                                    value={option.value}
                                    checked={option.checked}
                                    control={<Checkbox size='small' />}
                                    label={
                                        <div className='flex items-center'>
                                            <Typography className='cursor-text' variant='body1'>
                                                {option.value}
                                            </Typography>

                                            {formQuestion.options[i].checked && (
                                                <Typography variant='body1' className='ml-2' color={green[400]}>
                                                    (Correct Option)
                                                </Typography>
                                            )}
                                            {(option.checked && formQuestion.options[i].checked !== option.checked) && (
                                                <Typography variant='body1' className='ml-2' color={red[500]}>
                                                    (Wrong Option)
                                                </Typography>
                                            )}
                                        </div>
                                    }
                                />
                                <br />
                            </>
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