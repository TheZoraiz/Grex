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
} from '@mui/material';
import {
    AddCircle as AddCircleIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux'
import { v4 as uuidv4 } from 'uuid'
import { setSocket } from '../slices/sessionSlice'

import SessionScreen from './SessionScreen'

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
    const dispatch = useDispatch()
    const { socket } = useSelector(state => state.session)
    const { username, roomName } = useSelector(state => state.credentials)
    const [tabValue, setTabValue] = useState(0)

    const [breakoutRoomNameDialogOpen, setBreakoutRoomNameDialogOpen] = useState(false)
    const [tempRoomName, setTempRoomName] = useState('')
    const [roomTabs, setRoomTabs] = useState([{
        id: uuidv4(),
        name: 'Main Room',
        participants: 0,
    }])

    const handleChange = (event, newValue) => {
        socket.disconnect()
        setTabValue(newValue);
    }

    const handleBreakoutRoomNameSubmittion = () => {
        for(let i = 0; i < roomTabs.length; i++) {
            if(tempRoomName === roomTabs[i].name) {
                alert(`${tempRoomName} already exists`)
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

    return (
        <div>
            <Tabs
                value={tabValue}
                onChange={handleChange}
                centered
                style={{ height: '5vh' }}
            >
                {roomTabs.map((roomTab, index) => (
                    <Tab
                        label={
                            <Badge color="secondary" badgeContent={roomTab.participants} max={99}>
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
                        onClick={() => setBreakoutRoomNameDialogOpen(true)}
                    >
                        <AddCircleIcon color='primary' />
                    </IconButton>
                </div>
            </Tabs>
            {roomTabs.map((roomTab, index) => (
                <TabPanel value={tabValue} index={index}>
                    <SessionScreen
                        // IMPORTANT: Needs to be changed to roomTab.id with system development later
                        joinRoom={roomTab.name}
                        username={username}
                        setRoomTabs={setRoomTabs}
                    />
                </TabPanel>
            ))}
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
        </div>
    );
}

export default VideoConference