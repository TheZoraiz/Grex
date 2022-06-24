import React, { useState } from 'react'
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
} from '@mui/material'
import {
    Add as AddIcon,
    Cancel as CancelIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { green, red } from '@mui/material/colors'

const FormBuilder = (props) => {
    const [anchorEl, setAnchorEl] = useState(null)
    const questionMenuOpen = Boolean(anchorEl)

    const [formQuestions, setFormQuestions] = useState([])
    const [editQuestionIndex, setEditQuestionIndex] = useState(null)
    const [tempQuestionVal, setTempQuestionVal] = useState('')
    const [editMcqIndex, setEditMcqIndex] = useState(null)
    const [tempMcqVal, setTempMcqVal] = useState('')

    const handleQuestionMenuClick = (event) => {
        setAnchorEl(event.currentTarget)
    }

    const handleQuestionMenuClose = () => {
        setAnchorEl(null)
    }

    const handleAddQuestion = (questionType) => {
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
            
                break

            case 'short':
            
                break

            case 'long':
            
                break
        }
    }

    const handleQuestionClick = (selectedIndex) => {
        setEditQuestionIndex(selectedIndex)
        setTempQuestionVal(formQuestions[selectedIndex]?.question)
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

    const handleMcqRemove = (selectedIndex, mcqIndex) => {
        setFormQuestions(currQuestions => {
            let tempQuestions = [ ...currQuestions ]
            tempQuestions[selectedIndex].options = tempQuestions[selectedIndex].options.filter((o, i) => i !== mcqIndex)
            return tempQuestions
        })
    }

    return (
        <>
            <DialogTitle>Create new form</DialogTitle>
            <DialogContent>
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
                            <div className='cursor-pointer' onClick={() => handleQuestionClick(index)}>
                                <Typography variant='body1'>
                                    { formQuestion.question }
                                </Typography>
                            </div>
                        )}

                        {formQuestion.type === 'mcq' && (
                            <>
                                <RadioGroup>
                                    {formQuestion.options.map((option, i) => (
                                        <div className='flex justify-between'>
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
                                                            <Typography variant='body1' onClick={() => handleMcqClick(index, i)}>
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
    
                                            <IconButton
                                                disabled={formQuestion.options.length === 1}
                                                onClick={() => handleMcqRemove(index, i)}
                                            >
                                                <CancelIcon htmlColor={formQuestion.options.length === 1 ? red[800] : red[500]} />
                                            </IconButton>
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
                    >
                        Submit
                    </Button>
                </div>
            </DialogActions>
        </>
    )
}

export default FormBuilder