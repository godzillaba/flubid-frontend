import { Button, Card, Container, Grid, TextField, useTheme } from '@mui/material';
import { ContractTransaction, ethers } from 'ethers';
import { ExecutionResult } from 'graphql';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccount, useNetwork, useProvider, useSigner } from 'wagmi';
import { MyContext, TransactionAlertStatus } from '../App';
import { ContinuousRentalAuctionInfo } from '../components/ContinuousRentalAuctionInfo';
import { EnglishRentalAuctionInfo } from '../components/EnglishRentalAuctionInfo';
import PageSpinner from '../components/PageSpinner';
import { EnglishRentalAuction } from '../graph/.graphclient';
import { addMetadataToGenericRentalAuctions, ChainId, cmpAddr, constants, fixIpfsUri, GenericRentalAuctionWithMetadata, getGraphSDK, getImageFromAuctionItem, waitForGraphSync, waitForTxPromise } from '../helpers';

// we want this to look like the auction page, but with the ability to edit the auction
// there are really only 2 things that can be edited: the ownership of the controller and starting/stopping the auction


export default function ManageAuction() {
    const { auctionAddress, auctionChainId } = useParams();

    const {address} = useAccount();
    const {chain} = useNetwork();
    const chainId = chain!.id as ChainId;
    const provider = useProvider();
    const { data: signer, isError, isLoading } = useSigner();
    
    const navigate = useNavigate();
    const theme = useTheme();
    const cardStyle = {
        padding: theme.spacing(2),
    };


    const { setTransactionAlertStatus } = React.useContext(MyContext);

    const [genericRentalAuction, setGenericRentalAuction] = React.useState<GenericRentalAuctionWithMetadata | null>(null);
    const [englishRentalAuction, setEnglishRentalAuction] = React.useState<EnglishRentalAuction>();
    const [ownerInput, setOwnerInput] = React.useState<string>('');
    const [tokenInfo, setTokenInfo] = React.useState<any>({
        currentOwner: '',
        isControllerApproved: false,
    });
    const [image, setImage] = React.useState<string | null>(null);

    // get auction data
    const fetchAuctionData = React.useCallback(async () => {
        if (!auctionAddress) return;
        
        const graphSdk = getGraphSDK(chainId);

        const rentalAuctionResult = await graphSdk.RentalAuctionByAddress({ address: auctionAddress });

        const auctions = await addMetadataToGenericRentalAuctions(rentalAuctionResult.genericRentalAuctions);

        if (!auctions.length) return;

        const auction = auctions[0];

        const image = await getImageFromAuctionItem(auction);

        let englishRentalAuction;
        if (auction.type === 'english') {
            const result = await graphSdk.EnglishRentalAuctionsByAddress({ address: auctionAddress });
            englishRentalAuction = result.englishRentalAuctions[0];
        }

        try {
            const tokenContract = new ethers.Contract(auction.controllerObserver.underlyingTokenContract, constants.abis.IERC721Metadata, provider);
            const currentOwner = await tokenContract.ownerOf(auction.controllerObserver.underlyingTokenID);
            const getApproved = await tokenContract.getApproved(auction.controllerObserver.underlyingTokenID);
            const isControllerApproved = cmpAddr(getApproved, auction.controllerObserver.address) || await tokenContract.isApprovedForAll(currentOwner, auction.controllerObserver.address);
            
            setTokenInfo({
                currentOwner,
                isControllerApproved,
            });
        }
        catch (e) {
            console.error(e);
            console.log('failed to fetch token info')
        }

        setImage(image);
        setGenericRentalAuction(auction);
        setEnglishRentalAuction(englishRentalAuction)
    }, [auctionAddress]);

    React.useEffect(() => {
        fetchAuctionData();
    }, [fetchAuctionData]);

    function handleOwnerInput(e: React.ChangeEvent<HTMLInputElement>) {
        setOwnerInput(e.target.value);
    }

    async function handleTransferOwnership() {
        if (!genericRentalAuction || !signer) return;

        const controllerContract = new ethers.Contract(genericRentalAuction.controllerObserver.address, constants.abis.ERC721ControllerObserver, signer);
        const txPromise = controllerContract.transferOwnership(ownerInput);

        await waitForTxPromise(txPromise, setTransactionAlertStatus);
        
        navigate(`/auction/${auctionChainId}/${auctionAddress}`);
    }

    async function handleStartAuction() {
        if (!genericRentalAuction || !signer) return;

        const controllerContract = new ethers.Contract(genericRentalAuction.controllerObserver.address, constants.abis.ERC721ControllerObserver, signer);
        
        const txPromise = controllerContract.startAuction();
        
        await waitForTxPromise(txPromise, setTransactionAlertStatus, false);

        setTokenInfo({
            currentOwner: genericRentalAuction.controllerObserver.address,
            isControllerApproved: false,
        });
        
        setGenericRentalAuction({
            ...genericRentalAuction,
            paused: false,
        });
    }

    async function handleStopAuction() {
        if (!genericRentalAuction || !signer) return;

        const controllerContract = new ethers.Contract(genericRentalAuction.controllerObserver.address, constants.abis.ERC721ControllerObserver, signer);
        const txPromise = controllerContract.stopAuction();
        await waitForTxPromise(txPromise, setTransactionAlertStatus, false);
        
        setGenericRentalAuction({
            ...genericRentalAuction,
            paused: true,
            currentRenter: constants.zeroAddress
        });
    }

    async function handleApproveController() {
        if (!genericRentalAuction || !signer) return;

        const tokenContract = new ethers.Contract(genericRentalAuction.controllerObserver.underlyingTokenContract, constants.abis.IERC721Metadata, signer);
        const txPromise = tokenContract.approve(genericRentalAuction.controllerObserver.address, genericRentalAuction.controllerObserver.underlyingTokenID);
        
        await waitForTxPromise(txPromise, setTransactionAlertStatus, false);
        
        setTokenInfo({
            ...tokenInfo,
            isControllerApproved: true,
        });
    }

    async function handleWithdrawToken() {
        if (!genericRentalAuction || !signer) return;

        const controllerContract = new ethers.Contract(genericRentalAuction.controllerObserver.address, constants.abis.ERC721ControllerObserver, signer);
        const txPromise = controllerContract.withdrawToken();
        await waitForTxPromise(txPromise, setTransactionAlertStatus, false);

        setTokenInfo({
            isControllerApproved: false,
            currentOwner: address,
        });
    }

    if (chainId != parseInt(auctionChainId!)) {
        console.log(auctionChainId)
        // return centered h1 with text "wrong network"
        return (<h1 style={{ textAlign: "center" }}>
            Wrong network, switch to {constants.subgraphChainNames[parseInt(auctionChainId!) as ChainId]}
        </h1>);
    }

    if (!genericRentalAuction || !image || !address) return <PageSpinner/>

    if (!cmpAddr(genericRentalAuction.controllerObserver.owner, address)) {
        navigate(`/auction/${auctionChainId}/${auctionAddress}`);
        return <></>;
    }

    // check if user has access to the token. (either they own it or the controller owns it)
    const doesUserOwnToken = cmpAddr(tokenInfo.currentOwner, address);
    const doesControllerHaveTokenAccess = cmpAddr(tokenInfo.currentOwner, genericRentalAuction.controllerObserver.address) || tokenInfo.isControllerApproved;

    // if the user doesn't own the token nor does the controller have access to it, then they can't manage the auction
    // so we should display a warning
    
    return (
        <Container style={{marginTop: theme.spacing(2)}}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <img src={fixIpfsUri(image)} style={{ width: "100%" }} />
                </Grid>
                <Grid item xs={6}>
                    <Card variant='outlined' style={cardStyle}>
                        {
                            englishRentalAuction ? 
                                <EnglishRentalAuctionInfo englishRentalAuction={englishRentalAuction} genericRentalAuction={genericRentalAuction}/> 
                                : <ContinuousRentalAuctionInfo genericRentalAuction={genericRentalAuction}/>
                        }
                        
                    </Card>
                    
                    <Card variant='outlined' style={{...cardStyle, marginTop: theme.spacing(2)}}>
                        <h2>Transfer Ownership</h2>
                        <p>Transfer ownership of the Auction. Whoever owns the auction can withdraw the NFT, so be careful with this!</p>
                        <TextField fullWidth label="New Owner Address" variant="outlined" value={ownerInput} onChange={handleOwnerInput} />
                        <Button fullWidth variant="outlined" color="success" style={{marginTop: theme.spacing(2)}} onClick={handleTransferOwnership}>
                            Transfer
                        </Button>
                    </Card>
                    
                    {/* starting and stopping buttons */}
                    <Card variant='outlined' style={{...cardStyle, marginTop: theme.spacing(2)}}>
                        {(() => {
                            if (genericRentalAuction.paused) {
                                if (!doesUserOwnToken && !doesControllerHaveTokenAccess) {
                                    return (
                                        <>
                                            <h2>Warning</h2>
                                            <p>
                                                You do not own the token nor does the controller have access to the token.
                                                You cannot start the auction.
                                            </p> 
                                        </>
                                    )
                                }
                                else if (!doesControllerHaveTokenAccess) {
                                    // approve button
                                    return (
                                        <>
                                            <h2>Start Auction</h2>
                                            <p>Start the auction. The Auction Controller must have approval to spend the NFT first.</p>
                                            <Button fullWidth variant="outlined" color="success" style={{marginTop: theme.spacing(2)}} onClick={handleApproveController}>
                                                Approve Controller
                                            </Button>
                                        </>
                                    )
                                }
                                else {
                                    return (
                                        <>
                                            <h2>Start Auction</h2>
                                            <Button fullWidth variant="outlined" color="success" style={{marginTop: theme.spacing(2)}} onClick={handleStartAuction}>
                                                Start Auction
                                            </Button>
                                        </>
                                    )
                                }
                            }
                            else {
                                // stop auction button
                                return (
                                    <>
                                        <h2>Stop Auction</h2>
                                        <p>Stop the auction. This will allow you to withdraw your NFT</p>
                                        <Button fullWidth variant="outlined" color="success" style={{marginTop: theme.spacing(2)}} onClick={handleStopAuction}>
                                            Stop Auction
                                        </Button>
                                    </>
                                )
                            }
                        })()}
                    </Card>
                    
                    {/* withdraw token button */}
                    {
                        // if we are paused and the current owner is the controller, then we can withdraw the token
                        tokenInfo.currentOwner === genericRentalAuction.controllerObserver.address && genericRentalAuction.paused ? 
                            <Card variant='outlined' style={{...cardStyle, marginTop: theme.spacing(2)}}>
                                <h2>Withdraw Token</h2>
                                <p>While the auction is paused, you can withdraw the NFT back to your wallet.</p>
                                <Button fullWidth variant="outlined" color="success" style={{marginTop: theme.spacing(2)}} onClick={handleWithdrawToken}>
                                    Withdraw Token
                                </Button>
                            </Card>
                        : null
                    }
                    
                </Grid>
            </Grid>
        </Container>
    )
}