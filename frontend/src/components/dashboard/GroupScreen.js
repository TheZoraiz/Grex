import React, { useState, useEffect } from 'react'
import {
    Typography,
    Tabs,
    Tab,
    Box,
    Button,
    TextField,
    Tooltip,
    InputAdornment,
    IconButton,
} from '@mui/material'
import {
    ContentCopy as ContentCopyIcon,
    Send as SendIcon,
    VideoCall as VideoCallIcon,
    SettingsInputAntenna as SettingsInputAntennaIcon,
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { makeStyles } from '@mui/styles';
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify';
import { io } from 'socket.io-client'
import clsx from 'clsx';

import GroupMessage from './GroupMessage';

import { setSocket, setSessionInfo } from '../slices/sessionSlice'
import GroupForms from './GroupForms';

const useStyles = makeStyles(theme => ({
    copyToClipboard: {
        padding: 5,
        borderRadius: 5,
        border: '2px dashed gray',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
    },
    bodyPartOne: {
        height: '10%'
    },
    bodyPartTwo: {
        height: '90%'
    },
}))

function TabPanel(props) {
    const classes = useStyles()
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            className={classes.bodyPartTwo}
            style={{ width: '100%' }}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 2, height: '100%' }}>
                    {children}
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
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}

const GroupScreen = (props) => {
    const classes = useStyles()
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const { userData } = useSelector(state => state.global)
    const { socket: groupSocket } = useSelector(state => state.session)

    const [message, setMessage] = useState('')
    const [ongoingSession, setOngoingSession] = useState(null)
    const [groupMessages, setGroupMessages] = useState(null)
    const [groupSessions, setGroupSessions] = useState(null)

    const [tabValue, setTabValue] = useState(0)

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    }

    const handleJoinCodeClick = () => {
        navigator.clipboard.writeText(props.group.joinCode)
        toast.info('Join code copied to clipboard')
    }

    const handleSendGroupMessage = () => {
        if(groupSocket && message) {
            groupSocket.emit('send-group-message', {
                userId: userData.id,
                groupId: props.group._id,
                message
            })
            setMessage('')
        }
    }

    const getOngoingSession = (groupSessions) => {
        for(let i = 0; i < groupSessions.length; i++)
            if(groupSessions[i].status === 'ongoing') {
                setOngoingSession(groupSessions[i])
                toast.info('There is an ongoing session. Please join')
                return
            }
        setOngoingSession(null)
    }

    const handleStartSession = () => {
        groupSocket.emit('start-group-session', props.group._id, (newSession) => {
            setOngoingSession(newSession)
            dispatch(setSessionInfo(newSession))
            dispatch(setSocket(null))
            navigate('/conference')
        })
    }

    const handleJoinSession = () => {
        dispatch(setSessionInfo(ongoingSession))
        dispatch(setSocket(null))
        navigate('/conference')
    }

    useEffect(() => {
        if(groupMessages?.length > 0) {
            let messagesContainer = document.getElementById('messages-container');
            messagesContainer.scrollTop = messagesContainer?.scrollHeight;
        }
    }, [groupMessages])

    useEffect(() => {
        dispatch(setSocket(io(process.env.REACT_APP_BACKEND_URI)))

        return () => {
            dispatch(setSocket(null))
        }
    }, [])

    useEffect(async() => {
        if(groupSocket) {
            groupSocket.on('connected', ({ socketId }) => {
                console.log('Local socket id:', socketId)
            })
            groupSocket.on('new-group-message', (newGroupMessages) => {
                setGroupMessages(newGroupMessages)
            })
            groupSocket.on('new-group-session-started', (newSession) => {
                setOngoingSession(newSession);
                toast.info(`${props.group.host.name} just started a new session`)
            })
            groupSocket.on('new-session-data', (newSessionData) => {
                setGroupSessions(newSessionData)
                getOngoingSession(newSessionData)

                if(userData.id !== props.group.host._id)
                    toast.info('The group\'s current session just ended')
            })

            groupSocket.emit('get-group-data', props.group._id, ({ groupMessages, groupSessions }) => {
                setGroupMessages(groupMessages)
                setGroupSessions(groupSessions)
                getOngoingSession(groupSessions)
            })
        }
    }, [groupSocket])

    return (
        <div className='h-full'>
            <div className={clsx('flex justify-between items-center', classes.bodyPartOne)}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example">
                    <Tab
                        className='normal-case'
                        label='Chat'
                        {...a11yProps(0)}
                    />
                    <Tab
                        className='normal-case'
                        label='Forms'
                        {...a11yProps(1)}
                    />
                </Tabs>

                <div className='flex items-center'>
                    {ongoingSession && (
                        <Button
                            className='normal-case'
                            variant='contained'
                            onClick={handleJoinSession}
                            startIcon={<SettingsInputAntennaIcon />}
                        >
                            Join Session
                        </Button>
                    )}
                    {!ongoingSession && userData.id === props.group.host._id && (
                        <Button
                            className='normal-case'
                            variant='contained'
                            onClick={handleStartSession}
                            startIcon={<VideoCallIcon />}
                        >
                            Start Session
                        </Button>
                    )}
                    {userData.id === props.group.host._id && (
                        <Tooltip title='Group join code' className='ml-2' arrow>
                            <div className={classes.copyToClipboard} onClick={handleJoinCodeClick}>
                                <ContentCopyIcon className='mr-1' />
                                { props.group.joinCode }
                            </div>
                        </Tooltip>
                    )}
                </div>
            </div>
            
            {/* Chat */}
            <TabPanel value={tabValue} index={0}>
                <div id='messages-container' className='h-5/6 overflow-y-scroll py-1'>
                    {groupMessages?.map(message => (
                        <GroupMessage
                            senderName={message.userId?.name}
                            message={message.message}
                            messageTime={message.createdAt}
                        />
                    ))}
                    {/* <pre>
                        {JSON.stringify(groupSessions, null, 2)}
                    </pre> */}
                </div>
                
                <div className='h-1/6 flex items-center'>
                    <TextField
                        className='h-full w-full mx-2'
                        label="Enter Message"
                        multiline
                        rows={2}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end" className='mr-0.5'>
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleSendGroupMessage}
                                        onMouseDown={(event) => event.preventDefault()}
                                        edge="end"
                                    >
                                        <SendIcon fontSize='large' />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                </div>
            </TabPanel>

            {/* Submitted Forms */}
            <TabPanel value={tabValue} index={1}>
                <GroupForms />
            </TabPanel>
        </div>
    )
}

export default GroupScreen