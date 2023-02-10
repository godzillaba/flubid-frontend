import React, { useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { Card, IconButton, Tooltip, useTheme } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { constants, fixIpfsUri, getSymbolOfSuperToken, hackLensImage } from '../helpers';

function toFixedScientificNotation(num: number): string {
    if (num === 0) {
        return "0";
    }

    if (!Number.isFinite(num)) {
        return num.toString();
    }

    const absNum = Math.abs(num);
    if (absNum >= 1e-3 && absNum < 1e7) {
        return num % 1 === 0 ? num.toString() : num.toFixed(3);
    }

    const exponent = Math.floor(Math.log10(absNum));
    const mantissa = num / 10 ** exponent;

    return mantissa.toFixed(3) + "e" + exponent;
}



function makeFlowTooltipText(flowRate: number) {
    return <>
        <p>{toFixedScientificNotation(flowRate)} / second</p>
        <p>{toFixedScientificNotation(flowRate * 60)} / minute</p>
        <p>{toFixedScientificNotation(flowRate * 60 * 60)} / hour</p>
        <p>{toFixedScientificNotation(flowRate * 60 * 60 * 24)} / day</p>
        <p>{toFixedScientificNotation(flowRate * 60 * 60 * 24 * 30)} / 30 days</p>
        <p>{toFixedScientificNotation(flowRate * 60 * 60 * 24 * 365)} / year</p>
    </> 
}

function ExploreAuctionInfoCard(props: any) {
    const titleStyle = {
        cursor: "pointer"
    };

    const [image, setImage] = React.useState("")

    const theme = useTheme();
    const navigate = useNavigate();


    useEffect(() => {
        if (props.auctionItem.controllerObserverImplementation.toLowerCase() === constants.lensControllerImpl) {
            // HACK
            // use template lens image and replace handle. for some reason profile images returned from lensHub look weird
            hackLensImage(props.auctionItem.metadata.name).then(setImage)
        }
        else {
            if (typeof (props.auctionItem.metadata.image) === 'string') {
                setImage(props.auctionItem.metadata.image);
            }
            else {
                setImage(props.auctionItem.metadata.properties.image.description);
            }
        }
    }, []);

    const currency = getSymbolOfSuperToken("polygonMumbai", props.auctionItem.acceptedToken);
    const flowRate = Number(props.auctionItem.inboundStreams[0]?.flowRate || 0) / 1e18;
    const tooltipText = makeFlowTooltipText(flowRate);

    return (
        <Card style={{ padding: theme.spacing(2), cursor: "pointer" }} variant="outlined" onClick={() => navigate('/auction/<addr>')}>
            <img src={fixIpfsUri(image)} style={{ width: '100%' }} />

            <p>{props.auctionItem.name}</p>
            <p># {props.auctionItem.underlyingTokenId}</p>
            <p>{props.auctionItem.auctionType}</p>
            <p>
                Top Bid: {flowRate} {currency} / sec
                <Tooltip title={tooltipText}>
                    <IconButton>
                        <InfoOutlinedIcon />
                    </IconButton>
                </Tooltip>    
            </p>
        </Card>
    )
}

export default ExploreAuctionInfoCard;