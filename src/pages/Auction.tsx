import { Alert, Button, Card, Chip, Container, Grid, LinearProgress, MenuItem, Select, Stack, TextField, useTheme } from "@mui/material";
import { AbiCoder, parseEther } from "ethers/lib/utils.js";
import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FlowRateInput from "../components/FlowRateInput";

import base64Lens from "../assets/lensProfile";
import { ContinuousRentalAuctionByAddressDocument, ContinuousRentalAuctionByAddressQuery, execute, RentalAuctionByAddressDocument, RentalAuctionByAddressQuery } from "../graph/.graphclient";
import { BigNumber, ethers, Signer } from "ethers";
import { addMetadataToGenericRentalAuctions, constants, fixIpfsUri, GenericRentalAuctionWithMetadata, getImageFromAuctionItem, getSymbolOfSuperToken, makeOpenSeaLink, waitForGraphSync } from "../helpers";
import FlowRateDisplay from "../components/FlowRateDisplay";
import { ExecutionResult } from "graphql";
import { purple, red } from '@mui/material/colors';
import BidBar from "../components/BidBar";

import * as ContinuousRentalAuctionABI from "../abi/ContinuousRentalAuction.json";
import { Framework, SuperToken } from "@superfluid-finance/sdk-core";
import { useAccount, useNetwork, useProvider, useSigner } from 'wagmi'
import TransactionAlert from "../components/TransactionAlert";
import PlaceBid from "../components/PlaceBid";
import PageSpinner from "../components/PageSpinner";
import { ContinuousRentalAuctionInfo } from "../components/ContinuousRentalAuctionInfo";

type ContinuousRentalAuction = ContinuousRentalAuctionByAddressQuery["continuousRentalAuctions"][0];

function findBidderAbove(bids: ContinuousRentalAuction["inboundStreams"], bidAmount: BigNumber, ignoreSender: string): string {
    const sortedBids = bids.sort((a, b) => BigNumber.from(a.flowRate).sub(BigNumber.from(b.flowRate)).lt(0) ? -1 : 1);
    
    const foundBid = sortedBids.find(bid => BigNumber.from(bid.flowRate).gte(BigNumber.from(bidAmount)) && bid.sender != ignoreSender);
    console.log(foundBid?.sender || constants.zeroAddress)
    
    return foundBid?.sender || constants.zeroAddress;
  }
  

export default function Auction() {
    const { auctionAddress } = useParams();

    const theme = useTheme();
    const cardStyle = {
        padding: theme.spacing(2),
    };

    const navigate = useNavigate();

    const { chain, chains } = useNetwork();
    const { address } = useAccount();
    const { data: signer, isError, isLoading } = useSigner();
    const provider = useProvider();

    const [refetchCounter, setRefetchCounter] = React.useState(0);

    const [userFlowRate, setUserFlowRate] = React.useState<number>(0);
    const [genericRentalAuction, setGenericRentalAuction] = React.useState<GenericRentalAuctionWithMetadata | null>(null);
    const [continuousRentalAuction, setContinuousRentalAuction] = React.useState<ContinuousRentalAuctionByAddressQuery["continuousRentalAuctions"][0] | null>(null);
    const [superfluid, setSuperfluid] = React.useState<Framework | null>(null);
    const [superToken, setSuperToken] = React.useState<SuperToken | null>(null);
    const [superTokenSymbol, setSuperTokenSymbol] = React.useState("");
    const [underlyingTokenSymbol, setUnderlyingTokenSymbol] = React.useState("");
    const [superTokenBalance, setSuperTokenBalance] = React.useState<BigNumber>(BigNumber.from(0));
    const [underlyingTokenBalance, setUnderlyingTokenBalance] = React.useState<BigNumber>(BigNumber.from(0));
    const [image, setImage] = React.useState("");

    function refetch() {
        setRefetchCounter(refetchCounter + 1);
    }

    const fetchAuctionDataAndLoadSuperfluid = React.useCallback(async () => {
        if (!auctionAddress || !address) return;
    
        try {
            const rentalAuctionResult = await execute(RentalAuctionByAddressDocument, { address: auctionAddress }) as ExecutionResult<RentalAuctionByAddressQuery>;
            if (!rentalAuctionResult.data) throw new Error("No data");

            const auctions = await addMetadataToGenericRentalAuctions(rentalAuctionResult.data.genericRentalAuctions);
            if (!auctions || !auctions[0]) return;
            const genericRentalAuction = auctions[0];

            if (ethers.utils.getAddress(genericRentalAuction.controllerObserver.owner) === address) {
                navigate("/manage-auction/" + auctionAddress);
                return;
            }
    
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
    }, [auctionAddress, chain?.id, refetchCounter, address]); // todo chain change

    const fetchTokenBalancesAndSymbols = React.useCallback(async () => {
        if (!superToken || !address || !chain) return;

        try {
            setSuperTokenBalance(BigNumber.from(await superToken.balanceOf({ account: address, providerOrSigner: provider })));
            setSuperTokenSymbol(await superToken.symbol({ providerOrSigner: provider }));
            if (superToken.underlyingToken) {
                setUnderlyingTokenBalance(BigNumber.from(await superToken.underlyingToken.balanceOf({ account: address, providerOrSigner: provider })));
                setUnderlyingTokenSymbol(await superToken.underlyingToken.symbol({ providerOrSigner: provider }));
            }
            else {
                setUnderlyingTokenBalance(await provider.getBalance(address));
                setUnderlyingTokenSymbol(chain.nativeCurrency.symbol);
            }
        }
        catch (e) {
            console.error(e);
        }
    }, [address, superToken == null, chain?.id, refetchCounter]);

    React.useEffect(() => {
        fetchAuctionDataAndLoadSuperfluid();
    }, [fetchAuctionDataAndLoadSuperfluid]);

    React.useEffect(() => {
        fetchTokenBalancesAndSymbols();
    }, [fetchTokenBalancesAndSymbols]);

    async function createUpdateOrDeleteBid(kind: 'create' | 'update' | 'delete') {
        if (!superToken || !continuousRentalAuction || !address) throw new Error("stuff is undefined");
        
        let flowOp;
        if (kind === 'delete') {
            flowOp = superToken.deleteFlow({
                sender: address as string,
                receiver: genericRentalAuction?.address
            });
        }
        else {
            const flowRate = BigNumber.from(Math.round(userFlowRate * 1e18) + "");
            const higherBidder = findBidderAbove(continuousRentalAuction.inboundStreams, flowRate, address);
            const flowOpParams = {
                sender: address as string,
                receiver: genericRentalAuction?.address,
                flowRate: Math.round(userFlowRate * 1e18) + "",
                userData: new AbiCoder().encode(["address", "bytes"], [higherBidder, []]) // todo: not zero address always
            };
            if (kind === 'create') {
                flowOp = superToken.createFlow(flowOpParams);
            }
            else {
                flowOp = superToken.updateFlow(flowOpParams);
            }
        }
        const tx = await (await flowOp.exec(signer as Signer)).wait();
        await waitForGraphSync(tx.blockNumber);
        refetch();
    }
    
    if (!genericRentalAuction || !superfluid) {
        return (<PageSpinner/>);
    }

    const auctionTypeReadable = constants.auctionTypesReadable[genericRentalAuction?.type];
    
    const currentRenter = ethers.utils.getAddress(genericRentalAuction.currentRenter);

    const myContinuousBid = continuousRentalAuction?.inboundStreams.find(x => ethers.utils.getAddress(x.sender) === address);
    const positionInBidQueue = continuousRentalAuction?.inboundStreams.sort((a, b) => b.flowRate - a.flowRate).map(x => x.sender).indexOf(address?.toLowerCase());
    
    return (
        <Container style={{ marginTop: theme.spacing(2) }}>
            {/* <TransactionAlert show={true} type='pending'/> */}
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <img src={fixIpfsUri(image)} style={{ width: "100%" }} />
                </Grid>
                <Grid item xs={6}>
                    <Card variant="outlined" style={cardStyle}>
                        <ContinuousRentalAuctionInfo genericRentalAuction={genericRentalAuction}/>
                    </Card>
                </Grid>
                {
                    !continuousRentalAuction || genericRentalAuction.topBid == 0 || genericRentalAuction.paused ? null :
                    <Grid item xs={12}>
                        <BidBar bids={continuousRentalAuction.inboundStreams.map(s => Number(s.flowRate))} currentBid={userFlowRate * 1e18}/>
                    </Grid>
                }
                {
                    !myContinuousBid ? null :
                    <Grid item xs={6}>
                        <Card variant="outlined" style={cardStyle}>
                            <h2 style={{marginTop: 0}}>Your Bid</h2>
                            <p><FlowRateDisplay flowRate={myContinuousBid.flowRate / 1e18} currency={superTokenSymbol}/></p>
                            {positionInBidQueue != undefined ? <p>Position in bid queue: {positionInBidQueue + 1}</p> : null}
                            <Button fullWidth variant="outlined" color="error" onClick={() => {createUpdateOrDeleteBid('delete')}}>Cancel Bid</Button>
                        </Card>
                    </Grid>
                }

                <PlaceBid config={{
                    type: myContinuousBid ? 'update' : 'create',
                    gridWidth: myContinuousBid ? 6 : 12,
                    underlyingTokenSymbol,
                    underlyingTokenBalance,
                    superTokenSymbol,
                    superTokenBalance,
                    onUserFlowRateChange: setUserFlowRate,
                    onBidClick: myContinuousBid ? () => {createUpdateOrDeleteBid('update')} : () => {createUpdateOrDeleteBid('create')}
                }}/>
            </Grid>
        </Container>
    );
}
