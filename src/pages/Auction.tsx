import { Card, Container, Grid, useTheme } from "@mui/material";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ContinuousRentalAuctionByAddressDocument, execute, RentalAuctionByAddressDocument, RentalAuctionByAddressQuery, EnglishRentalAuctionsByAddressDocument, ContinuousRentalAuction, EnglishRentalAuction } from "../graph/.graphclient";
import { BigNumber, ethers } from "ethers";
import { addMetadataToGenericRentalAuctions, ChainId, cmpAddr, constants, fixIpfsUri, GenericRentalAuctionWithMetadata, getGraphSDK, getImageFromAuctionItem } from "../helpers";
import { ExecutionResult } from "graphql";

import { Framework, SuperToken } from "@superfluid-finance/sdk-core";
import { useAccount, useNetwork, useProvider, useSigner } from 'wagmi';
import PageSpinner from "../components/PageSpinner";
import { ContinuousRentalAuctionInfo } from "../components/ContinuousRentalAuctionInfo";
import { EnglishRentalAuctionInfo } from "../components/EnglishRentalAuctionInfo";
import { ContinuousRentalAuctionInteractions } from "../components/ContinuousRentalAuctionInteractions";
import { EnglishRentalAuctionInteractions } from "../components/EnglishRentalAuctionInteractions";

export default function Auction() {
    const { auctionAddress } = useParams();

    const theme = useTheme();
    const cardStyle = {
        padding: theme.spacing(2),
    };

    const navigate = useNavigate();

    const { chain, chains } = useNetwork();
    const chainId = chain!.id as ChainId;
    const { address } = useAccount();
    const provider = useProvider();

    const [refetchCounter, setRefetchCounter] = React.useState(0);

    // todo: somehow deal with incorrect network on auction page

    const [genericRentalAuction, setGenericRentalAuction] = React.useState<GenericRentalAuctionWithMetadata>();
    const [continuousRentalAuction, setContinuousRentalAuction] = React.useState<ContinuousRentalAuction>();
    const [englishRentalAuction, setEnglishRentalAuction] = React.useState<EnglishRentalAuction>();
    const [superfluid, setSuperfluid] = React.useState<Framework>();
    const [superToken, setSuperToken] = React.useState<SuperToken>();
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
            const graphSdk = getGraphSDK(chainId);

            const rentalAuctionResult = await graphSdk.RentalAuctionByAddress({ address: auctionAddress });

            const auctions = await addMetadataToGenericRentalAuctions(rentalAuctionResult.genericRentalAuctions);
            if (!auctions || !auctions[0]) return;
            const genericRentalAuction = auctions[0];

            if (cmpAddr(genericRentalAuction.controllerObserver.owner, address)) {
                navigate("/manage-auction/" + auctionAddress);
                return;
            }

            // set superfluid stuff
            const sf = await Framework.create({
                chainId,
                provider,
            });
            const superToken = await sf.loadSuperToken(genericRentalAuction.acceptedToken);

            if (genericRentalAuction.type === "continuous") {
                const result = await graphSdk.ContinuousRentalAuctionByAddress({ address: auctionAddress });
                setContinuousRentalAuction(result.continuousRentalAuctions[0]);
            } else if (genericRentalAuction.type === "english") {
                const result = await graphSdk.EnglishRentalAuctionsByAddress({ address: auctionAddress });
                setEnglishRentalAuction(result.englishRentalAuctions[0]);
            }

            setSuperToken(superToken);
            setSuperfluid(sf);
            setGenericRentalAuction(genericRentalAuction);
            setImage(await getImageFromAuctionItem(genericRentalAuction));
        }
        catch (e) {
            console.error(e);
        }
    }, [auctionAddress, chainId, refetchCounter, address]); // todo chain change

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
    }, [address, superToken == null, chainId, refetchCounter]);

    React.useEffect(() => {
        fetchAuctionDataAndLoadSuperfluid();
    }, [fetchAuctionDataAndLoadSuperfluid]);

    React.useEffect(() => {
        fetchTokenBalancesAndSymbols();
    }, [fetchTokenBalancesAndSymbols]);
    
    if (!genericRentalAuction || !superfluid || !superToken || !superTokenSymbol || !underlyingTokenSymbol) {
        return (<PageSpinner/>);
    }

    return (
        <Container style={{ marginTop: theme.spacing(2) }}>
            {/* <TransactionAlert show={true} type='pending'/> */}
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <img src={fixIpfsUri(image)} style={{ width: "100%" }} />
                </Grid>
                <Grid item xs={6}>
                    <Card variant="outlined" style={cardStyle}>
                        {continuousRentalAuction ? 
                            <ContinuousRentalAuctionInfo genericRentalAuction={genericRentalAuction}/>
                        : null}
                        {englishRentalAuction ?
                            <EnglishRentalAuctionInfo genericRentalAuction={genericRentalAuction} englishRentalAuction={englishRentalAuction} />
                        : null}
                    </Card>
                </Grid>

                {(() => {
                    if (continuousRentalAuction) {
                        return <ContinuousRentalAuctionInteractions 
                            genericRentalAuction={genericRentalAuction} 
                            continuousRentalAuction={continuousRentalAuction}
                            superTokenSymbol={superTokenSymbol}
                            underlyingTokenSymbol={underlyingTokenSymbol}
                            superTokenBalance={superTokenBalance}
                            underlyingTokenBalance={underlyingTokenBalance}
                            superToken={superToken}
                            afterTransaction={refetch}
                        />;
                    }
                    if (englishRentalAuction) {
                        return <EnglishRentalAuctionInteractions 
                            genericRentalAuction={genericRentalAuction} 
                            englishRentalAuction={englishRentalAuction}
                            superTokenSymbol={superTokenSymbol}
                            underlyingTokenSymbol={underlyingTokenSymbol}
                            superTokenBalance={superTokenBalance}
                            underlyingTokenBalance={underlyingTokenBalance}
                            superToken={superToken}
                            sfFramework={superfluid}
                            afterTransaction={refetch}
                        />;
                    }
                })()}
            </Grid>
        </Container>
    );
}
