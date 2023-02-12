import React, { useEffect } from 'react';
import { LinearProgress, Stack } from '@mui/material';

type VerticalLineProps = {
    height: number,
    ranges: Range[],
    currentValue: number
};

function VerticalLine(props: VerticalLineProps) {
    const min = props.ranges[0].lower;
    const max = props.ranges[props.ranges.length - 1].upper;
    const totalRange = max - min;

    let left;
    if (props.currentValue <= min) left = 0;
    else if (props.currentValue >= max) left = 100;
    else left = (props.currentValue - min) / totalRange * 100;

    const style = {
        width: "0",
        height: props.height,
        border: '1px solid white',
        position: 'absolute',
        top: '50%',
        left: left + '%',
        marginLeft: '-1px',
        marginTop: '-10px'
    } as React.CSSProperties;
    return (
        <div style={style}>
            {/* <span style={{position: 'absolute', left: '-50%', bottom: '-20px'}}>50</span> */}
        </div>
    )
}

type BidBarProps = {
    bids: number[],
    currentBid: number
}

type Range = {
    lower: number,
    upper: number,
    valid: boolean
}

function makeBidRanges(bids: number[], bidFactor: number): Range[] {
    // sort
    bids.sort();
    console.log(bids);

    const ranges: Range[] = [];

    // anything up to minimum bid is valid, make lower bids[0]/bidFactor just so there is some area in the UI
    // ranges.push({
    //     lower: bids[0] / bidFactor,
    //     upper: bids[0],
    //     valid: true
    // });

    for (let i = 0; i < bids.length; i++) {
        // invalid within bidFactor above any bid
        ranges.push({
            lower: bids[i],
            upper: bids[i] * bidFactor,
            valid: false
        });

        if (i < bids.length - 1) {
            // this is not the last bid, so we have to put some green in between this bid and the next one if possible
            if (bids[i] * bidFactor < bids[i + 1]) {
                // we can put some green in between
                ranges.push({
                    lower: bids[i] * bidFactor,
                    upper: bids[i + 1],
                    valid: true
                })
            }
        }
    }

    // anything above max bid * bidFactor is valid
    // ranges.push({
    //     lower: bids[bids.length - 1] * bidFactor,
    //     upper: bids[bids.length - 1] * bidFactor * bidFactor,
    //     valid: true
    // });

    return ranges;
}

function makeProgressElementsFromRanges(ranges: Range[]) {
    if (ranges.length === 0) return <></>;
    console.log(ranges)
    const min = ranges[0].lower;
    const max = ranges[ranges.length - 1].upper;
    const totalRange = max - min;

    const elements = [];

    elements.push(
        <LinearProgress key={-1} variant='determinate' value={100} style={{width: "5%"}} color="success"/>
    );

    for (let i = 0; i < ranges.length; i++) {
        const width = (ranges[i].upper - ranges[i].lower) / totalRange * 90;

        elements.push((
            <LinearProgress key={i} variant='determinate' value={100} style={{width: width + "%"}} color={ranges[i].valid ? "success" : "error"}/>
        ))
    }

    elements.push(
        <LinearProgress key={elements.length} variant='determinate' value={100} style={{width: "5%"}} color="success"/>
    );

    return elements;
}

export default function BidBar(props: BidBarProps) {
    const height = 20;

    const [ranges, setRanges] = React.useState<Range[]>([]);

    useEffect(() => {
        setRanges(makeBidRanges(props.bids, 1.05))
    }, []);

    if (ranges.length === 0) return <></>;

    return (
        <Stack direction="row" spacing={0} style={{height, position: 'relative'}} alignItems="center">
            <>
            {/* <LinearProgress variant="determinate" value={100} style={{width: "50.9%"}} color="error"/>
            <LinearProgress variant="determinate" value={100} style={{width: "100%"}} color="success"/> */}
            {makeProgressElementsFromRanges(ranges)}
            <VerticalLine height={height} currentValue={props.currentBid} ranges={ranges}/>
            </>
        </Stack>
    )
}