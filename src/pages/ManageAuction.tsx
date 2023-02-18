import { Button, Card, Container, Grid, TextField, useTheme } from '@mui/material';
import { ethers } from 'ethers';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAccount, useProvider } from 'wagmi';
import { ContinuousRentalAuctionInfo } from '../components/ContinuousRentalAuctionInfo';
import PageSpinner from '../components/PageSpinner';
import { execute, RentalAuctionByAddressDocument } from '../graph/.graphclient';
import { cmpAddr, constants, fixIpfsUri, GenericRentalAuctionWithMetadata, getImageFromAuctionItem, getItemsFromRentalAuctionsDocument } from '../helpers';

// we want this to look like the auction page, but with the ability to edit the auction
// there are really only 2 things that can be edited: the ownership of the controller and starting/stopping the auction


export default function ManageAuction() {
    const { auctionAddress } = useParams();
    const navigate = useNavigate();
    const theme = useTheme();
    const cardStyle = {
        padding: theme.spacing(2),
    };

    const {address} = useAccount();
    const provider = useProvider();

    const [genericRentalAuction, setGenericRentalAuction] = React.useState<GenericRentalAuctionWithMetadata | null>(null);
    const [tokenInfo, setTokenInfo] = React.useState<any>({
        currentOwner: '',
        isControllerApproved: false,
    });
    const [image, setImage] = React.useState<string | null>(null);

    // get auction data
    const fetchAuctionData = React.useCallback(async () => {
        if (!auctionAddress) return;
        const rentalAuctionResult = await execute(RentalAuctionByAddressDocument, { address: auctionAddress }) as any;

        const auctions = await getItemsFromRentalAuctionsDocument(rentalAuctionResult.data);

        if (!auctions || !auctions.length) return;

        const auction = auctions[0];

        if (ethers.utils.getAddress(auction.controllerObserver.owner) !== address) {
            navigate('/auction/' + auctionAddress);
            return;
        }

        const image = await getImageFromAuctionItem(auction);

        try {
            const tokenContract = new ethers.Contract(auction.controllerObserver.underlyingTokenContract, constants.abis.IERC721Metadata, provider);
            const currentOwner = await tokenContract.ownerOf(auction.controllerObserver.underlyingTokenID);
            const getApproved = await tokenContract.getApproved(auction.controllerObserver.underlyingTokenID);
            const isControllerApproved = getApproved === auction.controllerObserver.address || await tokenContract.isApprovedForAll(currentOwner, auction.controllerObserver.address);
            
            setTokenInfo({
                currentOwner,
                isControllerApproved,
            });
        }
        catch (e) {}

        setImage(image);
        setGenericRentalAuction(auction);
    }, [auctionAddress]);

    React.useEffect(() => {
        fetchAuctionData();
    }, [fetchAuctionData]);

    if (!genericRentalAuction || !image || !address) return <PageSpinner/>

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
                        <ContinuousRentalAuctionInfo genericRentalAuction={genericRentalAuction}/>
                    </Card>
                    
                    <Card variant='outlined' style={{...cardStyle, marginTop: theme.spacing(2)}}>
                        <h2>Transfer Ownership</h2>
                        <p>Transfer ownership of the Auction. Whoever owns the auction can withdraw the NFT, so be careful with this!</p>
                        <TextField fullWidth label="New Owner Address" variant="outlined" />
                        <Button fullWidth variant="outlined" color="success" style={{marginTop: theme.spacing(2)}}>
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
                                            <Button fullWidth variant="outlined" color="success" style={{marginTop: theme.spacing(2)}}>
                                                Approve Controller
                                            </Button>
                                        </>
                                    )
                                }
                                else {
                                    return (
                                        <>
                                            <h2>Start Auction</h2>
                                            <Button fullWidth variant="outlined" color="success" style={{marginTop: theme.spacing(2)}}>
                                                Start Auction
                                            </Button>
                                        </>
                                    )
                                }
                            }
                            else {
                                // stop auction button
                                <>
                                    <h2>Stop Auction</h2>
                                    <p>Stop the auction. This will allow you to withdraw your NFT</p>
                                    <Button fullWidth variant="outlined" color="success" style={{marginTop: theme.spacing(2)}}>
                                        Stop Auction
                                    </Button>
                                </>
                            }
                        })()}
                    </Card>

                    {
                        // if we are paused and the current owner is the controller, then we can withdraw the token
                        tokenInfo.currentOwner === genericRentalAuction.controllerObserver.address && genericRentalAuction.paused ? 
                            <Card variant='outlined' style={{...cardStyle, marginTop: theme.spacing(2)}}>
                                <h2>Withdraw Token</h2>
                                <p>While the auction is paused, you can withdraw the NFT back to your wallet.</p>
                                <Button fullWidth variant="outlined" color="success" style={{marginTop: theme.spacing(2)}}>
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