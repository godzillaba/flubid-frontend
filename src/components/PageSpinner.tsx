import { CircularProgress, useTheme } from '@mui/material';
import { Stack } from '@mui/system';
import React from 'react';

export default function PageSpinner() {
    const theme = useTheme();
    return (
        <div style={{ marginTop: theme.spacing(10) }}>
            <Stack
                direction="row"
                justifyContent="center"
                alignItems="center"
                spacing={2}
            >
                <CircularProgress color='inherit' />
            </Stack>
        </div>
    );
}

