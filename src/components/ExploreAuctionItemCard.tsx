import React, { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Card, useTheme } from '@mui/material';
import { constants, GenericRentalAuctionWithMetadata, fixIpfsUri, getImageFromAuctionItem, getSymbolOfSuperToken, hackLensImage } from '../helpers';
import FlowRateDisplay from './FlowRateDisplay';

type ExploreAuctionInfoCardProps = {
    auctionItem: GenericRentalAuctionWithMetadata
}

function ExploreAuctionInfoCard(props: ExploreAuctionInfoCardProps) {
    const titleStyle = {
        cursor: "pointer"
    };

    const [image, setImage] = React.useState("")

    const theme = useTheme();
    const navigate = useNavigate();


    useEffect(() => {
        getImageFromAuctionItem(props.auctionItem).then(setImage);
    }, []);

    const currency = getSymbolOfSuperToken("polygonMumbai", props.auctionItem.acceptedToken);
    const flowRate = Number(props.auctionItem.topBid || 0) / 1e18;
    const auctionType = props.auctionItem.type === 'english' ? 'English Rental Auction' : 'Continuous Rental Auction';

    return (
        <Card style={{ padding: theme.spacing(2), cursor: "pointer" }} variant="outlined" onClick={() => navigate('/auction/' + props.auctionItem.address)}>
            <img src={fixIpfsUri(image)} style={{ width: '100%' }} />

            <p>{props.auctionItem.controllerObserver.underlyingTokenName}</p>
            <p># {props.auctionItem.controllerObserver.underlyingTokenID}</p>
            <p>{auctionType}</p>
            <p>
                <FlowRateDisplay flowRate={flowRate} currency={currency}/>
            </p>
        </Card>
    )
}

export default ExploreAuctionInfoCard;