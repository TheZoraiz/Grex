import React, { useState, useEffect } from 'react'
import {
    Typography,
    Tabs,
    Tab,
    Box,
    Button,
} from '@mui/material'
import {
    ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import PropTypes from 'prop-types';
import { makeStyles } from '@mui/styles';
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            style={{ width: '100%' }}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 2 }}>
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
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}

const useStyles = makeStyles(theme => ({
    copyToClipboard: {
        padding: 5,
        borderRadius: 5,
        border: '2px dashed gray',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
    },
}))

const GroupScreen = (props) => {
    const classes = useStyles()
    const navigate = useNavigate()

    const { userData } = useSelector(state => state.global)

    const [tabValue, setTabValue] = useState(0)

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    }

    const handleJoinCodeClick = () => {
        navigator.clipboard.writeText(props.group.joinCode)
        toast.info('Join code copied to clipboard')
    }

    return (
        <div>
            <div className='flex justify-between items-center'>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example">
                    <Tab
                        className='normal-case'
                        label='Chat'
                        {...a11yProps(0)}
                    />
                    <Tab
                        className='normal-case'
                        label='Submitted Forms'
                        {...a11yProps(1)}
                    />
                    <Tab
                        className='normal-case'
                        label='Files'
                        {...a11yProps(2)}
                    />
                </Tabs>

                {userData.id === props.group.host._id && (
                    <div className={classes.copyToClipboard} onClick={handleJoinCodeClick}>
                        <ContentCopyIcon className='mr-1' />
                        { props.group.joinCode }
                    </div>
                )}
            </div>

            <TabPanel value={tabValue} index={0}>
                <Button
                    variant='contained'
                    className='normal-case'
                    onClick={() => navigate('/credentials')}
                >
                    Navigate to Demo
                </Button>
            </TabPanel>
            <pre>
                {JSON.stringify(props.group, null, 2)}
            </pre>
        </div>
    )
}

export default GroupScreen