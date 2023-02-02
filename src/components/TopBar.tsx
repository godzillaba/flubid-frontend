import { AppBar, Button, Toolbar } from '@material-ui/core';
import React from 'react';
import ConnectWalletButton from './ConnectWalletButton';
import NetworkSelect from './NetworkSelect';



export default function TopBar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <div style={{ flexGrow: 1 }}>
          <Button color="inherit">Explore</Button>
          <Button color="inherit">My Auctions</Button>
          <Button color="inherit">Create Auction</Button>
        </div>
        <NetworkSelect></NetworkSelect>
        <ConnectWalletButton></ConnectWalletButton>
      </Toolbar>
    </AppBar>
  );
  }

