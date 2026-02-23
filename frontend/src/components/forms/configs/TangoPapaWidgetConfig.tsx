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

interface TangoPapaWidgetConfigProps {
    formContext: UseFormReturn<FormValues>;
}

export const TangoPapaWidgetConfig = ({ formContext }: TangoPapaWidgetConfigProps) => {
    const isMobile = useIsMobile();

    useEffect(() => {
        if (!formContext.getValues('tangoPapaRefreshInterval')) {
            formContext.setValue('tangoPapaRefreshInterval', 300000);
        }
        if (formContext.getValues('showLabel') === undefined) {
            formContext.setValue('showLabel', true);
        }
        if (!formContext.getValues('tangoPapaApiUrl')) {
            formContext.setValue('tangoPapaApiUrl', 'http://192.168.2.9:8088');
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
                    label='TangoPapa API URL'
                    name='tangoPapaApiUrl'
                    fullWidth
                    helperText='Base URL for TangoPapa (e.g. http://192.168.2.9:8088)'
                    sx={inputStyling}
                />
            </Grid>

            <Grid>
                <TextFieldElement
                    label='API Token'
                    name='tangoPapaApiToken'
                    fullWidth
                    type='password'
                    helperText='Bearer token from TangoPapa Settings → API Tokens'
                    sx={inputStyling}
                />
            </Grid>

            <Grid>
                <SelectElement
                    label='Refresh Interval'
                    name='tangoPapaRefreshInterval'
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
