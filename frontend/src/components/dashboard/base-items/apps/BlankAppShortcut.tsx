import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';
import React from 'react';

import { styles } from '../../../../theme/styles';
import { WidgetContainer } from '../widgets/WidgetContainer';

type Props = {
    id: string;
    editMode: boolean;
    isOverlay?: boolean;
    onDelete?: () => void;
    onEdit?: () => void;
    onDuplicate?: () => void;
};

export const BlankAppShortcut: React.FC<Props> = ({ id, editMode, isOverlay = false, onDelete, onEdit, onDuplicate }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    return (
        <Box
            ref={!isOverlay ? setNodeRef : undefined}
            {...(!isOverlay ? attributes : {})}
            {...(!isOverlay ? listeners : {})}
            sx={{
                gridColumn: { xs: 'span 4', sm: 'span 3', md: 'span 2', lg: 'span 1', xl: 'span 1' },
                transition,
                transform: transform ? CSS.Translate.toString(transform) : undefined,
                opacity: isOverlay ? .6 : 1,
                visibility: isDragging ? 'hidden' : 'visible',
            }}
        >
            <WidgetContainer editMode={editMode} id={id} onDelete={onDelete} onEdit={onEdit} onDuplicate={onDuplicate} appShortcut placeholder>
                {/* <AppShortcut url={url} name={name} iconName={iconName} /> */}
                <Box sx={{ width: { xs: '45%', sm: '40%', md: '55%', lg: '50%', xl: '35%' } }} />
            </WidgetContainer>
        </Box>
    );
};
