import { FormControl, MenuItem, Select } from '@mui/material';
import React from 'react';
import { useAccount, useConnect, useNetwork, useSwitchNetwork } from 'wagmi';
import { constants } from '../helpers';

export default function NetworkSelect() {
  const { chain } = useNetwork()
  const { chains, error, isLoading, isIdle, pendingChainId, switchNetwork } = useSwitchNetwork()

  const [network, setNetwork] = React.useState(chain?.id.toString() || "");

  const handleChange = (event: any) => {
    if (switchNetwork) switchNetwork(event.target.value);
    setNetwork(event.target.value);
  };

  if (chain?.id + '' != network) {
    setNetwork(chain?.id + '');
  }

  if (chain) {
    return (
      <>
        <FormControl>
          <Select
            value={network}
            onChange={handleChange}
            displayEmpty
          >
            {
              constants.chains.map(chainOption => 
                <MenuItem key={chainOption.id} value={chainOption.id}>{chainOption.name}</MenuItem>
              )
            }
          </Select>
        </FormControl>
      </>
    );
  }
  else {
    return null;
  }

}