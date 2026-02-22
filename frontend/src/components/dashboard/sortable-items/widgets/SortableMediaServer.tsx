import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';
import React from 'react';

import { MediaServerWidget } from '../../../dashboard/base-items/widgets/MediaServerWidget/MediaServerWidget';

type Props = {
    id: string;
    editMode: boolean;
    isOverlay?: boolean;
    onDelete?: () => void;
    onEdit?: () => void;
    onDuplicate?: () => void;
    config?: any;
    url?: string;
};

export const SortableMediaServer: React.FC<Props> = ({
    id,
    editMode,
    isOverlay = false,
    onDelete,
    onEdit,
    onDuplicate,
    config,
    url
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    return (
        <Box
            ref={!isOverlay ? setNodeRef : undefined}
            {...(!isOverlay ? attributes : {})}
            {...(!isOverlay ? listeners : {})}
            sx={{
                gridColumn: { xs: "span 12", sm: "span 6", lg: "span 4" },
                transition,
                transform: transform ? CSS.Translate.toString(transform) : undefined,
                opacity: isOverlay ? 0.6 : 1,
                visibility: isDragging ? 'hidden' : 'visible',
                touchAction: 'none',
                cursor: editMode ? 'grab' : 'auto'
            }}
        >
            <MediaServerWidget
                config={config}
                editMode={editMode}
                id={id}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
            />
        </Box>
    );
};
