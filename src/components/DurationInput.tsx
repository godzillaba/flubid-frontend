import { MenuItem, TextField } from "@mui/material";
import { Stack } from "@mui/system";
import React from "react";
import { DecimalInput } from "./DecimalInput";

type DurationInputProps = {
    label: string,
    onChange: (value: number) => void
}
export default function DurationInput(props: DurationInputProps) {
    const [duration, setDuration] = React.useState<number>(0);
    const [durationType, setDurationType] = React.useState<number>(1);

    function handleDurationChange(event: React.ChangeEvent<HTMLInputElement>) {
        setDuration(parseFloat(event.target.value) || 0);
    }

    function handleDurationTypeChange(event: React.ChangeEvent<HTMLInputElement>) {
        setDurationType(parseInt(event.target.value));
    }

    React.useEffect(() => {
        props.onChange(duration * durationType);
    }, [duration, durationType]);

    return (
        <>
            <Stack direction='row' spacing={2}>
                <DecimalInput label={props.label} value={duration.toString()} onChange={handleDurationChange} />
                <TextField
                value={durationType}
                name="auctionType"
                onChange={handleDurationTypeChange}
                select
                label="Time Unit"
                >
                    <MenuItem key={1} value={1}>
                        Seconds
                    </MenuItem>
                    <MenuItem key={2} value={60}>
                        Minutes
                    </MenuItem>
                    <MenuItem key={3} value={60 * 60}>
                        Hours
                    </MenuItem>
                    <MenuItem key={4} value={60 * 60 * 24}>
                        Days
                    </MenuItem>
                    <MenuItem key={5} value={60 * 60 * 24 * 7}>
                        Weeks
                    </MenuItem>
                    <MenuItem key={6} value={60 * 60 * 24 * 30}>
                        Months
                    </MenuItem>
                    <MenuItem key={7} value={60 * 60 * 24 * 365}>
                        Years
                    </MenuItem>
                </TextField>
            </Stack>
        </>
    );
}