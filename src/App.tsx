import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { makeStyles } from '@material-ui/core/styles';
import ScopedCssBaseline from '@material-ui/core/ScopedCssBaseline';


import Button from '@material-ui/core/Button';
import { AppBar, FormControl, IconButton, InputLabel, MenuItem, Select, Toolbar, Typography } from '@material-ui/core';
import '@fontsource/roboto';
import MenuIcon from "@material-ui/icons/Menu";
import NetworkSelect from './components/NetworkSelect';
import TopBar from './components/TopBar';

import { WagmiConfig, createClient, configureChains, mainnet, goerli } from 'wagmi'
import { publicProvider } from 'wagmi/providers/public'

import { BrowserRouter, Routes, Route } from "react-router-dom";


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

  // const useStyles = makeStyles((theme) => ({
  //   root: {
  //     flexGrow: 1,
  //   },
  //   menuButton: {
  //     marginRight: theme.spacing(2),
  //   },
  //   title: {
  //     flexGrow: 1,
  //   },
  // }));

  // const classes = useStyles();

  return (
    <WagmiConfig client={client}>
      <ScopedCssBaseline>
        <TopBar></TopBar>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<h1>hi</h1>}/>
            <Route path="/foo" element={<h1>bar</h1>}/>
          </Routes>
        </BrowserRouter>
      </ScopedCssBaseline>
    </WagmiConfig>
  );
}


export default App;
