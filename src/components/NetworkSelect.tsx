import React from 'react';
import { FormControl, MenuItem, Select } from '@material-ui/core';

export default function NetworkSelect() {
    const [network, setNetwork] = React.useState("5");

    const handleChange = (event: any) => {
        setNetwork(event.target.value);
    };

    return (
        <FormControl>
            <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={network}
                onChange={handleChange}
            >
                <MenuItem value={5}>Goerli</MenuItem>
            </Select>
        </FormControl>
    );

}