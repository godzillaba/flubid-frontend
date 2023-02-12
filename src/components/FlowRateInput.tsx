import { CircularProgress, MenuItem, TextField, useTheme } from '@mui/material';
import { Stack } from '@mui/system';
import React, { useEffect } from 'react';

type FlowRateInputProps = {
    onChange?: ((val: number) => any),
    displayResult?: boolean ,
    displayCurrency?: string
}

export default function FlowRateInput(props: FlowRateInputProps) {
    const [numerator, setNumerator] = React.useState(0);
    const [denominator, setDenominator] = React.useState(1);

    const [isValidNumber, setIsValidNumber] = React.useState(true);
    
    function handleNumeratorChange(e: any) {
        const num = Number(e.target.value);
        
        if (isNaN(num)) {
            setIsValidNumber(false);
        }
        else {
            setIsValidNumber(true);
            setNumerator(num);
        }
    }

    useEffect(() => {
        if (props.onChange) props.onChange(numerator / denominator);
    }, [numerator, denominator]);


    return (
        <Stack
            direction="row"
            justifyContent="flex-start"
            alignItems="center"
            spacing={2}
        >
            <TextField label="Amount" variant="outlined" onChange={handleNumeratorChange} error={!isValidNumber}/>
            <p>/</p>
            <TextField
                value={denominator}
                onChange={e => setDenominator(Number(e.target.value))}
                select
                label="Time Unit"
            >
                <MenuItem value={1}>Second</MenuItem>
                <MenuItem value={60}>Minute</MenuItem>
                <MenuItem value={60 * 60}>Hour</MenuItem>
                <MenuItem value={60 * 60 * 24}>Day</MenuItem>
                <MenuItem value={60 * 60 * 24 * 30}>30 Days</MenuItem>
                <MenuItem value={60 * 60 * 24 * 365}>Year</MenuItem>
            </TextField>
            
            {props.displayResult && <p>= {isValidNumber ? numerator / denominator + " " + props.displayCurrency + " per second" : "NaN"}</p>}
        </Stack>
    );
}

