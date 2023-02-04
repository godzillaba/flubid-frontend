import React, { useEffect } from 'react';

import { Button, Card, CircularProgress, Divider, Grid, TextField } from '@material-ui/core';
import { useTheme } from '@material-ui/core';


import {execute, TestQueryDocument, TestQueryQuery} from "../graph/.graphclient";

function AuctionInfoCard() {
  const titleStyle = {
    cursor: "pointer"
  };

  const theme = useTheme();

  return (
    <Card style={{paddingLeft: theme.spacing(2)}}>
      <h2 onClick={() => {}} style={titleStyle}>Auction Title</h2>
      <h4>Type: English/Traditional</h4>
      <h4>Active: Yes</h4>
      <h4>Currency: DAI</h4>
      <h4>Top Bid: 15 DAI / day</h4>
      <h4>Current Rental Start: {new Date().toLocaleString()}</h4>
      <h4>Current Rental End: {new Date().toLocaleString()}</h4>
    </Card>
  )
}

export default function Explore() {
  const [data, setData] = React.useState<TestQueryQuery>();

  useEffect(() => {
    execute(TestQueryDocument, {a: 1}).then((result) => {
      setData(result?.data)
    })
  }, [setData])

  const theme = useTheme();

  if (!data) return <CircularProgress />

  return (
    <>
      <h1>Explore Auctions</h1>
      <div style={{marginBottom: theme.spacing(4)}}>
        <Grid container spacing={0}>
          <Grid item xs={2}></Grid>
          <Grid item xs={8}>
            <TextField fullWidth id="outlined-basic" label="Search by title or address" variant="outlined" />
          </Grid>
        </Grid>
      </div>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <AuctionInfoCard></AuctionInfoCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <AuctionInfoCard></AuctionInfoCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <AuctionInfoCard></AuctionInfoCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <AuctionInfoCard></AuctionInfoCard>
        </Grid>
      </Grid>
    </>
  );
}

