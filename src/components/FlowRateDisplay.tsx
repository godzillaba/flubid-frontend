import { IconButton, Tooltip } from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { toFixedScientificNotation } from "../helpers";

function makeFlowTooltipText(flowRate: number | string) {
    flowRate = parseFloat(flowRate.toString());
    return <>
        <p>{toFixedScientificNotation(flowRate)} / second</p>
        <p>{toFixedScientificNotation(flowRate * 60)} / minute</p>
        <p>{toFixedScientificNotation(flowRate * 60 * 60)} / hour</p>
        <p>{toFixedScientificNotation(flowRate * 60 * 60 * 24)} / day</p>
        <p>{toFixedScientificNotation(flowRate * 60 * 60 * 24 * 30)} / 30 days</p>
        <p>{toFixedScientificNotation(flowRate * 60 * 60 * 24 * 365)} / year</p>
    </> 
}

type FlowRateDisplayProps = {flowRate: number | string, currency: string};

export default function FlowRateDisplay(props: FlowRateDisplayProps) {
    const tooltipText = makeFlowTooltipText(props.flowRate);

    return (
        <>
            {props.flowRate} {props.currency} / sec
            <Tooltip title={tooltipText}>
                <IconButton>
                    <InfoOutlinedIcon />
                </IconButton>
            </Tooltip>
        </>
    );
}
