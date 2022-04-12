import React, { useState } from 'react'
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
import { useSelector } from 'react-redux'

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
    const { username, joinRoom } = useSelector(state => state.user)
    const [tabValue, setTabValue] = useState(0)

    const [breakoutRoomNameDialogOpen, setBreakoutRoomNameDialogOpen] = useState(false)
    const [tempRoomName, setTempRoomName] = useState('')
    const [roomTabs, setRoomTabs] = useState([{
        label: 'Main Room',
        name: joinRoom,
        participants: 0,
    }])

    const handleChange = (event, newValue) => {
        setTabValue(newValue);
    }

    const handleBreakoutRoomNameSubmittion = () => {
        setRoomTabs([
            ...roomTabs,
            {
                label: tempRoomName,
                name: tempRoomName,
                participants: 0,
            }
        ])
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
                                {roomTab.label}
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