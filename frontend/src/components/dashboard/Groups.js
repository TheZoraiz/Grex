import React, { useEffect, useState } from 'react'
import {
    Typography,
    Tabs,
    Tab,
    Box,
    CircularProgress,
} from '@mui/material'
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom'

import { setSocket } from '../slices/sessionSlice'
import { getUserGroups, nullifyRequestData, nullifyGroupRedirect } from '../slices/groupSlice'

import GroupScreen from './GroupScreen';

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
                <Box sx={{ px: 2, height: '100%' }}>
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

const Groups = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch()

    const { socket: groupSocket } = useSelector(state => state.session)
    const { userGroups, groupRedirect, fetchError } = useSelector(state => state.groups)

    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        groupSocket.disconnect()
        dispatch(setSocket(null))
        setTabValue(newValue);
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

    useEffect(() => {
        if(userGroups && groupRedirect) {
            userGroups?.forEach((group, index) => {
                if(group._id === groupRedirect) setTabValue(index)
            })
            dispatch(nullifyGroupRedirect())
        }
    }, [userGroups, groupRedirect])

    if(!userGroups)
        return (
            <CircularProgress
                className='absolute top-1/2 left-1/2'
                size={50}
                style={{ marginLeft: -25, marginTop: -25 }}
            />
        )

    if(userGroups?.length === 0)
        return (
            <Typography>
                You haven't created or joined a group
            </Typography>
        )

    return (
        <div className='flex h-full'>
            <Tabs
                orientation='vertical'
                value={tabValue}
                onChange={handleTabChange}
                sx={{ borderRight: 1, borderColor: 'divider' }}
            >
                {userGroups?.map((group, index) => (
                    <Tab
                        key={index}
                        className='normal-case'
                        label={group.name}
                        {...a11yProps(0)}
                    />
                ))}
            </Tabs>
            {userGroups?.map((group, index) => (
                <TabPanel value={tabValue} index={index} key={index}>
                    <GroupScreen group={group} />
                </TabPanel>
            ))}
        </div>
    )
}

export default Groups