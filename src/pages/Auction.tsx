import { Button, Card, Chip, Container, Grid, MenuItem, Select, Stack, TextField, useTheme } from '@mui/material';
import { parseEther } from 'ethers/lib/utils.js';
import React from 'react';
import { useParams } from 'react-router-dom';
import FlowRateInput from '../components/FlowRateInput';

import base64Lens from "../assets/lensProfile";


export default function Auction(props: any) {
    const urlParams = useParams();

    // TODO: Fetch auction data from the API
    const theme = useTheme();
    const cardStyle = {
        padding: theme.spacing(2)
    };

    return (
        <Container style={{marginTop: theme.spacing(2)}}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <img src={base64Lens} style={{width: '100%'}}/>
                </Grid>
                <Grid item xs={6}>
                    <Card variant='outlined' style={cardStyle}>
                        <h1 style={{marginTop: 0}}>Lens Protocol Profile #1234</h1>
                        <sub><a href="https://opensea.com">View on OpenSea</a></sub>
                        {/* <h2 style={{ marginTop: 0 }}>Auction Information</h2> */}
                        <p>Currency: DAI</p>

                        <p>Current Phase: Bidding</p>

                        <p>Top Bid: 10 DAI / day</p>
                        <p>Bidding End Time: {new Date().toLocaleString()} (3 hours)</p>

                        <p>Minimum Rental Time: 1 day</p>
                        <p>Maximum Rental Time: 7 days</p>

                        <p>EnglishRentalAuction: <br />0x6b175474e89094c44da98b954eedeac495271d0f</p>
                        <p>ERC4907ControllerObserver: <br />0x6b175474e89094c44da98b954eedeac495271d0f</p>
                        <ul>
                            <li>ERC4907 Address: <br />0x6b175474e89094c44da98b954eedeac495271d0f</li>
                        </ul>
                    </Card>
                </Grid>
                <Grid item xs={12}>
                    <Card variant="outlined" style={cardStyle}>
                        <h2 style={{ marginTop: 0 }}>Place Bid</h2>
                        <p>DAI Balance: 1,405.938442</p>
                        <p>DAIx Balance: 784.29838</p>
                        <FlowRateInput displayCurrency="DAI" />
                        <br />
                        <Button fullWidth variant='outlined'>Bid</Button>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}

