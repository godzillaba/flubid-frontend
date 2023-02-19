import { TextField } from "@mui/material";

type DecimalInputProps = {
    label: string,
    onChange: (value: React.ChangeEvent<HTMLInputElement>) => void,
    value: string,
    steps?: number
}

export function DecimalInput(props: DecimalInputProps) {
    return (
        <TextField 
        label={props.label} 
        variant='outlined'
        value={parseFloat(props.value) || ''}
        onChange={props.onChange}
        type="number"
        inputProps={{ step: props.steps || 2 }}/>
    )
}