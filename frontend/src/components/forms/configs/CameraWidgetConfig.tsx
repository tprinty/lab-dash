import { Grid2 as Grid } from '@mui/material';
import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CheckboxElement, SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { useIsMobile } from '../../../hooks/useIsMobile';
import { COLORS } from '../../../theme/styles';
import { theme } from '../../../theme/theme';
import { FormValues } from '../AddEditForm/types';

const ROTATION_INTERVAL_OPTIONS = [
    { id: 5000, label: '5 seconds' },
    { id: 10000, label: '10 seconds' },
    { id: 15000, label: '15 seconds' },
    { id: 30000, label: '30 seconds' },
    { id: 60000, label: '60 seconds' }
];

const QUALITY_OPTIONS = [
    { id: '0', label: 'HD (Main Stream)' },
    { id: '1', label: 'SD (Sub Stream)' }
];

interface CameraWidgetConfigProps {
    formContext: UseFormReturn<FormValues>;
}

export const CameraWidgetConfig = ({ formContext }: CameraWidgetConfigProps) => {
    const isMobile = useIsMobile();

    useEffect(() => {
        if (!formContext.getValues('cameraHost')) formContext.setValue('cameraHost', '192.168.2.10');
        if (!formContext.getValues('cameraPort')) formContext.setValue('cameraPort', '554');
        if (!formContext.getValues('cameraUsername')) formContext.setValue('cameraUsername', 'admin');
        if (!formContext.getValues('cameraChannels')) formContext.setValue('cameraChannels', '1,2,3,4');
        if (!formContext.getValues('cameraSubtype')) formContext.setValue('cameraSubtype', '1');
        if (!formContext.getValues('cameraRotationInterval')) formContext.setValue('cameraRotationInterval', 10000);
        if (formContext.getValues('showLabel') === undefined) formContext.setValue('showLabel', true);
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
                <TextFieldElement label='NVR Host' name='cameraHost' fullWidth helperText='IP address of the NVR' sx={inputStyling} />
            </Grid>
            <Grid>
                <TextFieldElement label='RTSP Port' name='cameraPort' fullWidth helperText='Default: 554' sx={inputStyling} />
            </Grid>
            <Grid>
                <TextFieldElement label='Username' name='cameraUsername' fullWidth sx={inputStyling} />
            </Grid>
            <Grid>
                <TextFieldElement label='Password' name='cameraPassword' type='password' fullWidth sx={inputStyling} />
            </Grid>
            <Grid>
                <TextFieldElement label='Channels' name='cameraChannels' fullWidth helperText='Comma-separated camera channels (e.g. 1,2,3,4)' sx={inputStyling} />
            </Grid>
            <Grid>
                <SelectElement label='Stream Quality' name='cameraSubtype' options={QUALITY_OPTIONS} fullWidth sx={selectStyling} />
            </Grid>
            <Grid>
                <SelectElement label='Rotation Interval' name='cameraRotationInterval' options={ROTATION_INTERVAL_OPTIONS} required fullWidth sx={selectStyling} />
            </Grid>
            <Grid>
                <TextFieldElement label='Display Name' name='displayName' fullWidth helperText='Custom widget header name' sx={inputStyling} />
            </Grid>
            <Grid>
                <CheckboxElement label='Show Label' name='showLabel' sx={{ ml: 1, color: 'white', '& .MuiSvgIcon-root': { fontSize: 30 } }} />
            </Grid>
        </Grid>
    );
};
