import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { makeStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import { AppBar, FormControl, IconButton, InputLabel, MenuItem, Select, Toolbar, Typography } from '@material-ui/core';
import '@fontsource/roboto';
import MenuIcon from "@material-ui/icons/Menu";
import NetworkSelect from './components/NetworkSelect';



function App() {

  const useStyles = makeStyles((theme) => ({
    root: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
  }));

  const classes = useStyles();

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <div style={{ flexGrow: 1 }}>
            <Button color="inherit">Explore</Button>
            <Button color="inherit">My Auctions</Button>
            <Button color="inherit">Create Auction</Button>
          </div>
          <NetworkSelect></NetworkSelect>
          <Button color="inherit">Connect Wallet</Button>
        </Toolbar>
      </AppBar>
    </div>
  );
}


export default App;
