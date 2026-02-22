import { Grid2 as Grid } from '@mui/material';
import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CheckboxElement, SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { useIsMobile } from '../../../hooks/useIsMobile';
import { COLORS } from '../../../theme/styles';
import { theme } from '../../../theme/theme';
import { FormValues } from '../AddEditForm/types';

const REFRESH_INTERVAL_OPTIONS = [
    { id: 30000, label: '30 seconds' },
    { id: 60000, label: '1 minute' },
    { id: 300000, label: '5 minutes' },
    { id: 900000, label: '15 minutes' }
];

interface ProxmoxWidgetConfigProps {
    formContext: UseFormReturn<FormValues>;
}

export const ProxmoxWidgetConfig = ({ formContext }: ProxmoxWidgetConfigProps) => {
    const isMobile = useIsMobile();

    useEffect(() => {
        if (!formContext.getValues('proxmoxHost')) {
            formContext.setValue('proxmoxHost', '192.168.2.12');
        }
        if (!formContext.getValues('proxmoxPort')) {
            formContext.setValue('proxmoxPort', '8006');
        }
        if (!formContext.getValues('proxmoxRefreshInterval')) {
            formContext.setValue('proxmoxRefreshInterval', 60000);
        }
        if (formContext.getValues('showLabel') === undefined) {
            formContext.setValue('showLabel', true);
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
                    label='Proxmox Host'
                    name='proxmoxHost'
                    fullWidth
                    helperText='Proxmox VE hostname or IP (e.g. 192.168.2.12)'
                    sx={inputStyling}
                />
            </Grid>

            <Grid>
                <TextFieldElement
                    label='Proxmox Port'
                    name='proxmoxPort'
                    fullWidth
                    helperText='API port (default: 8006)'
                    sx={inputStyling}
                />
            </Grid>

            <Grid>
                <TextFieldElement
                    label='API Token ID'
                    name='proxmoxTokenId'
                    fullWidth
                    helperText='Format: user@realm!tokenname (e.g. root@pam!dashboard)'
                    sx={inputStyling}
                />
            </Grid>

            <Grid>
                <TextFieldElement
                    label='API Token Secret'
                    name='proxmoxTokenSecret'
                    fullWidth
                    type='password'
                    helperText='The secret UUID for the API token'
                    sx={inputStyling}
                />
            </Grid>

            <Grid>
                <TextFieldElement
                    label='Docker API URL (optional)'
                    name='proxmoxDockerHost'
                    fullWidth
                    helperText='e.g. http://192.168.2.20:2375 — leave empty to skip Docker'
                    sx={inputStyling}
                />
            </Grid>

            <Grid>
                <SelectElement
                    label='Refresh Interval'
                    name='proxmoxRefreshInterval'
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
