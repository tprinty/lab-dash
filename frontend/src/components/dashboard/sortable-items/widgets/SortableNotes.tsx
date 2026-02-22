import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';
import React from 'react';

import { NotesWidget } from '../../base-items/widgets/NotesWidget/NotesWidget';
import { WidgetContainer } from '../../base-items/widgets/WidgetContainer';

interface Props {
    id: string;
    editMode?: boolean;
    isOverlay?: boolean;
    onDelete?: () => void;
    onEdit?: () => void;
    onDuplicate?: () => void;
    config?: any;
}

export const SortableNotes: React.FC<Props> = ({
    id,
    editMode = false,
    isOverlay = false,
    onDelete,
    onEdit,
    onDuplicate,
    config
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    return (
        <Box
            ref={!isOverlay ? setNodeRef : undefined}
            {...(!isOverlay ? attributes : {})}
            {...(!isOverlay ? listeners : {})}
            sx={{
                gridColumn: { xs: "span 12", sm: "span 6", lg: "span 4" },
                transition,
                transform: transform ? CSS.Translate.toString(transform) : undefined,
                opacity: isOverlay ? .6 : 1,
                visibility: isDragging ? 'hidden' : 'visible',
            }}
        >
            <WidgetContainer editMode={editMode} id={id} onDelete={onDelete} onEdit={onEdit} onDuplicate={onDuplicate}>
                <NotesWidget config={config} />
            </WidgetContainer>
        </Box>
    );
};
