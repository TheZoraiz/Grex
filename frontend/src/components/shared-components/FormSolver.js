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
import _ from 'lodash' 

const FormSolver = (props) => {
    const [formTitle, setFormTitle] = useState('')
    const [submissionForm, setSubmissionForm] = useState([])
    const submissionFormRef = useRef(submissionForm)

    const handleMcqBoxClick = (index, chosenOption) => {
        setSubmissionForm(currQuestions => {
            let tempQuestions = [ ...currQuestions ]
            tempQuestions[index].chosenOption = chosenOption

            submissionFormRef.current = tempQuestions
            return tempQuestions
        })
    }

    const handleCheckboxClick = (index, checkboxIndex, newVal) => {
        setSubmissionForm(currQuestions => {
            let tempQuestions = [ ...currQuestions ]
            tempQuestions[index].answerOptions[checkboxIndex].checked = newVal

            submissionFormRef.current = tempQuestions
            return tempQuestions
        })
    }

    const handleShortLongAnswer = (index, newAnswer) => {
        setSubmissionForm(currQuestions => {
            let tempQuestions = [ ...currQuestions ]
            tempQuestions[index].answer = newAnswer

            submissionFormRef.current = tempQuestions
            return tempQuestions
        })
    }

    const handleSubmit = () => {
        props.handleSubmit({
            formId: props.form._id,
            submissionForm,
        })
    }

    useEffect(() => {
        let interval

        if(props.form) {
            setFormTitle(props.form.formTitle)

            let savedForms = JSON.parse(localStorage.getItem('savedForms'))
            let savedFormById = savedForms ? savedForms[props.form._id] : null
            
            let newSubmissionForm

            if(savedFormById)
                newSubmissionForm = JSON.parse(savedFormById)
            else {
                newSubmissionForm = JSON.parse(props.form.formQuestions)
                newSubmissionForm.forEach((question, index) => {
                    switch(question.type) {
                        case 'mcq':
                            newSubmissionForm[index].chosenOption = null
                            break
    
                        case 'checkbox':
                            newSubmissionForm[index].answerOptions = newSubmissionForm[index].options.map(option => ({ value: option.value, checked: false }))
                            break
    
                        case 'short':
                        case 'long':
                            newSubmissionForm[index].answer = ''
                            break
                    }
                })
            }

            setSubmissionForm(newSubmissionForm)
            submissionFormRef.current = newSubmissionForm

            // Save answers in local storage every 5 seconds
            interval = setInterval(() => {
                console.log('Saved')
                localStorage.setItem('savedForms', JSON.stringify({
                    ...JSON.parse(localStorage.getItem('savedForms')),
                    [props.form._id]: JSON.stringify(submissionFormRef.current)
                }))
            }, 5000)
        }

        return () => {
            clearInterval(interval)
        }
    }, [])

    return (
        <>
            <DialogTitle>
                <Typography variant='h4' className='font-bold'>
                    {formTitle}
                </Typography>
            </DialogTitle>
            <DialogContent>
                {submissionForm.map((formQuestion, index) => (
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
                                        value={option}
                                        label={option}
                                        onChange={() => handleMcqBoxClick(index, option)}
                                        checked={formQuestion.chosenOption === option}
                                        control={<Radio size='small' />}
                                    />
                                ))}
                            </RadioGroup>
                        )}

                        {formQuestion.type === 'checkbox' && formQuestion.answerOptions.map((option, i) => (
                            <FormControlLabel
                                value={option.value}
                                checked={option.checked}
                                onClick={() => handleCheckboxClick(index, i, !option.checked)}
                                control={<Checkbox size='small' />}
                                label={option.value}
                            />
                        ))}

                        {(formQuestion.type === 'short' || formQuestion.type === 'long') && (
                            <TextField
                                fullWidth
                                className='mt-2'
                                variant='outlined'
                                multiline={formQuestion.type === 'long'}
                                minRows={3}
                                label={formQuestion.type === 'short' ? 'Short answer...' : 'Long answer...'}
                                value={formQuestion.answer}
                                onChange={(e) => handleShortLongAnswer(index, e.target.value)}
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
                    Minimize
                </Button>
                <Button
                    variant='contained'
                    className='normal-case'
                    onClick={handleSubmit}
                >
                    Submit
                </Button>
            </DialogActions>
        </>
    )
}

export default FormSolver