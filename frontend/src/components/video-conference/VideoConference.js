import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';
import {
    Tab,
    Tabs,
    Box,
    Typography,
    IconButton,
    Badge,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Button,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemAvatar,
    Checkbox,
    Avatar,
    Chip,
    Tooltip,
} from '@mui/material';
import {
    AddCircle as AddCircleIcon,
    Adjust as AdjustIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux'
import { v4 as uuidv4 } from 'uuid'
import { setSocket } from '../slices/sessionSlice'
import { toast } from 'react-toastify'
import { makeStyles } from '@mui/styles';
import clsx from 'clsx';

import SessionScreen from './SessionScreen'

const useStyles = makeStyles(theme => ({
    formBar: {
        '&:hover': {
            backgroundColor: theme.palette.background.dark,
        }
    },
    selectedFormBar: {
        backgroundColor: theme.palette.background.darker,
    }
}))


function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box className='px-5'>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

function VideoConference() {
    const classes = useStyles()
    const dispatch = useDispatch()

    const { socket, sessionInfo } = useSelector(state => state.session)
    const { userData } = useSelector(state => state.global)

    const [tabValue, setTabValue] = useState(0)

    const [groupFormsDialogOpen, setGroupFormsDialogOpen] = useState(false)
    const [breakoutRoomNameDialogOpen, setBreakoutRoomNameDialogOpen] = useState(false)
    const [breakoutRoomChoiceDialogOpen, setBreakoutRoomChoiceDialogOpen] = useState(false)
    const [participantsRoomTransfer, setParticipantsRoomTransfer] = useState(false)
    const [tempRoomName, setTempRoomName] = useState('')
    const [tempParticipants, setTempParticipants] = useState(null)
    const [chosenParticipants, setChosenParticipants] = useState([])
    const [roomTabs, setRoomTabs] = useState([{
        id: sessionInfo._id,
        name: 'Main Room',
        participants: 0,
    }])
    const [groupForms, setGroupForms] = useState([])
    const [selectedGroupForm, setSelectedGroupForm] = useState(null)
    const [assignedFormHostSide, setAssignedFormHostSide] = useState(null)
    const [formsStatus, setFormsStatus] = useState(null)

    const handleChange = (event, newValue) => {
        socket.disconnect()
        setTabValue(newValue)
    }

    const handleBreakoutRoomNameSubmittion = () => {
        for(let i = 0; i < roomTabs.length; i++) {
            if(tempRoomName === roomTabs[i].name) {
                toast.info(`${tempRoomName} already exists`)
                return
            }
        }

        let newTabs = [
            ...roomTabs,
            {
                id: uuidv4(),
                name: tempRoomName,
                participants: 0,
            }
        ]
        setRoomTabs(newTabs)

        socket.emit('breakout-room-created', newTabs)
        setBreakoutRoomNameDialogOpen(false)
    }

    const handleParticipantsRoomTransfer = (participants) => {
        setTempParticipants(participants)
        setParticipantsRoomTransfer(true)
    }

    const handleParticipantsRoomTransferDialogClosure = () => {
        setTempParticipants(null)
        setChosenParticipants([])
        setParticipantsRoomTransfer(false)
    }

    const handleBreakoutRoomChoiceDialogClosure = () => {
        setBreakoutRoomChoiceDialogOpen(false)
    }

    const handleGroupFormsDialogClosure = () => {
        setGroupFormsDialogOpen(false)
    }

    const handleTransferClick = () => {
        setBreakoutRoomChoiceDialogOpen(true)
    }
    
    const handleTransferBreakoutRoomClick = async(roomTab) => {
        let tabIndex = 0

        roomTabs.forEach((tempTab, index) => {
            if(tempTab.id === roomTab.id)
                tabIndex = index
        })

        await socket.emit('participant-breakout-room-transfer', { tabIndex, chosenParticipants })
        handleBreakoutRoomChoiceDialogClosure()
        handleParticipantsRoomTransferDialogClosure()
    }

    const participantRoomChanged = (tabIndex) => {
        socket.disconnect()
        setTabValue(tabIndex)
        toast.info('The host has transfered you to a new room')
    }

    const handleGroupForms = (groupForms) => {
        setGroupForms(groupForms)
        setGroupFormsDialogOpen(true)
    }

    const handleSubmitFormClick = async() => {
        await socket.emit('issue-live-form', { room: roomTabs[tabValue].id, form: selectedGroupForm  }, () => {
            setGroupFormsDialogOpen(false)
            setAssignedFormHostSide(selectedGroupForm)
            setSelectedGroupForm(null)
            setFormsStatus([])
        })
    }

    const getFormStatusLabel = () => formsStatus?.length > 0 ? formsStatus?.length+' form submissions' : 'No form submissions yet...'

    return (
        <div>
            <div className={'flex items-center '+(formsStatus ? 'justify-between' : 'justify-center')}>
                {formsStatus && (<div className='w-1/12'/>)}

                <Tabs
                    value={tabValue}
                    onChange={handleChange}
                    centered
                    style={{ height: '5vh' }}
                >
                    {roomTabs.map((roomTab, index) => (
                        <Tab
                            disabled={sessionInfo.groupId?.host !== userData.id}
                            label={
                                <Badge color='secondary' badgeContent={roomTab.participants} max={99}>
                                    {roomTab.name}
                                </Badge>
                            }
                            {...a11yProps(index)}
                        />
                    ))}
                    <div className='flex justify-center items-center'>
                        <IconButton
                            color='primary'
                            title='Add breakout room'
                            disabled={sessionInfo.groupId?.host !== userData.id}
                            onClick={() => setBreakoutRoomNameDialogOpen(true)}
                        >
                            <AddCircleIcon color='primary' />
                        </IconButton>
                    </div>
                </Tabs>

                {formsStatus && (
                    <Tooltip arrow title="Number of participant form submissions">
                        <Chip
                            icon={<AdjustIcon />}
                            label={getFormStatusLabel()}
                            color='error'
                        />
                    </Tooltip>
                )}
            </div>
            {roomTabs.map((roomTab, index) => (
                <TabPanel value={tabValue} index={index}>
                    <SessionScreen
                        joinRoom={roomTab.id}
                        username={userData.name}
                        groupId={sessionInfo.groupId}
                        sessionId={sessionInfo._id}
                        sessionHostId={sessionInfo.groupId?.host}
                        setRoomTabs={setRoomTabs}
                        participantRoomChanged={participantRoomChanged}
                        handleParticipantsRoomTransfer={handleParticipantsRoomTransfer}
                        handleGroupForms={handleGroupForms}
                        assignedFormHostSide={assignedFormHostSide}
                        setAssignedFormHostSide={setAssignedFormHostSide}
                        formsStatus={formsStatus}
                        setFormsStatus={setFormsStatus}
                    />
                </TabPanel>
            ))}

            {/* New breakout room dialog */}
            <Dialog open={breakoutRoomNameDialogOpen} onClose={() => setBreakoutRoomNameDialogOpen(false)}>
                <DialogTitle>Enter breakout room name</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        autoFocus
                        margin='normal'
                        label="Enter name"
                        variant='outlined'
                        onChange={event => setTempRoomName(event.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleBreakoutRoomNameSubmittion}>
                        Create
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Move to breakout room dialog */}
            <Dialog open={participantsRoomTransfer} onClose={handleParticipantsRoomTransferDialogClosure}>
                <DialogTitle>Select participants to transfer to breakout rooms</DialogTitle>
                <DialogContent>
                    {tempParticipants?.length === 0 && (
                        <Typography variant='body1'>
                            No other participants present...
                        </Typography>
                    )}
                    <List dense>
                        {tempParticipants?.map((participant) => (
                            <ListItem
                                key={participant.userId}
                                disablePadding
                                selected={chosenParticipants.filter(tempParticipant => tempParticipant.userId === participant.userId).length > 0}
                                secondaryAction={
                                    <Checkbox
                                        edge='end'
                                        onChange={(event, checked) => setChosenParticipants(currChosenParticipants => {
                                            if(checked)
                                                currChosenParticipants.push(participant)
                                            else {
                                                currChosenParticipants = currChosenParticipants.filter(chosenPart => chosenPart.userId !== participant.userId)
                                            }
                                            return currChosenParticipants
                                        })}
                                    />
                                }
                            >
                                <ListItemButton>
                                    <ListItemAvatar>
                                        <Avatar src={participant.profilePic} />
                                    </ListItemAvatar>

                                    <ListItemText
                                        id={participant.userId}
                                        primary={participant.username}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleParticipantsRoomTransferDialogClosure}>
                        Cancel
                    </Button>
                    <Button
                        variant='contained'
                        disabled={tempParticipants?.length === 0 && chosenParticipants.length > 0}
                        onClick={handleTransferClick}
                    >
                        Transfer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* See all breakout rooms */}
            <Dialog open={breakoutRoomChoiceDialogOpen} onClose={() => setBreakoutRoomChoiceDialogOpen(false)}>
                <DialogTitle>Choose breakout room</DialogTitle>
                <DialogContent>
                    <List dense>
                        {roomTabs
                            .filter((_, index) => index !== tabValue)
                            .map(roomTab => (
                                <ListItem disablePadding>
                                    <ListItemButton onClick={() => handleTransferBreakoutRoomClick(roomTab)}>
                                        <ListItemText primary={roomTab.name} />
                                    </ListItemButton>
                                </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleBreakoutRoomChoiceDialogClosure}>
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Group forms */}
            <Dialog
                fullWidth
                maxWidth='sm'
                open={groupFormsDialogOpen} onClose={() => setBreakoutRoomChoiceDialogOpen(false)}
            >
                <DialogTitle>Choose form to assign</DialogTitle>
                <DialogContent>
                    {groupForms.map(groupForm => (
                        <Typography
                            variant='body1'
                            className={clsx('p-2 flex justify-between items-center cursor-pointer rounded-lg', (selectedGroupForm?._id === groupForm._id ? classes.selectedFormBar : classes.formBar))}
                            onClick={() => setSelectedGroupForm(groupForm)}
                        >
                            {groupForm.formTitle}
                        </Typography>
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button className='font-bold normal-case' onClick={handleGroupFormsDialogClosure}>
                        Cancel
                    </Button>
                    <Button
                        variant='contained'
                        className='font-bold normal-case'
                        disabled={!Boolean(selectedGroupForm)}
                        onClick={handleSubmitFormClick}
                    >
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

export default VideoConference