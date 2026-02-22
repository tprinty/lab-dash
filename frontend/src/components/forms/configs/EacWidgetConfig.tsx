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
    { id: 1800000, label: '30 minutes' }
];

const DEFAULT_CLIENTS = JSON.stringify([
    { name: 'Anderson Kreiger', domain: 'andersonkreiger.com', monthlyRate: 90 },
    { name: 'Belmont Barbershop', domain: 'belmontbarbershop.com', monthlyRate: 65 },
    { name: 'Bernkopf Legal', domain: 'bernkopflegal.com', monthlyRate: 360 },
    { name: 'Chicago WM', domain: 'chicagowm.com', monthlyRate: 120 },
    { name: 'Gordon Arata', domain: 'gordonarata.com', monthlyRate: 360 },
    { name: 'Ingalls Foundation', domain: 'ingallsfoundation.org', monthlyRate: 120 },
    { name: 'Quality Carpet Cleaning', domain: 'qualitycarpetcleaningco.co', monthlyRate: 60 },
    { name: 'Tarle Speech', domain: 'tarlespeech.com', monthlyRate: 120 },
    { name: 'Viti Companies', domain: 'viticompanies.com', monthlyRate: 120 },
    { name: 'Waterman Bank', domain: 'watermanbank.com', monthlyRate: 120 }
], null, 2);

interface EacWidgetConfigProps {
    formContext: UseFormReturn<FormValues>;
}

export const EacWidgetConfig = ({ formContext }: EacWidgetConfigProps) => {
    const isMobile = useIsMobile();

    useEffect(() => {
        if (!formContext.getValues('eacRefreshInterval')) {
            formContext.setValue('eacRefreshInterval', 300000);
        }
        if (formContext.getValues('showLabel') === undefined) {
            formContext.setValue('showLabel', true);
        }
        if (!formContext.getValues('eacDbHost')) {
            formContext.setValue('eacDbHost', '127.0.0.1');
        }
        if (!formContext.getValues('eacDbPort')) {
            formContext.setValue('eacDbPort', '5436');
        }
        if (!formContext.getValues('eacClientsJson')) {
            formContext.setValue('eacClientsJson', DEFAULT_CLIENTS);
        }
        if (!formContext.getValues('eacRevenueTarget')) {
            formContext.setValue('eacRevenueTarget', '40000');
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
                    label='TangoPapa DB Host'
                    name='eacDbHost'
                    fullWidth
                    helperText='PostgreSQL host for TangoPapa pipeline data'
                    sx={inputStyling}
                />
            </Grid>

            <Grid>
                <TextFieldElement
                    label='TangoPapa DB Port'
                    name='eacDbPort'
                    fullWidth
                    helperText='PostgreSQL port (default: 5436)'
                    sx={inputStyling}
                />
            </Grid>

            <Grid>
                <TextFieldElement
                    label='Revenue Target (Annual)'
                    name='eacRevenueTarget'
                    fullWidth
                    helperText='Annual revenue target in dollars'
                    sx={inputStyling}
                />
            </Grid>

            <Grid>
                <TextFieldElement
                    label='Client Data (JSON)'
                    name='eacClientsJson'
                    fullWidth
                    multiline
                    rows={8}
                    helperText='JSON array: [{name, domain, monthlyRate}]'
                    sx={inputStyling}
                />
            </Grid>

            <Grid>
                <SelectElement
                    label='Refresh Interval'
                    name='eacRefreshInterval'
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
