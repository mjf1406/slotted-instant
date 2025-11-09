/** @format */

export interface FormErrors {
    days?: string;
    start_time?: string;
    end_time?: string;
    timetableId?: string;
}

export interface CreateTimeSlotDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export interface FormData {
    days: string[];
    start_time: string;
    end_time: string;
    timetableId: string;
}

