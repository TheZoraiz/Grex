import React from 'react'
import PropTypes from 'prop-types';
import { Tab, Tabs, Box, Typography } from '@mui/material';
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
    const [tabValue, setTabValue] = React.useState(0)

    const handleChange = (event, newValue) => {
        setTabValue(newValue);
    }

    return (
        <div>
            <Tabs
                value={tabValue}
                onChange={handleChange}
                centered
                style={{ height: '5vh' }}
            >
                <Tab label='Main Room' {...a11yProps(0)} />
            </Tabs>
            <TabPanel value={tabValue} index={0}>
                <SessionScreen joinRoom={joinRoom} username={username} />
            </TabPanel>
        </div>
    );
}

export default VideoConference