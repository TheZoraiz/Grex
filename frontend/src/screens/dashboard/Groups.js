import React, { useEffect, useState } from 'react'
import {
    Typography,
    Tabs,
    Tab,
    Box,
    Button,
} from '@mui/material'
import { styled } from '@mui/styles'
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'

import { getUserGroups, nullifyRequestData } from '../slices/groupSlice'

import GroupScreen from './GroupScreen';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ px: 2 }}>
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

const Groups = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch()

    const { userGroups, fetchError } = useSelector(state => state.groups)

    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        console.log('event', event)
        console.log('newValue', newValue)
    };

    useEffect(() => {
        dispatch(getUserGroups())
    }, [])

    useEffect(() => {
        if(fetchError) {
            toast.error(fetchError)
            dispatch(nullifyRequestData())
            return
        }
    }, [fetchError])

    if(!userGroups)
        return 'Loading...'

    console.log('userGroups', userGroups)

    return (
        <div className='flex'>
            <Tabs
                orientation='vertical'
                value={tabValue}
                onChange={handleTabChange}
                sx={{ borderRight: 1, borderColor: 'divider' }}
            >
                {userGroups?.map(group => (
                    <Tab
                        className='normal-case'
                        label={group.name}
                        {...a11yProps(0)}
                    />
                ))}
            </Tabs>
            {userGroups?.map((group, index) => (
                <TabPanel value={tabValue} index={index}>
                    <GroupScreen group={group} />
                </TabPanel>
            ))}
        </div>
    )
}

export default Groups