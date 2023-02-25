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

function prettyFlowRate(rate: number | string, currency: string) {
    rate = parseFloat(rate.toString());
    if (rate > 1) return toFixedScientificNotation(rate) + ` ${currency} / sec`;
    if (rate > 1 / 60) return toFixedScientificNotation(rate * 60) + ` ${currency} / min`;
    if (rate > 1 / 60 / 60) return toFixedScientificNotation(rate * 60 * 60) + ` ${currency} / hour`;
    if (rate > 1 / 60 / 60 / 24) return toFixedScientificNotation(rate * 60 * 60 * 24) + ` ${currency} / day`;
    if (rate > 1 / 60 / 60 / 24 / 30) return toFixedScientificNotation(rate * 60 * 60 * 24 * 30) + ` ${currency} / 30 days`;
    return toFixedScientificNotation(rate * 60 * 60 * 24 * 365) + ` ${currency} / year`;
}

type FlowRateDisplayProps = {flowRate: number | string, currency: string};

export default function FlowRateDisplay(props: FlowRateDisplayProps) {
    const tooltipText = makeFlowTooltipText(props.flowRate);

    return (
        <>
            {prettyFlowRate(props.flowRate, props.currency)}
            <Tooltip title={tooltipText}>
                <IconButton>
                    <InfoOutlinedIcon />
                </IconButton>
            </Tooltip>
        </>
    );
}
