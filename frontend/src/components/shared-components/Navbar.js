import React, { useEffect, useRef, useState } from 'react'
import {
    Typography,
    IconButton,
    Avatar,
    Tooltip,
    Menu,
    MenuItem,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import {
    AddCircle as AddCircleIcon,
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import clsx from 'clsx'
import dayjs from 'dayjs'
import advancedFormat from 'dayjs/plugin/advancedFormat'

import { logout, nullifyLogoutData } from '../globalSlice'
import {
    joinGroup,
    createGroup,
    getUserGroups,
    nullifyRequestData as nullifyGroupRequestData,
} from '../slices/groupSlice'
import { uploadProfPic } from '../slices/userSlice'

dayjs.extend(advancedFormat)

const useStyles = makeStyles(theme => ({
    navbarContainer: {
        height: '10vh',
    }
}))


const Navbar = () => {
    const classes = useStyles()
    const dispatch = useDispatch()

    const profPicInput = useRef(null)

    const { userData, logoutMsg, error: logoutError } = useSelector(state => state.global)
    const { responseMsg: groupMsg, error: groupError } = useSelector(state => state.groups)

    const [anchorEl, setAnchorEl] = useState(null)

    const [groupMenuToggle, setGroupMenuToggle] = useState(false)
    const [profileMenuToggle, setProfileMenuToggle] = useState(false)

    const [groupName, setGroupName] = useState('')
    const [groupCode, setGroupCode] = useState('')
    const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false)
    const [joinGroupDialogOpen, setJoinGroupDialogOpen] = useState(false)
    const [openProfileDialog, setOpenProfileDialog] = useState(false)
    
    const handleMenuClosure = () => {
        setAnchorEl(null)
        setGroupMenuToggle(false)
        setProfileMenuToggle(false)
        setOpenProfileDialog(false)
    }

    const handleProfileClick = (e) => {
        setAnchorEl(e.currentTarget)
        setProfileMenuToggle(true)
    }

    const handleGroupToggle = (e) => {
        setAnchorEl(e.currentTarget)
        setGroupMenuToggle(true)
    }

    const handleLogout = () => {
        handleMenuClosure()
        dispatch(logout())
        toast.loading('Logging out...', { toastId: 'logout' })
    }

    const handleDialogClosure = () => {
        setCreateGroupDialogOpen(false)
        setJoinGroupDialogOpen(false)
    }

    const handleCreateGroup = () => {
        if (groupName === '') {
            toast.error('You need to name your group')
            return
        }

        handleDialogClosure()
        handleMenuClosure()

        dispatch(createGroup(groupName))
        toast.loading('Creating group...', { toastId: 'group-create' })
        setGroupName('')
    }

    const handleJoinGroup = () => {
        if (groupCode === '') {
            toast.error('You to enter your group\'s code to join')
            return
        }

        handleDialogClosure()
        handleMenuClosure()

        dispatch(joinGroup(groupCode))
        toast.loading('Joining group...', { toastId: 'group-join' })
        setGroupCode('')
    }

    const handleMenuProfileClick = () => {
        setOpenProfileDialog(true)
    }

    const handleUploadChange = (e) => {
        e.preventDefault()
        e.stopPropagation()

		const profPicFile = e.target.files[0]
		if (profPicFile) {
            let formData = new FormData()
            formData.append('profPicFile', profPicFile)
            dispatch(uploadProfPic(formData))
		}

        e.target.value = null;
    }

    useEffect(() => {
        if (logoutMsg) {
            toast.update('logout', { render: logoutMsg, type: 'success', isLoading: false, autoClose: 5000 })
            dispatch(nullifyLogoutData())
            window.open('/', '_self')
            return
        }

        if (logoutError) {
            toast.update('logout', { render: logoutMsg, type: 'error', isLoading: false, autoClose: 5000 })
            dispatch(nullifyLogoutData())
            return
        }

        if (groupMsg) {
            toast.update(
                'group-create',
                { render: groupMsg, type: 'success', isLoading: false, autoClose: 5000, draggable: true, closeOnClick: true }
            )
            toast.update(
                'group-join',
                { render: groupMsg, type: 'success', isLoading: false, autoClose: 5000, draggable: true, closeOnClick: true }
            )
            dispatch(getUserGroups())
            dispatch(nullifyGroupRequestData())
            return
        }

        if (groupError) {
            toast.update(
                'group-create',
                { render: groupError, type: 'error', isLoading: false, autoClose: 5000, draggable: true, closeOnClick: true }
            )
            toast.update(
                'group-join',
                { render: groupError, type: 'error', isLoading: false, autoClose: 5000, draggable: true, closeOnClick: true }
            )
            dispatch(nullifyGroupRequestData())
            return
        }
    }, [logoutMsg, logoutError, groupMsg, groupError])

    console.log('userData', userData)

    return (
        <div className={clsx('w-full px-5 flex items-center justify-between', classes.navbarContainer)}>
            {/* Left portion */}
            <div>
                <Typography variant='h4' className='font-bold'>
                    Grex
                </Typography>
            </div>

            {/* Right portion */}
            <div className='flex items-center'>
                <Tooltip
                    arrow
                    placement='bottom'
                    title='Create or join a group'
                >
                    <IconButton
                        className='mr-1'
                        onClick={handleGroupToggle}
                    >
                        <AddCircleIcon />
                    </IconButton>
                </Tooltip>
                <Menu
                    anchorEl={anchorEl}
                    open={groupMenuToggle}
                    onClose={handleMenuClosure}
                >
                    <MenuItem onClick={() => setCreateGroupDialogOpen(true)}>Create Group</MenuItem>
                    <MenuItem onClick={() => setJoinGroupDialogOpen(true)}>Join Group</MenuItem>
                </Menu>

                <IconButton
                    title='View Profile'
                    onClick={handleProfileClick}
                >
                    <Avatar src={process.env.REACT_APP_BACKEND_URI + '/' + userData.profPicPath} />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={profileMenuToggle}
                    onClose={handleMenuClosure}
                >
                    <MenuItem onClick={handleMenuProfileClick}>Profile</MenuItem>
                    <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
            </div>

            {/* Group creation dialog */}
            <Dialog open={createGroupDialogOpen} onClose={handleDialogClosure}>
                <DialogTitle>Enter group name</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        autoFocus
                        margin='normal'
                        label="Enter name of your group"
                        variant='outlined'
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateGroup}>
                        Create Group
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Group joining dialog */}
            <Dialog open={joinGroupDialogOpen} onClose={handleDialogClosure}>
                <DialogTitle>Enter group code</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        autoFocus
                        margin='normal'
                        label="Enter the group code to join"
                        variant='outlined'
                        value={groupCode}
                        onChange={e => setGroupCode(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleJoinGroup}>
                        Join Group
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Profile dialog */}
            <Dialog
                fullWidth
                maxWidth='xs'
                open={openProfileDialog}
                onClose={handleMenuClosure}
            >
                <DialogTitle>{ userData.name }</DialogTitle>
                <DialogContent>
                    <input
                        accept='image/*'
                        className='hidden'
                        id='button-file'
                        type='file'
                        ref={profPicInput}
                        onChange={handleUploadChange}
                    />
                    <Tooltip arrow title='Click to change profile pic'>
                        <Avatar
                            className='mx-auto cursor-pointer'
                            alt={userData.name}
                            src={process.env.REACT_APP_BACKEND_URI + '/' + userData.profPicPath}
                            sx={{ width: 250, height: 250 }}
                            onClick={() => profPicInput.current.click()}
                        />
                    </Tooltip>

                    <Grid container rowSpacing={1} className='mt-5'>
                        <Grid item xs={6}>
                            <Typography variant='body1' className='font-bold'>
                                Name:
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant='body1'>
                                {userData.name}
                            </Typography>
                        </Grid>


                        <Grid item xs={6}>
                            <Typography variant='body1' className='font-bold'>
                                Email:
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant='body1'>
                                {userData.email}
                            </Typography>
                        </Grid>


                        <Grid item xs={6}>
                            <Typography variant='body1' className='font-bold'>
                                Email Verification Date:
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant='body1'>
                                {dayjs(userData.emailVerifiedAt).format('hh:mma - Do MMM, YYYY')}
                            </Typography>
                        </Grid>


                        <Grid item xs={6}>
                            <Typography variant='body1' className='font-bold'>
                                Account Created At:
                            </Typography>
                        </Grid>
                        <Grid item xs={6}>
                            <Typography variant='body1'>
                                {dayjs(userData.createdAt).format('hh:mma - Do MMM, YYYY')}
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleMenuClosure}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}

export default Navbar