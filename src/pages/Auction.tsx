import { Button, Card, Chip, Grid, MenuItem, Select, Stack, TextField, useTheme } from '@mui/material';
import React from 'react';
import { useParams } from 'react-router-dom';

export default function Auction(props: any) {
    const urlParams = useParams();

    // TODO: Fetch auction data from the API
    const theme = useTheme();
    const cardStyle = {
        padding: theme.spacing(2)
    };

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <h1>English Rental Auction: Auction title</h1>
                    <h3 style={{ marginTop: 0 }}>Auction description TODO: fetch from ipfs</h3>
                </Grid>
                <Grid item xs={6}>
                    <Card variant='outlined' style={cardStyle}>
                        <h2 style={{ marginTop: 0 }}>Auction Information</h2>
                        <p>Currency: DAI</p>

                        <p>Current Phase: Bidding</p>

                        <p>Top Bid: 10 DAI / day</p>
                        <p>Bidding End Time: {new Date().toLocaleString()} (3 hours)</p>

                        <p>EnglishRentalAuction: <br />0x6b175474e89094c44da98b954eedeac495271d0f</p>
                        <p>ERC4907ControllerObserver: <br />0x6b175474e89094c44da98b954eedeac495271d0f</p>
                        <ul>
                            <li>ERC4907 Address: <br />0x6b175474e89094c44da98b954eedeac495271d0f</li>
                        </ul>
                    </Card>
                </Grid>

                <Grid item xs={6}>
                    <Card variant="outlined" style={cardStyle}>
                        <h2 style={{ marginTop: 0 }}>Place Bid</h2>
                        <p>DAI Balance: 1,405.938442</p>
                        <p>DAIx Balance: 784.29838</p>
                        <Stack
                            direction="row"
                            justifyContent="flex-start"
                            alignItems="center"
                            spacing={2}
                        >
                            <TextField id="outlined-basic" label="Flow Rate" variant="outlined" />
                            <p>/</p>
                            <Select
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                // value={age}
                                label="Age"
                                // onChange={handleChange}
                            >
                                <MenuItem value={1}>Second</MenuItem>
                                <MenuItem value={60}>Minute</MenuItem>
                                <MenuItem value={60*60}>Hour</MenuItem>
                                <MenuItem value={60*60*24}>Day</MenuItem>
                            </Select>
                            <Button variant="outlined">Place Bid</Button>
                        </Stack>
                    </Card>
                </Grid>
            </Grid>
        </>
    );
}

