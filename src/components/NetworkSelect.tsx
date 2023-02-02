import React from 'react';
import { FormControl, MenuItem, Select } from '@material-ui/core';
import { useNetwork, useSwitchNetwork } from 'wagmi';

export default function NetworkSelect() {
  const { chain } = useNetwork()
  const { chains, error, isLoading, pendingChainId, switchNetwork } = useSwitchNetwork()

  const [network, setNetwork] = React.useState(chain?.id.toString() || "5");

  const handleChange = (event: any) => {
    if (switchNetwork) switchNetwork(event.target.value);
    setNetwork(event.target.value);
  };

  return (
    <div>
      <FormControl>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={network}
          onChange={handleChange}
        >
          {
            chains.map(chainOption => 
              <MenuItem value={chainOption.id}>{chainOption.name}</MenuItem>
            )
          }
        </Select>
      </FormControl>
    </div>
  );

}