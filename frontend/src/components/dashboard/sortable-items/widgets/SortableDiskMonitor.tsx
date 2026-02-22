import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';
import React from 'react';

import { DiskMonitorWidget } from '../../base-items/widgets/DiskMonitorWidget';
import { WidgetContainer } from '../../base-items/widgets/WidgetContainer';

type Props = {
    id: string;
    editMode: boolean;
    isOverlay?: boolean;
    config?: {
        selectedDisks?: Array<{ mount: string; customName: string; showMountPath?: boolean }>;
        showIcons?: boolean;
        showMountPath?: boolean;
        layout?: '2x2' | '2x4' | '1x5';
        [key: string]: any;
    };
    onDelete?: () => void;
    onEdit?: () => void;
    onDuplicate?: () => void;
};

export const SortableDiskMonitor: React.FC<Props> = ({ id, editMode, isOverlay = false, config, onDelete, onEdit, onDuplicate }) => {
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
                visibility: isDragging ? 'hidden' : 'visible'
            }}
        >
            <WidgetContainer editMode={editMode} id={id} onDelete={onDelete} onEdit={onEdit} onDuplicate={onDuplicate}>
                <DiskMonitorWidget config={config} editMode={editMode} />
            </WidgetContainer>
        </Box>
    );
};
