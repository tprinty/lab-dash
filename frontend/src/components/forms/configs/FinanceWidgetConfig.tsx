import { Grid2 as Grid } from '@mui/material';
import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CheckboxElement, SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { useIsMobile } from '../../../hooks/useIsMobile';
import { COLORS } from '../../../theme/styles';
import { theme } from '../../../theme/theme';
import { FormValues } from '../AddEditForm/types';

const REFRESH_INTERVAL_OPTIONS = [
    { id: 300000, label: '5 minutes' },
    { id: 900000, label: '15 minutes' },
    { id: 1800000, label: '30 minutes' },
    { id: 3600000, label: '1 hour' }
];

interface FinanceWidgetConfigProps {
    formContext: UseFormReturn<FormValues>;
}

export const FinanceWidgetConfig = ({ formContext }: FinanceWidgetConfigProps) => {
    const isMobile = useIsMobile();

    useEffect(() => {
        const currentRefreshInterval = formContext.getValues('financeRefreshInterval');
        const currentShowLabel = formContext.getValues('showLabel');
        const currentCsvPath = formContext.getValues('financeCsvPath');

        if (!currentRefreshInterval) {
            formContext.setValue('financeRefreshInterval', 900000);
        }
        if (currentShowLabel === undefined) {
            formContext.setValue('showLabel', true);
        }
        if (!currentCsvPath) {
            formContext.setValue('financeCsvPath', '/home/tprinty/clawd/data/balances.csv');
        }
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
                <TextFieldElement
                    label='CSV File Path'
                    name='financeCsvPath'
                    fullWidth
                    helperText='Path to the balances CSV file on the server'
                    sx={inputStyling}
                />
            </Grid>

            <Grid>
                <SelectElement
                    label='Refresh Interval'
                    name='financeRefreshInterval'
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
        </Grid>
    );
};
