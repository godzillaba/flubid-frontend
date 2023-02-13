import { IconButton, Tooltip } from "@mui/material";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';


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

type FlowRateDisplayProps = {flowRate: number, currency: string};

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
