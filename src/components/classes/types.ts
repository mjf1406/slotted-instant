/** @format */

import type { IconName } from "@/components/ui/icon-picker";
import type { Class } from "@/lib/types";

export interface FormErrors {
    name?: string;
    color?: string;
    iconName?: string;
}

export interface CreateClassModalProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    classItem?: Class | null;
}

export interface FormData {
    name: string;
    color: string;
    iconName: IconName | "";
    includeWeekInfo: boolean;
}

