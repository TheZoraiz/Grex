import React, { useEffect, useState } from 'react'
import {
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Menu,
    MenuItem,
    Typography,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField,
    InputAdornment,
    IconButton,
    Divider,
    Checkbox,
} from '@mui/material'
import {
    Add as AddIcon,
    Cancel as CancelIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { green, red } from '@mui/material/colors'
import { toast } from 'react-toastify'

const FormBuilder = (props) => {
    const [anchorEl, setAnchorEl] = useState(null)
    const questionMenuOpen = Boolean(anchorEl)

    const [formQuestions, setFormQuestions] = useState([])
    const [formTitle, setFormTitle] = useState('')

    const [editQuestionIndex, setEditQuestionIndex] = useState(null)
    const [tempQuestionVal, setTempQuestionVal] = useState('')
    const [editMcqIndex, setEditMcqIndex] = useState(null)
    const [tempMcqVal, setTempMcqVal] = useState('')
    const [editCheckboxIndex, setEditCheckboxIndex] = useState(null)
    const [tempCheckboxVal, setTempCheckboxVal] = useState({})

    const handleQuestionMenuClick = (event) => {
        setAnchorEl(event.currentTarget)
    }

    const handleQuestionMenuClose = () => {
        setAnchorEl(null)
    }

    const handleAddQuestion = (questionType) => {
        handleQuestionMenuClose()

        switch(questionType) {
            case 'mcq':
                setFormQuestions(currQuestions => {
                    let tempQuestions = [ ...currQuestions ]
                    if(!tempQuestions)
                        tempQuestions = []
                    
                    tempQuestions.push({
                        question: 'Enter your question here',
                        type: 'mcq',
                        options: [
                            'Option 1',
                            'Option 2',
                            'Option 3',
                            'Option 4',
                        ],
                        correctOption: 'Option 1',
                    })

                    return tempQuestions
                })
                return

            case 'checkbox':
                setFormQuestions(currQuestions => {
                    let tempQuestions = [ ...currQuestions ]
                    if(!tempQuestions)
                        tempQuestions = []
                    
                    tempQuestions.push({
                        question: 'Enter your question here',
                        type: 'checkbox',
                        options: [
                            { value: 'Option 1', checked: true },
                            { value: 'Option 2', checked: true },
                            { value: 'Option 3', checked: false },
                            { value: 'Option 4', checked: false },
                        ],
                    })

                    return tempQuestions
                })
                return

            case 'short':
            case 'long':
                setFormQuestions(currQuestions => {
                    let tempQuestions = [ ...currQuestions ]
                    if(!tempQuestions)
                        tempQuestions = []
                    
                    tempQuestions.push({
                        question: 'Enter your question here',
                        type: questionType,
                    })

                    return tempQuestions
                })
                return
        }
    }

    const handleQuestionClick = (selectedIndex) => {
        setEditQuestionIndex(selectedIndex)
        setTempQuestionVal(formQuestions[selectedIndex]?.question)
    }

    const handleQuestionRemove = (selectedIndex) => {
        setFormQuestions(currQuestions => currQuestions.filter((q, i) => i !== selectedIndex))
    }

    const handleEditQuestion = () => {
        setFormQuestions(currQuestions => {
            let tempQuestions = [ ...currQuestions ]
            tempQuestions[editQuestionIndex].question = tempQuestionVal
            return tempQuestions
        })
        setEditQuestionIndex(null)
        setTempQuestionVal('')
    }

    // MCQs

    const handleRadioAnswerChange = (selectedIndex, newVal) => {
        setFormQuestions(currQuestions => {
            let tempQuestions = [ ...currQuestions ]
            tempQuestions[selectedIndex].correctOption = newVal
            return tempQuestions
        })
    }

    const handleRadioAddOption = (selectedIndex, newVal) => {
        setFormQuestions(currQuestions => {
            let tempQuestions = [ ...currQuestions ]
            let currOptions = tempQuestions[selectedIndex].options
            tempQuestions[selectedIndex].options.push(`Option ${currOptions.length + 1}`)
            return tempQuestions
        })
    }

    const handleMcqClick = (selectedIndex, mcqIndex) => {
        setEditMcqIndex({
            questionIndex: selectedIndex,
            optionIndex: mcqIndex,
        })
        setTempMcqVal(formQuestions[selectedIndex]?.options[mcqIndex])
    }

    const handleEditMcq = () => {
        setFormQuestions(currQuestions => {
            let tempQuestions = [ ...currQuestions ]
            tempQuestions[editMcqIndex?.questionIndex].options[editMcqIndex?.optionIndex] = tempMcqVal
            return tempQuestions
        })
        setEditMcqIndex(null)
        setTempMcqVal('')
    }

    const handleMcqAndCheckboxRemove = (selectedIndex, optionIndex) => {
        setFormQuestions(currQuestions => {
            let tempQuestions = [ ...currQuestions ]
            tempQuestions[selectedIndex].options = tempQuestions[selectedIndex].options.filter((o, i) => i !== optionIndex)
            return tempQuestions
        })
    }

    // Checkboxes

    const handleCheckboxClick = (selectedIndex, checkboxIndex) => {
        setEditCheckboxIndex({
            questionIndex: selectedIndex,
            optionIndex: checkboxIndex,
        })
        setTempCheckboxVal(formQuestions[selectedIndex]?.options[checkboxIndex].value)
    }

    const handleEditCheckbox = () => {
        setFormQuestions(currQuestions => {
            let tempQuestions = [ ...currQuestions ]
            tempQuestions[editCheckboxIndex?.questionIndex].options[editCheckboxIndex?.optionIndex].value = tempCheckboxVal
            return tempQuestions
        })
        setEditCheckboxIndex(null)
        setTempCheckboxVal({});
    }

    const handleCheckboxAnswer = (selectedIndex, checkboxIndex, newVal) => {
        setFormQuestions(currQuestions => {
            let tempQuestions = [ ...currQuestions ]
            tempQuestions[selectedIndex].options[checkboxIndex].checked = newVal
            return tempQuestions
        })
    }

    const handleCheckboxAddOption = (selectedIndex, newVal) => {
        setFormQuestions(currQuestions => {
            let tempQuestions = [ ...currQuestions ]
            let currOptions = tempQuestions[selectedIndex].options
            tempQuestions[selectedIndex].options.push({
                value: `Option ${currOptions.length + 1}`,
                checked: false,
            })
            return tempQuestions
        })
    }

    const handleSubmit = () => {
        if(formQuestions.length === 0) {
            toast.error('You haven\'t added any questions yet')
            return
        }
        if(formTitle === '') {
            toast.error('A title is needed for the form')
            return
        }
        props.handleSubmit({
            formTitle,
            formQuestions,
        })
    }

    useEffect(() => {
        if(props.form) {
            setFormTitle(props.form.formTitle)
            setFormQuestions(JSON.parse(props.form.formQuestions))
        }
    }, [])

    return (
        <>
            <DialogTitle>
                <Typography variant='h4' className='font-bold'>
                    {props.form ? 'Edit form' : 'Create new form'}
                </Typography>

                <TextField
                    fullWidth
                    className='mt-2'
                    variant='outlined'
                    label='Enter form title'
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                />
            </DialogTitle>
            <DialogContent>
                {formQuestions.length === 0 && (
                    <Typography>
                        Please add questions from the menu below
                    </Typography>
                )}
                {formQuestions.map((formQuestion, index) => (
                    <div>
                        <Divider className='my-3' />
                        {editQuestionIndex === index ? (
                            <TextField
                                autoFocus
                                fullWidth
                                size='small'
                                variant='outlined'
                                defaultValue={tempQuestionVal}
                                onChange={e => setTempQuestionVal(e.target.value)}
                                onKeyPress={(e) => { if(e.key === 'Enter') handleEditQuestion() }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position='end'>
                                            <IconButton
                                                onClick={handleEditQuestion}
                                                onMouseDown={(event) => event.preventDefault()}
                                                edge='end'
                                            >
                                                <CheckCircleIcon />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                            />

                        ) : (
                            <div className='flex justify-between items-center'>
                                <Typography
                                    variant='body1'
                                    className='cursor-text'
                                    onClick={() => handleQuestionClick(index)}
                                >
                                    { formQuestion.question }
                                </Typography>

                                <Button
                                    variant='contained'
                                    className='normal-case'
                                    style={{ backgroundColor: red[500] }}
                                    onClick={() => handleQuestionRemove(index)}
                                >
                                    Remove Question
                                </Button>
                            </div>
                        )}

                        {formQuestion.type === 'mcq' && (
                            <>
                                <RadioGroup>
                                    {formQuestion.options.map((option, i) => (
                                        <div className='flex'>
                                            <IconButton
                                                disabled={formQuestion.options.length === 1}
                                                onClick={() => handleMcqAndCheckboxRemove(index, i)}
                                            >
                                                <CancelIcon htmlColor={formQuestion.options.length === 1 ? red[800] : red[500]} />
                                            </IconButton>

                                            <FormControlLabel
                                                value={option}
                                                onClick={() => handleRadioAnswerChange(index, option)}
                                                checked={formQuestion.correctOption === option}
                                                control={<Radio size='small' />}
                                                label={(
                                                    <div className='flex items-center'>
                                                        {(editMcqIndex?.questionIndex === index && editMcqIndex?.optionIndex === i) ? (
                                                            <TextField
                                                                autoFocus
                                                                size='small'
                                                                variant='outlined'
                                                                defaultValue={tempMcqVal}
                                                                onChange={e => setTempMcqVal(e.target.value)}
                                                                onKeyPress={(e) => { if(e.key === 'Enter') handleEditMcq() }}
                                                                InputProps={{
                                                                    endAdornment: (
                                                                        <InputAdornment position='end'>
                                                                            <IconButton
                                                                                onClick={handleEditMcq}
                                                                                onMouseDown={(event) => event.preventDefault()}
                                                                                edge='end'
                                                                            >
                                                                                <CheckCircleIcon />
                                                                            </IconButton>
                                                                        </InputAdornment>
                                                                    )
                                                                }}
                                                            />
                                                        ) : (
                                                            <Typography className='cursor-text' variant='body1' onClick={() => handleMcqClick(index, i)}>
                                                                {option}
                                                            </Typography>
                                                        )}
                                                        {formQuestion.correctOption === option ? (
                                                            <Typography variant='body1' className='ml-2' color={green[400]}>
                                                                (Correct Choice)
                                                            </Typography>
                                                        ) : (
                                                            <Typography variant='body1' className='ml-2' color={red[500]}>
                                                                (Wrong Choice)
                                                            </Typography>
                                                        )}
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    ))}
                                </RadioGroup>
                                <Button
                                    fullWidth
                                    size='small'
                                    className='normal-case flex justify-start'
                                    startIcon={<AddIcon />}
                                    onClick={() => handleRadioAddOption(index)}
                                >
                                    Add new option
                                </Button>
                            </>
                        )}


                        {formQuestion.type === 'checkbox' && (
                            <>
                                {formQuestion.options.map((option, i) => (
                                    <div className='flex'>
                                        <IconButton
                                            disabled={formQuestion.options.length === 1}
                                            onClick={() => handleMcqAndCheckboxRemove(index, i)}
                                        >
                                            <CancelIcon htmlColor={formQuestion.options.length === 1 ? red[800] : red[500]} />
                                        </IconButton>

                                        <FormControlLabel
                                            value={option.value}
                                            onClick={() => handleCheckboxAnswer(index, i, !option.checked)}
                                            checked={option.checked}
                                            control={<Checkbox size='small' />}
                                            label={(
                                                <div className='flex items-center'>
                                                    {(editCheckboxIndex?.questionIndex === index && editCheckboxIndex?.optionIndex === i) ? (
                                                        <TextField
                                                            autoFocus
                                                            size='small'
                                                            variant='outlined'
                                                            defaultValue={tempCheckboxVal}
                                                            onChange={e => setTempCheckboxVal(e.target.value)}
                                                            onKeyPress={(e) => { if(e.key === 'Enter') handleEditCheckbox() }}
                                                            InputProps={{
                                                                endAdornment: (
                                                                    <InputAdornment position='end'>
                                                                        <IconButton
                                                                            onClick={handleEditCheckbox}
                                                                            onMouseDown={(event) => event.preventDefault()}
                                                                            edge='end'
                                                                        >
                                                                            <CheckCircleIcon />
                                                                        </IconButton>
                                                                    </InputAdornment>
                                                                )
                                                            }}
                                                        />
                                                    ) : (
                                                        <Typography className='cursor-text' variant='body1' onClick={() => handleCheckboxClick(index, i)}>
                                                            {option.value}
                                                        </Typography>
                                                    )}
                                                    {option.checked ? (
                                                        <Typography
                                                            variant='body1'
                                                            className='ml-2'
                                                            color={green[400]}
                                                            onClick={() => handleCheckboxAnswer(index, i, !option.checked)}
                                                        >
                                                            (Correct Option)
                                                        </Typography>
                                                    ) : (
                                                        <Typography
                                                            variant='body1'
                                                            className='ml-2'
                                                            color={red[500]}
                                                            onClick={() => handleCheckboxAnswer(index, i, !option.checked)}
                                                        >
                                                            (Wrong Option)
                                                        </Typography>
                                                    )}
                                                </div>
                                            )}
                                        />
                                    </div>
                                ))}
                                <Button
                                    fullWidth
                                    size='small'
                                    className='normal-case flex justify-start'
                                    startIcon={<AddIcon />}
                                    onClick={() => handleCheckboxAddOption(index)}
                                >
                                    Add new option
                                </Button>
                            </>
                        )}


                        {(formQuestion.type === 'short' || formQuestion.type === 'long') && (
                            <TextField
                                fullWidth
                                disabled
                                className='mt-2'
                                variant='outlined'
                                multiline={formQuestion.type === 'long'}
                                minRows={3}
                                label={formQuestion.type === 'short' ? 'Short answer...' : 'Long answer...'}
                            />
                        )}
                    </div>
                ))}
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
                        <MenuItem onClick={() => handleAddQuestion('mcq')}>MCQ</MenuItem>
                        <MenuItem onClick={() => handleAddQuestion('checkbox')}>Checkbox Question</MenuItem>
                        <MenuItem onClick={() => handleAddQuestion('short')}>Short Question</MenuItem>
                        <MenuItem onClick={() => handleAddQuestion('long')}>Long Question</MenuItem>
                    </Menu>
                </div>

                <div>
                    <Button
                        className='normal-case mr-2'
                        onClick={() => props.handleClose()}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant='contained'
                        className='normal-case'
                        onClick={handleSubmit}
                    >
                        Submit
                    </Button>
                </div>
            </DialogActions>
        </>
    )
}

export default FormBuilder