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
    { id: 3600000, label: '1 hour' },
];

interface SprintWidgetConfigProps {
    formContext: UseFormReturn<FormValues>;
}

export const SprintWidgetConfig = ({ formContext }: SprintWidgetConfigProps) => {
    const isMobile = useIsMobile();

    useEffect(() => {
        const currentRefresh = formContext.getValues('sprintRefreshInterval');
        const currentShowLabel = formContext.getValues('showLabel');
        const currentRepos = formContext.getValues('sprintRepos');

        if (!currentRefresh) {
            formContext.setValue('sprintRefreshInterval', 900000);
        }
        if (currentShowLabel === undefined) {
            formContext.setValue('showLabel', true);
        }
        if (!currentRepos) {
            formContext.setValue('sprintRepos', 'tprinty/tangopapa,tprinty/wpsentinelai,tprinty/developer-metrics-dashboard');
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
                    label='GitHub Token'
                    name='sprintToken'
                    type='password'
                    required
                    fullWidth
                    helperText='Personal access token with repo scope'
                    sx={inputStyling}
                />
            </Grid>

            <Grid>
                <TextFieldElement
                    label='Repositories'
                    name='sprintRepos'
                    required
                    fullWidth
                    helperText='Comma-separated: owner/repo, owner/repo'
                    sx={inputStyling}
                />
            </Grid>

            <Grid>
                <SelectElement
                    label='Refresh Interval'
                    name='sprintRefreshInterval'
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
