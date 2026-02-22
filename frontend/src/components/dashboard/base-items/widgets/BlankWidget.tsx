import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Typography } from '@mui/material';
import React from 'react';

import { WidgetContainer } from '../widgets/WidgetContainer';

type Props = {
    id: string;
    label?: string;
    isOverlay?: boolean;
    editMode: boolean;
    onDelete?: () => void;
    onEdit?: () => void;
    onDuplicate?: () => void;
    row?: boolean;
};

export const BlankWidget: React.FC<Props> = ({ id, label, editMode, isOverlay = false, onDelete, onEdit, onDuplicate, row }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    return (
        <Box
            ref={!isOverlay ? setNodeRef : undefined}
            {...(!isOverlay ? attributes : {})}
            {...(!isOverlay ? listeners : {})}
            sx={{
                gridColumn: row ? 'span 12' : { xs: 'span 12', sm: 'span 6', lg: 'span 4' },
                opacity: isOverlay ? .6 : 1,
                transition,
                transform: transform ? CSS.Translate.toString(transform) : undefined,
                visibility: isDragging ? 'hidden' : 'visible',
            }}
        >
            <WidgetContainer editMode={editMode} id={id} onDelete={onDelete} onEdit={onEdit} onDuplicate={onDuplicate} placeholder rowPlaceholder={row}>
                <Typography variant='h6' textAlign='center'>
                    {/* {label} */}
                </Typography>
            </WidgetContainer>
        </Box>
    );
};
