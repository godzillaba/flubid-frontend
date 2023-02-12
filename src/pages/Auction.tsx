import { Button, Card, Chip, Container, Grid, LinearProgress, MenuItem, Select, Stack, TextField, useTheme } from "@mui/material";
import { parseEther } from "ethers/lib/utils.js";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import FlowRateInput from "../components/FlowRateInput";

import base64Lens from "../assets/lensProfile";
import { execute, RentalAuctionByAddressDocument, RentalAuctionByAddressQuery } from "../graph/.graphclient";
import { ethers } from "ethers";
import { constants, fixIpfsUri, GenericRentalAuctionWithMetadata, getImageFromAuctionItem, getItemsFromRentalAuctionsDocument, getSymbolOfSuperToken, makeOpenSeaLink } from "../helpers";
import FlowRateDisplay from "../components/FlowRateDisplay";
import { ExecutionResult } from "graphql";
import { purple, red } from '@mui/material/colors';
import BidBar from "../components/BidBar";


export default function Auction() {
    const urlParams = useParams();

    const auctionAddress = urlParams.auctionAddress;
    console.log(auctionAddress)

    const theme = useTheme();
    const cardStyle = {
        padding: theme.spacing(2),
    };

    const [genericRentalAuction, setGenericRentalAuction] = React.useState<GenericRentalAuctionWithMetadata | null>(null);
    const [image, setImage] = React.useState("");

    useEffect(() => {
        if (auctionAddress === undefined) return;
        execute(RentalAuctionByAddressDocument, { address: auctionAddress }).then((result: ExecutionResult<RentalAuctionByAddressQuery>) => {
            console.log(result);
            getItemsFromRentalAuctionsDocument(result.data).then(auctions => {
                if (!auctions || !auctions[0]) return;
                setGenericRentalAuction(auctions[0]);
                getImageFromAuctionItem(auctions[0]).then(setImage);
            });
        });
    }, []);

    const [userFlowRate, setUserFlowRate] = React.useState<number>(0);

    if (!genericRentalAuction) {
        return (<>hi</>);
    }
    const auctionTypeReadable = constants.auctionTypesReadable[genericRentalAuction?.type];
    
    const currencySymbol = getSymbolOfSuperToken("polygonMumbai", genericRentalAuction.acceptedToken);


    return (
        <Container style={{ marginTop: theme.spacing(2) }}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <img src={fixIpfsUri(image)} style={{ width: "100%" }} />
                </Grid>
                <Grid item xs={6}>
                    <Card variant="outlined" style={cardStyle}>
                        <h1 style={{ marginTop: 0 }}>{genericRentalAuction.controllerObserver.underlyingTokenName} #{genericRentalAuction.controllerObserver.underlyingTokenID}</h1>
                        <sub>
                            <a href={makeOpenSeaLink(genericRentalAuction.controllerObserver.underlyingTokenContract, genericRentalAuction.controllerObserver.underlyingTokenID)}>View on OpenSea</a>
                        </sub>
                        {/* <h2 style={{ marginTop: 0 }}>Auction Information</h2> */}
                        <p>Currency: {currencySymbol}</p>
                        <p>Auction Type: {auctionTypeReadable}</p>

                        <p>Current Phase: TODO (Bidding, Renting, Paused)</p>

                        <p><FlowRateDisplay flowRate={genericRentalAuction.topBid / 1e18} currency={currencySymbol}/></p>
                        <p>Current Renter: {genericRentalAuction.currentRenter}</p>


                        {/* <p>Bidding End Time: {new Date().toLocaleString()} (3 hours)</p>

                        <p>Minimum Rental Time: 1 day</p>
                        <p>Maximum Rental Time: 7 days</p>

                        <p>
                            EnglishRentalAuction: <br />
                            0x6b175474e89094c44da98b954eedeac495271d0f
                        </p>
                        <p>
                            ERC4907ControllerObserver: <br />
                            0x6b175474e89094c44da98b954eedeac495271d0f
                        </p>
                        <ul>
                            <li>
                                ERC4907 Address: <br />
                                0x6b175474e89094c44da98b954eedeac495271d0f
                            </li>
                        </ul> */}
                    </Card>
                </Grid>
                <Grid item xs={12}>
                    <BidBar bids={[250, 100, 150, 175, 200]} currentBid={userFlowRate}/>
                </Grid>
                <Grid item xs={12}>
                    <Card variant="outlined" style={cardStyle}>
                        <h2 style={{ marginTop: 0 }}>Place Bid</h2>
                        <p>DAI Balance: 1,405.938442</p>
                        <p>DAIx Balance: 784.29838</p>
                        <FlowRateInput displayCurrency="DAI" onChange={setUserFlowRate}/>
                        <br />
                        <Button fullWidth variant="outlined">
                            Bid
                        </Button>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}
