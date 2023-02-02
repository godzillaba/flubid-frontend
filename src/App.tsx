import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { makeStyles } from '@material-ui/core/styles';

import Button from '@material-ui/core/Button';
import { AppBar, FormControl, IconButton, InputLabel, MenuItem, Select, Toolbar, Typography } from '@material-ui/core';
import '@fontsource/roboto';
import MenuIcon from "@material-ui/icons/Menu";
import NetworkSelect from './components/NetworkSelect';
import TopBar from './components/TopBar';

import { WagmiConfig, createClient, configureChains, mainnet, goerli } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'

const { chains, provider, webSocketProvider } = configureChains(
 [mainnet, goerli],
 [publicProvider()],
)

const client = createClient({
 autoConnect: true,
 provider,
 webSocketProvider,
})


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
    <WagmiConfig client={client}>
      <div className={classes.root}>
        <TopBar></TopBar>
      </div>
    </WagmiConfig>
  );
}


export default App;
