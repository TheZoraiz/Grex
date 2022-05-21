import React, { useEffect, useState } from 'react'
import {
    Typography,
    Tabs,
    Tab,
    Box,
    Button,
} from '@mui/material'
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useNavigate } from 'react-router-dom'

import Groups from './Groups'
import Navbar from '../shared-components/Navbar'

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
                <Box sx={{ px: 1 }}>
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

const Dashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [tabValue, setTabValue] = useState(0);

    const { serverMsg, userData, error: authError } = useSelector(state => state.global)

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    if (authError)
        return (<Navigate to='/' />)

    return (
        <div>
            <Navbar />

            <div className='flex'>
                <Tabs
                    orientation='vertical'
                    value={tabValue}
                    onChange={handleTabChange}
                    sx={{ borderRight: 1, borderColor: 'divider' }}
                >
                    <Tab label="Dashboard" {...a11yProps(0)} />
                    <Tab label="Groups" {...a11yProps(1)} />
                </Tabs>
                <TabPanel value={tabValue} index={0}>
                    Dashboard
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                    <Groups />
                </TabPanel>
            </div>

            {/* <pre style={{ color: 'white' }}>
                { JSON.stringify(userData, null, 2) }
            </pre> */}
        </div>
    )
}

export default Dashboard