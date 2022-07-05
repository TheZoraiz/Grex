import React, { useEffect, useRef, useState } from 'react'
import {
    Typography,
    Tabs,
    Tab,
    Box,
    Button,
    useTheme,
    Grid,
    ListItem,
    ListItemButton,
    ListItemText,
    List,
    ListItemIcon,
} from '@mui/material'
import { Circle as CircleIcon } from '@mui/icons-material'
import { makeStyles } from '@mui/styles'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import PSPDFKit from 'pspdfkit'

import { getDashboardData } from '../slices/dashboardSlice'
import { setFormRedirect, setGroupRedirect } from '../slices/groupSlice'

import Groups from './Groups'
import Navbar from '../shared-components/Navbar'
import PDFViewer from '../shared-components/PDFViewer'

const useStyles = makeStyles(theme => ({
    bodyContainer: {
        height: '90vh',
    },
    cellContainer: {
        height: '40vh',
        padding: 10,
        marginBottom: 10,
    },
    cell: {
        padding: 10,
        height: '100%',
        borderRadius: 10,
        overflowY: 'scroll',
        backgroundColor: theme.palette.background.darker
    },
}))

function TabPanel(props) {
    const theme = useTheme()
    const { children, value, index, ...other } = props

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
                <Box sx={{ px: 1, height: '100%' }} color={theme.typography.allVariants.color}>
                    {children}
                </Box>
            )}
        </div>
    )
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
}

function a11yProps(index) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    }
}

const Dashboard = () => {
    const classes = useStyles()
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const pdfRef = useRef(null)

    const [tabValue, setTabValue] = useState(0)

    const { serverMsg, userData, error: authError } = useSelector(state => state.global)
    const { groups, groupForms, liveSessions } = useSelector(state => state.dashboard)

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue)
    }

    useEffect(() => {
        if(!authError)
            dispatch(getDashboardData())
    }, [])

    if (authError)
        return (<Navigate to='/' />)

    return (
        <div>
            <Navbar />

            <div className={clsx('flex overflow-hidden', classes.bodyContainer)}>
                <Tabs
                    orientation='vertical'
                    value={tabValue}
                    onChange={handleTabChange}
                    sx={{ borderRight: 1, borderColor: 'divider' }}
                >
                    <Tab label='Dashboard' {...a11yProps(0)} />
                    <Tab label='Groups' {...a11yProps(1)} />
                </Tabs>
                <TabPanel value={tabValue} index={0} className='overflow-y-scroll'> 
                    <Grid container>
                        <Grid className={classes.cellContainer} item xs={12} md={6}>
                            <div className={classes.cell}>
                                <Typography variant='h4' className='mb-2 font-bold'>
                                    Groups
                                </Typography>
                                {groups?.length === 0 && (
                                    <Typography variant='body1'>
                                        No groups joined...
                                    </Typography>
                                )}

                                <List dense>
                                    {groups?.map(group => (
                                        <ListItem disablePadding>
                                            <ListItemButton onClick={() => {
                                                dispatch(setGroupRedirect(group._id))
                                                setTabValue(1)
                                            }}>
                                                <ListItemText primary={group.name + (userData.id === group.host._id ? ' (Owner)' : ` (${group.host.name})`)} />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </div>
                        </Grid>
                        <Grid className={classes.cellContainer} item xs={12} md={6}>
                            <div className={classes.cell}>
                                <Typography variant='h4' className='mb-2 font-bold'>
                                    Group Forms
                                </Typography>
                                {groupForms?.length === 0 && (
                                    <Typography variant='body1'>
                                        No group forms...
                                    </Typography>
                                )}

                                <List dense>
                                    {groupForms?.map(form => (
                                        <ListItem disablePadding>
                                            <ListItemButton onClick={() => {
                                                dispatch(setGroupRedirect(form.groupId?._id))
                                                dispatch(setFormRedirect(form._id))
                                                setTabValue(1)
                                            }}>
                                                <ListItemText primary={form.formTitle + ' - ' + form.groupId?.name} />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </div>
                        </Grid>
                        <Grid className={classes.cellContainer} item xs={12}>
                            <div className={classes.cell}>
                                <Typography variant='h4' className='mb-2 font-bold'>
                                    Live Sessions
                                </Typography>
                                {liveSessions?.length === 0 && (
                                    <Typography variant='body1'>
                                        No sessions being held...
                                    </Typography>
                                )}

                                <List dense>
                                    {liveSessions?.map(session => (
                                        <ListItem disablePadding>
                                            <ListItemButton onClick={() => {
                                                dispatch(setGroupRedirect(session.groupId._id))
                                                setTabValue(1)
                                            }}>
                                                <ListItemIcon>
                                                    <CircleIcon color='error' />
                                                </ListItemIcon>
                                                <ListItemText primary={session.groupId.name} />
                                            </ListItemButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </div>
                        </Grid>
                    </Grid>

                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                    <Groups />
                </TabPanel>
            </div>
        </div>
    )
}

export default Dashboard