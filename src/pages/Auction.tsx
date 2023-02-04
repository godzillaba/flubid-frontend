import { Button, Card, Chip, Grid, MenuItem, Select, Stack, TextField, useTheme } from '@mui/material';
import React from 'react';
import { useParams } from 'react-router-dom';
import FlowRateInput from '../components/FlowRateInput';

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
                        <FlowRateInput displayCurrency="DAI"/>
                    </Card>
                </Grid>
            </Grid>
        </>
    );
}

