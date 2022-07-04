import React, { useEffect, useState } from 'react'
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Typography,
    CircularProgress,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Grid,
} from '@mui/material'
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material'
import { makeStyles } from '@mui/styles'
import { useSelector, useDispatch } from 'react-redux'
import clsx from 'clsx'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'

import { getSessionAttendances } from '../slices/sessionSlice'

import FormBuilder from '../shared-components/FormBuilder'
import FormViewer from '../shared-components/FormViewer'
import { green } from '@mui/material/colors'

dayjs.extend(advancedFormat)

const useStyles = makeStyles(theme => ({
    groupFormBar: {
        borderRadius: 5,
    }
}))

const Attendances = (props) => {
    const classes = useStyles()
    const dispatch = useDispatch()
    
    const [attendanceToView, setAttendanceToView] = useState(null)
    const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(null)

    const { userData } = useSelector(state => state.global)
    const { sessionAttendances } = useSelector(state => state.session)

    const handleDialogsClosure = () => {
        setAttendanceDialogOpen(false)
    }

    const handleAttendanceClick = (attendance) => {
        setAttendanceToView(attendance)
        setAttendanceDialogOpen(true)
    }

    useEffect(() => {
        dispatch(getSessionAttendances(props.group._id))
        return () => handleDialogsClosure()
    }, [])

    return (
        <>
            {sessionAttendances?.length === 0 && (
                <Typography variant='body1'>
                    No session attendance marked yet...
                </Typography>
            )}

            {sessionAttendances?.map(attendance => (
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={() => handleAttendanceClick(attendance)}
                        className={clsx('p-3 mt-2 flex items-center justify-between', classes.groupFormBar)}
                    >
                        <Typography>
                            {attendance.title} ... {dayjs(attendance.createdAt).format('hh:mma - Do MMM, YYYY')}
                        </Typography>

                        <IconButton title='View submissions'>
                            <VisibilityIcon />
                        </IconButton>
                    </ListItemButton>
                </ListItem>
            ))}

            <Dialog
                fullWidth
                maxWidth='md'
                open={attendanceDialogOpen}
                onClose={handleDialogsClosure}
            >
                <DialogTitle>
                    <Typography variant='h4' className='font-bold'>
                        {attendanceToView?.title}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant='h6' color={green[400]}>
                        Present Participants:
                    </Typography>
                    <Grid container>
                        {attendanceToView?.present.map(user => (
                            <>
                                <Grid item xs={5} className='pl-3'>
                                    <Typography>
                                        {user.name} { userData.id === user._id ? '(Host)' : '' }
                                    </Typography>
                                </Grid>
                                <Grid item xs={5} className='pr-3'>
                                    <Typography >
                                        {user.email}
                                    </Typography>
                                </Grid>
                                <br />
                            </>
                        ))}
                    </Grid>

                    <Typography variant='h6' color='error' className='mt-5'>
                        Absent Participants:
                    </Typography>
                    <Grid container>
                        {attendanceToView?.absent.map(user => (
                            <>
                                <Grid item xs={5} className='pl-3'>
                                    <Typography>
                                        {user.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={5} className='pr-3'>
                                    <Typography >
                                        {user.email}
                                    </Typography>
                                </Grid>
                                <br />
                            </>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions className='flex justify-end'>
                    <Button
                        className='normal-case mr-2'
                        onClick={handleDialogsClosure}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}

export default Attendances