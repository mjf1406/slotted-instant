import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface OptionalCollapsibleProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
}

export function OptionalCollapsible({
    title,
    children,
    className,
    contentClassName,
}: OptionalCollapsibleProps) {
    return (
        <Collapsible defaultOpen={false} className={className}>
            <CollapsibleTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                >
                    {title}
                    <ChevronDown className="size-4 shrink-0 transition-transform group-data-[state=open]/button:rotate-180" />
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent
                className={cn("grid gap-4 pt-4", contentClassName)}
            >
                {children}
            </CollapsibleContent>
        </Collapsible>
    );
}
