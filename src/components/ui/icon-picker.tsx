/** @format */

"use client";

import * as React from "react";
import { useState, useMemo, useCallback, useEffect } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DynamicIcon, dynamicIconImports } from "lucide-react/dynamic";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { iconsData } from "./icons-data";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Skeleton } from "@/components/ui/skeleton";
import Fuse from "fuse.js";
import { useDebounceValue } from "usehooks-ts";

export type IconData = (typeof iconsData)[number];

// Derive IconName type from dynamicIconImports keys
export type IconName = keyof typeof dynamicIconImports;

interface IconPickerProps
    extends Omit<
        React.ComponentPropsWithoutRef<typeof PopoverTrigger>,
        "onSelect" | "onOpenChange"
    > {
    value?: IconName;
    defaultValue?: IconName;
    onValueChange?: (value: IconName) => void;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    searchable?: boolean;
    searchPlaceholder?: string;
    triggerPlaceholder?: string;
    iconsList?: IconData[];
    categorized?: boolean;
    modal?: boolean;
}

const IconRenderer = React.memo(({ name }: { name: IconName }) => {
    return <Icon name={name} />;
});
IconRenderer.displayName = "IconRenderer";

const IconsColumnSkeleton = () => {
    return (
        <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-4 w-1/2 rounded-md" />
            <div className="grid grid-cols-5 gap-2 w-full">
                {Array.from({ length: 40 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className="h-10 w-10 rounded-md"
                    />
                ))}
            </div>
        </div>
    );
};

const useIconsData = () => {
    const [icons, setIcons] = useState<IconData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const loadIcons = async () => {
            setIsLoading(true);

            const { iconsData } = await import("./icons-data");
            if (isMounted) {
                setIcons(
                    iconsData.filter((icon: IconData) => {
                        return icon.name in dynamicIconImports;
                    })
                );
                setIsLoading(false);
            }
        };

        loadIcons();

        return () => {
            isMounted = false;
        };
    }, []);

    return { icons, isLoading };
};

const IconPicker = React.forwardRef<
    React.ComponentRef<typeof PopoverTrigger>,
    IconPickerProps
>(
    (
        {
            value,
            defaultValue,
            onValueChange,
            open,
            defaultOpen,
            onOpenChange,
            children,
            searchable = true,
            searchPlaceholder = "Search for an icon...",
            triggerPlaceholder = "Select an icon",
            iconsList,
            categorized = true,
            modal = false,
            ...props
        },
        ref
    ) => {
        const [selectedIcon, setSelectedIcon] = useState<IconName | undefined>(
            defaultValue
        );
        const [isOpen, setIsOpen] = useState(defaultOpen || false);
        const [search, setSearch] = useDebounceValue("", 100);
        const [isPopoverVisible, setIsPopoverVisible] = useState(false);
        const { icons } = useIconsData();
        const [isLoading, setIsLoading] = useState(true);

        const iconsToUse = useMemo(
            () => iconsList || icons,
            [iconsList, icons]
        );

        const fuseInstance = useMemo(() => {
            return new Fuse(iconsToUse, {
                keys: ["name", "tags", "categories"],
                threshold: 0.3,
                ignoreLocation: true,
                includeScore: true,
            });
        }, [iconsToUse]);

        const filteredIcons = useMemo(() => {
            if (search.trim() === "") {
                return iconsToUse;
            }

            const results = fuseInstance.search(search.toLowerCase().trim());
            return results.map((result) => result.item);
        }, [search, iconsToUse, fuseInstance]);

        const categorizedIcons = useMemo(() => {
            if (!categorized || search.trim() !== "") {
                return [{ name: "All Icons", icons: filteredIcons }];
            }

            const categories = new Map<string, IconData[]>();

            filteredIcons.forEach((icon) => {
                if (icon.categories && icon.categories.length > 0) {
                    icon.categories.forEach((category) => {
                        if (!categories.has(category)) {
                            categories.set(category, []);
                        }
                        categories.get(category)!.push(icon);
                    });
                } else {
                    const category = "Other";
                    if (!categories.has(category)) {
                        categories.set(category, []);
                    }
                    categories.get(category)!.push(icon);
                }
            });

            return Array.from(categories.entries())
                .map(([name, icons]) => ({ name, icons }))
                .sort((a, b) => a.name.localeCompare(b.name));
        }, [filteredIcons, categorized, search]);

        const virtualItems = useMemo(() => {
            const items: Array<{
                type: "category" | "row";
                categoryIndex: number;
                rowIndex?: number;
                icons?: IconData[];
            }> = [];

            categorizedIcons.forEach((category, categoryIndex) => {
                items.push({ type: "category", categoryIndex });

                const rows = [];
                for (let i = 0; i < category.icons.length; i += 5) {
                    rows.push(category.icons.slice(i, i + 5));
                }

                rows.forEach((rowIcons, rowIndex) => {
                    items.push({
                        type: "row",
                        categoryIndex,
                        rowIndex,
                        icons: rowIcons,
                    });
                });
            });

            return items;
        }, [categorizedIcons]);

        const categoryIndices = useMemo(() => {
            const indices: Record<string, number> = {};

            virtualItems.forEach((item, index) => {
                if (item.type === "category") {
                    indices[categorizedIcons[item.categoryIndex].name] = index;
                }
            });

            return indices;
        }, [virtualItems, categorizedIcons]);

        const parentRef = React.useRef<HTMLDivElement>(null);

        const virtualizer = useVirtualizer({
            count: virtualItems.length,
            getScrollElement: () => parentRef.current,
            estimateSize: (index) =>
                virtualItems[index].type === "category" ? 25 : 40,
            paddingEnd: 2,
            gap: 10,
            overscan: 5,
        });

        const handleValueChange = useCallback(
            (icon: IconName) => {
                if (value === undefined) {
                    setSelectedIcon(icon);
                }
                onValueChange?.(icon);
            },
            [value, onValueChange]
        );

        const handleOpenChange = useCallback(
            (newOpen: boolean) => {
                setSearch("");
                if (open === undefined) {
                    setIsOpen(newOpen);
                }
                onOpenChange?.(newOpen);

                setIsPopoverVisible(newOpen);

                if (newOpen) {
                    setTimeout(() => {
                        virtualizer.measure();
                        setIsLoading(false);
                    }, 1);
                }
            },
            [open, onOpenChange, virtualizer]
        );

        const handleIconClick = useCallback(
            (iconName: IconName) => {
                handleValueChange(iconName);
                setIsOpen(false);
                setSearch("");
            },
            [handleValueChange]
        );

        const handleSearchChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                setSearch(e.target.value);

                if (parentRef.current) {
                    parentRef.current.scrollTop = 0;
                }

                virtualizer.scrollToOffset(0);
            },
            [virtualizer]
        );

        const scrollToCategory = useCallback(
            (categoryName: string) => {
                const categoryIndex = categoryIndices[categoryName];

                if (categoryIndex !== undefined && virtualizer) {
                    virtualizer.scrollToIndex(categoryIndex, {
                        align: "start",
                        behavior: "smooth",
                    });
                }
            },
            [categoryIndices, virtualizer]
        );

        const categoryScrollRef = React.useRef<HTMLDivElement>(null);

        // Handle wheel events for horizontal category scroll
        const handleCategoryWheel = useCallback(
            (e: React.WheelEvent<HTMLDivElement>) => {
                const element = categoryScrollRef.current;
                if (element) {
                    e.preventDefault();
                    element.scrollLeft += e.deltaY;
                }
            },
            []
        );

        const categoryButtons = useMemo(() => {
            if (!categorized || search.trim() !== "") return null;

            return categorizedIcons.map((category) => (
                <Button
                    key={category.name}
                    variant={"outline"}
                    size="sm"
                    className="text-xs"
                    onClick={(e) => {
                        e.stopPropagation();
                        scrollToCategory(category.name);
                    }}
                >
                    {category.name.charAt(0).toUpperCase() +
                        category.name.slice(1)}
                </Button>
            ));
        }, [categorizedIcons, scrollToCategory, categorized, search]);

        const renderIcon = useCallback(
            (icon: IconData) => (
                <TooltipProvider key={icon.name}>
                    <Tooltip>
                        <TooltipTrigger
                            className={cn(
                                "p-2 rounded-md border hover:bg-foreground/10 transition",
                                "flex items-center justify-center"
                            )}
                            onClick={() =>
                                handleIconClick(icon.name as IconName)
                            }
                        >
                            <IconRenderer name={icon.name as IconName} />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{icon.name}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ),
            [handleIconClick]
        );

        const renderVirtualContent = useCallback(() => {
            if (filteredIcons.length === 0) {
                return (
                    <div className="text-center text-gray-500">
                        No icon found
                    </div>
                );
            }

            return (
                <div
                    className="relative w-full overscroll-contain"
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                    }}
                >
                    {virtualizer.getVirtualItems().map((virtualItem) => {
                        const item = virtualItems[virtualItem.index];

                        if (!item) return null;

                        const itemStyle = {
                            position: "absolute" as const,
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                        };

                        if (item.type === "category") {
                            return (
                                <div
                                    key={virtualItem.key}
                                    style={itemStyle}
                                    className="top-0 bg-background z-10"
                                >
                                    <h3 className="font-medium text-sm capitalize">
                                        {
                                            categorizedIcons[item.categoryIndex]
                                                .name
                                        }
                                    </h3>
                                    <div className="h-px bg-foreground/10 w-full" />
                                </div>
                            );
                        }

                        return (
                            <div
                                key={virtualItem.key}
                                data-index={virtualItem.index}
                                style={itemStyle}
                            >
                                <div className="grid grid-cols-5 gap-2 w-full">
                                    {item.icons!.map(renderIcon)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }, [
            virtualizer,
            virtualItems,
            categorizedIcons,
            filteredIcons,
            renderIcon,
        ]);

        React.useEffect(() => {
            if (isPopoverVisible) {
                setIsLoading(true);
                const timer = setTimeout(() => {
                    setIsLoading(false);
                    virtualizer.measure();
                }, 10);

                const resizeObserver = new ResizeObserver(() => {
                    virtualizer.measure();
                });

                const scrollElement = parentRef.current;
                if (scrollElement) {
                    resizeObserver.observe(scrollElement);

                    return () => {
                        clearTimeout(timer);
                        resizeObserver.disconnect();
                    };
                }

                return () => {
                    clearTimeout(timer);
                    resizeObserver.disconnect();
                };
            }
        }, [isPopoverVisible, virtualizer]);

        return (
            <Popover
                open={open ?? isOpen}
                onOpenChange={handleOpenChange}
                modal={modal}
            >
                <PopoverTrigger
                    ref={ref}
                    asChild
                    {...props}
                >
                    {children || (
                        <Button variant="outline">
                            {value || selectedIcon ? (
                                <>
                                    <Icon name={(value || selectedIcon)!} />{" "}
                                    {value || selectedIcon}
                                </>
                            ) : (
                                triggerPlaceholder
                            )}
                        </Button>
                    )}
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2">
                    {searchable && (
                        <Input
                            placeholder={searchPlaceholder}
                            onChange={handleSearchChange}
                            className="mb-2"
                        />
                    )}
                    {categorized && search.trim() === "" && (
                        <div
                            ref={categoryScrollRef}
                            className="flex flex-row gap-1 mt-2 overflow-x-auto pb-2"
                            style={{ 
                                WebkitOverflowScrolling: "touch",
                                touchAction: "pan-x"
                            }}
                            onWheel={handleCategoryWheel}
                        >
                            {categoryButtons}
                        </div>
                    )}
                    <div
                        ref={parentRef}
                        className="max-h-60 overflow-auto"
                        style={{ 
                            scrollbarWidth: "thin",
                            WebkitOverflowScrolling: "touch",
                            touchAction: "pan-y"
                        }}
                        onWheel={(e) => {
                            // Handle wheel events for vertical scrolling
                            const element = parentRef.current;
                            if (!element || e.deltaY === 0) {
                                return;
                            }

                            // Only handle if scrolling vertically (not horizontally)
                            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) {
                                return;
                            }

                            // Check if element can scroll
                            const canScroll =
                                element.scrollHeight > element.clientHeight;

                            if (canScroll) {
                                // Prevent default to stop page scrolling
                                e.preventDefault();
                                e.stopPropagation();

                                // Calculate new scroll position
                                const currentScrollTop = element.scrollTop;
                                const newScrollTop =
                                    currentScrollTop + e.deltaY;
                                const maxScrollTop =
                                    element.scrollHeight - element.clientHeight;

                                // Clamp to valid range and scroll
                                element.scrollTop = Math.max(
                                    0,
                                    Math.min(newScrollTop, maxScrollTop)
                                );
                            }
                        }}
                    >
                        {isLoading ? (
                            <IconsColumnSkeleton />
                        ) : (
                            renderVirtualContent()
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        );
    }
);
IconPicker.displayName = "IconPicker";

interface IconProps
    extends Omit<
        React.ComponentPropsWithoutRef<typeof DynamicIcon>,
        "name" | "ref"
    > {
    name: IconName;
}

const Icon = React.forwardRef<
    React.ComponentRef<typeof DynamicIcon>,
    IconProps
>(({ name, ...props }, ref) => {
    return (
        <DynamicIcon
            name={name}
            {...props}
            ref={ref}
        />
    );
});
Icon.displayName = "Icon";

export { IconPicker, Icon };
