import { AppBar, Button, Toolbar } from '@material-ui/core';
import React from 'react';
import ConnectWalletButton from './ConnectWalletButton';
import NetworkSelect from './NetworkSelect';
import { useNavigate } from "react-router-dom";



export default function TopBar() {
  const navigate = useNavigate();

  return (
    <AppBar position="static">
      <Toolbar>
        <div style={{ flexGrow: 1 }}>
          <Button color="inherit" onClick={() => navigate("/")}>Explore</Button>
          <Button color="inherit" onClick={() => navigate("/my-auctions")}>My Auctions</Button>
          <Button color="inherit" onClick={() => navigate("/create-auction")}>Create Auction</Button>
        </div>
        <NetworkSelect></NetworkSelect>
        <ConnectWalletButton></ConnectWalletButton>
      </Toolbar>
    </AppBar>
  );
  }

