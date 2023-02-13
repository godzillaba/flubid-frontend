import { Button, Card, Chip, Container, Grid, LinearProgress, MenuItem, Select, Stack, TextField, useTheme } from "@mui/material";
import { AbiCoder, parseEther } from "ethers/lib/utils.js";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import FlowRateInput from "../components/FlowRateInput";

import base64Lens from "../assets/lensProfile";
import { ContinuousRentalAuctionByAddressDocument, ContinuousRentalAuctionByAddressQuery, execute, RentalAuctionByAddressDocument, RentalAuctionByAddressQuery } from "../graph/.graphclient";
import { BigNumber, ethers, Signer } from "ethers";
import { constants, fixIpfsUri, GenericRentalAuctionWithMetadata, getImageFromAuctionItem, getItemsFromRentalAuctionsDocument, getSymbolOfSuperToken, makeOpenSeaLink } from "../helpers";
import FlowRateDisplay from "../components/FlowRateDisplay";
import { ExecutionResult } from "graphql";
import { purple, red } from '@mui/material/colors';
import BidBar from "../components/BidBar";

import * as ContinuousRentalAuctionABI from "../abi/ContinuousRentalAuction.json";
import { Framework, SuperToken } from "@superfluid-finance/sdk-core";
import { useAccount, useNetwork, useProvider, useSigner } from 'wagmi'

export default function Auction() {
    const urlParams = useParams();

    const auctionAddress = urlParams.auctionAddress;
    console.log(auctionAddress)

    const theme = useTheme();
    const cardStyle = {
        padding: theme.spacing(2),
    };

    const { chain, chains } = useNetwork();
    const { address } = useAccount();
    const { data: signer, isError, isLoading } = useSigner();
    const provider = useProvider();

    const [userFlowRate, setUserFlowRate] = React.useState<number>(0);
    const [genericRentalAuction, setGenericRentalAuction] = React.useState<GenericRentalAuctionWithMetadata | null>(null);
    const [continuousRentalAuction, setContinuousRentalAuction] = React.useState<ContinuousRentalAuctionByAddressQuery["continuousRentalAuctions"][0] | null>(null);
    const [superfluid, setSuperfluid] = React.useState<Framework | null>(null);
    const [superToken, setSuperToken] = React.useState<SuperToken | null>(null);
    const [superTokenBalance, setSuperTokenBalance] = React.useState<BigNumber>(BigNumber.from(0));
    const [image, setImage] = React.useState("");

    const fetchAuctionDataAndLoadSuperfluid = React.useCallback(async () => {
        if (!auctionAddress) return;
    
        try {
            const rentalAuctionResult = await execute(RentalAuctionByAddressDocument, { address: auctionAddress });
            const auctions = await getItemsFromRentalAuctionsDocument(rentalAuctionResult.data);
            if (!auctions || !auctions[0]) return;
    
            const genericRentalAuction = auctions[0];
            setGenericRentalAuction(genericRentalAuction);
            setImage(await getImageFromAuctionItem(genericRentalAuction));
    
            if (genericRentalAuction.type === "continuous") {
                const result = await execute(ContinuousRentalAuctionByAddressDocument, { address: auctionAddress });
                setContinuousRentalAuction(result.data.continuousRentalAuctions[0]);
            } else if (genericRentalAuction.type === "english") {
                // todo
            }

            // set superfluid stuff
            const sf = await Framework.create({
                chainId: chain?.id as number,
                provider,
            });
            const superToken = await sf.loadSuperToken(genericRentalAuction.acceptedToken);

            setSuperToken(superToken);
            setSuperfluid(sf);
        }
        catch (e) {
            console.error(e);
        }
    }, [auctionAddress, chain?.id]); // todo chain change

    const fetchTokenBalances = React.useCallback(async () => {
        if (!superToken) return;
        setSuperTokenBalance(BigNumber.from(await superToken.balanceOf({ account: address as string, providerOrSigner: provider })));
    }, [address, superToken == null, chain?.id]);

    React.useEffect(() => {
        fetchAuctionDataAndLoadSuperfluid();
    }, [fetchAuctionDataAndLoadSuperfluid]);

    React.useEffect(() => {
        fetchTokenBalances();
    }, [fetchTokenBalances]);

    async function bid() {
        // todo english, assume continuous for now

        const flowOp = superToken?.createFlow({
            sender: address,
            receiver: genericRentalAuction?.address,
            flowRate: Math.round(userFlowRate * 1e18) + "",
            userData: new AbiCoder().encode(["address", "bytes"], [constants.zeroAddress, []])
        });

        await flowOp?.exec(signer as Signer);
    }

    
    
    if (!genericRentalAuction || !superfluid) {
        return (<>hi</>);
    }

    const auctionTypeReadable = constants.auctionTypesReadable[genericRentalAuction?.type];
    
    const currencySymbol = getSymbolOfSuperToken("polygonMumbai", genericRentalAuction.acceptedToken);
    const currentRenter = ethers.utils.getAddress(genericRentalAuction.currentRenter);


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
                        <p>Current Renter: {currentRenter === address ? "YOU" : currentRenter}</p>

                    </Card>
                </Grid>
                {
                    !continuousRentalAuction || genericRentalAuction.topBid == 0 ? null :
                    <Grid item xs={12}>
                        <BidBar bids={continuousRentalAuction.inboundStreams.map(s => Number(s.flowRate))} currentBid={userFlowRate * 1e18}/>
                    </Grid>
                }
                <Grid item xs={12}>
                    <Card variant="outlined" style={cardStyle}>
                        <h2 style={{ marginTop: 0 }}>Place Bid</h2>
                        <p>DAI Balance: 1,405.938442</p>
                        <p>DAIx Balance: {parseInt(superTokenBalance.toString())/1e18}</p>
                        <FlowRateInput displayCurrency="DAI" onChange={setUserFlowRate}/>
                        <br />
                        <Button fullWidth variant="outlined" onClick={bid}>
                            Bid
                        </Button>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}
