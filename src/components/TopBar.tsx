import React from 'react';
import ConnectWalletButton from './ConnectWalletButton';
import NetworkSelect from './NetworkSelect';
import { useNavigate } from "react-router-dom";
import { AppBar, Button, Toolbar } from '@mui/material';
import { constants } from '../helpers';



export default function TopBar() {
  const navigate = useNavigate();

  return (
    <AppBar position="static">
      <Toolbar>
        <div style={{ flexGrow: 1 }}>
          <Button color="inherit" onClick={() => navigate("/")}>Explore</Button>
          <Button color="inherit" onClick={() => navigate("/my-auctions")}>My Auctions</Button>
          <Button color="inherit" onClick={() => navigate("/create-auction")}>Create Auction</Button>
          <Button color="inherit" href={constants.docsUrl}>Documentation</Button>
        </div>
        <NetworkSelect></NetworkSelect>
        <ConnectWalletButton></ConnectWalletButton>
      </Toolbar>
    </AppBar>
  );
  }

