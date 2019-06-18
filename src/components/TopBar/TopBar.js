import React, { useEffect, useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import SettingsIcon from '@material-ui/icons/MoreVert'
import MenuIcon from '@material-ui/icons/Menu'
import Check from '@material-ui/icons/Check'
import Close from '@material-ui/icons/Close'
import { DeleteItemDialog } from './DeleteItemDialog'
import { authenticateUser } from '../../utils/dropbox-files'
import { set } from 'idb-keyval'

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
    marginBottom: '5px',
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}))

export const TopBar = ({
  sideBarVisible,
  setSideBarVisible,
  selectedRow,
  mode,
  setMode,
  setShouldSubmit,
  text,
}) => {
  const [anchorEl, setAnchorEl] = useState(null)

  const handleClick = event => setAnchorEl(event.currentTarget)

  const handleClose = () => setAnchorEl(null)

  const classes = useStyles()

  useEffect(() => {
    setShouldSubmit()
  })

  return (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static">
        <Toolbar>
          <IconButton
            onClick={() => setSideBarVisible(!sideBarVisible)}
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="Menu"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            {selectedRow}
          </Typography>
          {(mode.type === 'Add' || mode.type === 'Edit') && (
            <React.Fragment>
              <Check
                style={{ marginRight: '1rem' }}
                color="inherit"
                onClick={() => setShouldSubmit('SaveChanges')}
              />
              <Close
                style={{ marginRight: '1rem' }}
                color="inherit"
                onClick={() => setShouldSubmit('CancelChanges')}
              />
            </React.Fragment>
          )}

          {mode.type === 'Move' && (
            <React.Fragment>
              <Check
                style={{ marginRight: '1rem' }}
                color="inherit"
                onClick={() => {
                  set(selectedRow, text)
                  setMode({ type: 'View' })
                }}
              />
              <Close
                style={{ marginRight: '1rem' }}
                color="inherit"
                onClick={() => setMode({ type: 'View' })}
              />
            </React.Fragment>
          )}
          <SettingsIcon color="inherit" onClick={handleClick} />
          <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>
              <div onClick={authenticateUser}>Link To Dropbox</div>
            </MenuItem>

            <MenuItem onClick={handleClose}>
              <div onClick={() => setMode({ type: 'Move' })}>Move Items</div>
            </MenuItem>

            {mode.type === 'Edit' && (
              <MenuItem onClick={handleClose}>
                <DeleteItemDialog
                  clickHandler={() => setShouldSubmit('Delete')}
                >
                  Delete Item
                </DeleteItemDialog>
              </MenuItem>
            )}
          </Menu>
        </Toolbar>
      </AppBar>
    </div>
  )
}