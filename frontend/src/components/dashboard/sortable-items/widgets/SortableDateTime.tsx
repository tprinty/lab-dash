import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';
import React from 'react';

import { DateTimeWidget } from '../../base-items/widgets/DateTimeWidget';
import { WidgetContainer } from '../../base-items/widgets/WidgetContainer';

type DateTimeConfig = {
    location?: {
        name: string;
        latitude: number;
        longitude: number;
    } | null;
    timezone?: string;
    use24Hour?: boolean;
};

type Props = {
    id: string;
    editMode: boolean;
    isOverlay?: boolean;
    onDelete?: () => void;
    onEdit?: () => void;
    onDuplicate?: () => void;
    config?: DateTimeConfig;
};

export const SortableDateTimeWidget: React.FC<Props> = ({
    id,
    editMode,
    isOverlay = false,
    onDelete,
    onEdit,
    onDuplicate,
    config
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    // Ensure we have a properly typed config for the DateTimeWidget
    // Only extract the properties we need, ignore the rest
    const dateTimeConfig: DateTimeConfig = {
        location: config?.location || null,
        timezone: config?.timezone || undefined,
        use24Hour: config?.use24Hour || false
    };

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
                <DateTimeWidget config={dateTimeConfig} />
            </WidgetContainer>
        </Box>
    );
};
