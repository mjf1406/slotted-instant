/** @format */

import type { IconName } from "@/components/ui/icon-picker";
import type { Class } from "@/lib/types";

export interface FormErrors {
    name?: string;
    bgColor?: string;
    textColor?: string;
    iconName?: string;
    defaultText?: string;
}

export interface CreateClassModalProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    classItem?: Class | null;
}

export interface FormData {
    name: string;
    bgColor: string;
    textColor: string;
    iconName: IconName | "";
    includeWeekInfo: boolean;
    defaultText: string;
}

