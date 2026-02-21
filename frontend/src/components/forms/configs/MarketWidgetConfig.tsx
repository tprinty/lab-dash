import { Grid2 as Grid } from '@mui/material';
import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CheckboxElement, SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { useIsMobile } from '../../../hooks/useIsMobile';
import { COLORS } from '../../../theme/styles';
import { theme } from '../../../theme/theme';
import { FormValues } from '../AddEditForm/types';

const REFRESH_INTERVAL_OPTIONS = [
    { id: 60000, label: '1 minute' },
    { id: 300000, label: '5 minutes' },
    { id: 900000, label: '15 minutes' },
    { id: 1800000, label: '30 minutes' },
];

const ASSET_OPTIONS = [
    { symbol: '^GSPC', label: 'S&P 500' },
    { symbol: '^DJI', label: 'Dow Jones' },
    { symbol: '^IXIC', label: 'Nasdaq' },
    { symbol: '^VIX', label: 'VIX' },
    { symbol: 'GC=F', label: 'Gold' },
    { symbol: 'SI=F', label: 'Silver' },
    { symbol: 'BTC-USD', label: 'Bitcoin' },
];

interface MarketWidgetConfigProps {
    formContext: UseFormReturn<FormValues>;
}

export const MarketWidgetConfig = ({ formContext }: MarketWidgetConfigProps) => {
    const isMobile = useIsMobile();

    useEffect(() => {
        const currentRefreshInterval = formContext.getValues('marketRefreshInterval');
        const currentShowLabel = formContext.getValues('showLabel');

        if (!currentRefreshInterval) {
            formContext.setValue('marketRefreshInterval', 300000);
        }
        if (currentShowLabel === undefined) {
            formContext.setValue('showLabel', true);
        }
        // Initialize all asset toggles to true if not set
        ASSET_OPTIONS.forEach(asset => {
            const key = `marketAsset_${asset.symbol.replace(/[^a-zA-Z0-9]/g, '_')}` as keyof FormValues;
            const current = formContext.getValues(key);
            if (current === undefined) {
                formContext.setValue(key as any, true);
            }
        });
    }, [formContext]);

    const inputStyling = {
        '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'text.primary' },
            '&:hover fieldset': { borderColor: theme.palette.primary.main },
            '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
        },
        width: '100%',
        minWidth: isMobile ? '65vw' : '20vw',
    };

    const selectStyling = {
        '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'text.primary' },
            '.MuiSvgIcon-root ': { fill: theme.palette.text.primary },
            '&:hover fieldset': { borderColor: theme.palette.primary.main },
            '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
        },
        width: '100%',
        minWidth: isMobile ? '65vw' : '20vw',
        '& .MuiMenuItem-root:hover': { backgroundColor: `${COLORS.LIGHT_GRAY_HOVER} !important` },
        '& .MuiMenuItem-root.Mui-selected': { backgroundColor: `${theme.palette.primary.main} !important`, color: 'white' },
        '& .MuiMenuItem-root.Mui-selected:hover': { backgroundColor: `${theme.palette.primary.main} !important`, color: 'white' }
    };

    return (
        <Grid container spacing={2} direction='column'>
            <Grid>
                <SelectElement
                    label='Refresh Interval'
                    name='marketRefreshInterval'
                    options={REFRESH_INTERVAL_OPTIONS}
                    required
                    fullWidth
                    sx={selectStyling}
                />
            </Grid>

            <Grid>
                <TextFieldElement
                    label='Display Name'
                    name='displayName'
                    fullWidth
                    helperText='Custom name for the widget header (optional)'
                    sx={inputStyling}
                />
            </Grid>

            <Grid>
                <CheckboxElement
                    label='Show Label'
                    name='showLabel'
                    sx={{
                        ml: 1,
                        color: 'white',
                        '& .MuiSvgIcon-root': { fontSize: 30 }
                    }}
                />
            </Grid>

            {ASSET_OPTIONS.map(asset => (
                <Grid key={asset.symbol}>
                    <CheckboxElement
                        label={asset.label}
                        name={`marketAsset_${asset.symbol.replace(/[^a-zA-Z0-9]/g, '_')}` as any}
                        sx={{
                            ml: 1,
                            color: 'white',
                            '& .MuiSvgIcon-root': { fontSize: 30 }
                        }}
                    />
                </Grid>
            ))}
        </Grid>
    );
};
