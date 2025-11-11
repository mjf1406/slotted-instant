/** @format */

import type { IconName } from "@/components/ui/icon-picker";

export interface FormErrors {
    name?: string;
    days?: string;
    startTime?: string;
    endTime?: string;
    color?: string;
}

export interface CreateTimetableModalProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    timetable?: {
        id: string;
        name: string;
        days: string[];
        startTime: number;
        endTime: number;
        color?: string;
        iconName?: string;
    } | null;
}

export interface FormData {
    name: string;
    days: string[];
    startTime: string;
    endTime: string;
    color: string;
    iconName: IconName | "";
    sourceTimetableId: string | "";
}

export interface TimetableInput {
    id: string;
    name: string;
    days: string[];
    startTime: number;
    endTime: number;
    color?: string;
    iconName?: string;
}

