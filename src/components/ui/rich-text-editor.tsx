"use client";

import React, {
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { LinkNode } from "@lexical/link";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import {
    ListItemNode,
    ListNode,
    type ListType,
    $isListNode,
    INSERT_UNORDERED_LIST_COMMAND,
    INSERT_ORDERED_LIST_COMMAND,
    REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import {
    HeadingNode,
    QuoteNode,
    $isHeadingNode,
    $createHeadingNode,
    type HeadingTagType,
} from "@lexical/rich-text";
import {
    $createParagraphNode,
    $getRoot,
    $getSelection,
    $isElementNode,
    $isRangeSelection,
    $isRootOrShadowRoot,
    CAN_REDO_COMMAND,
    CAN_UNDO_COMMAND,
    COMMAND_PRIORITY_LOW,
    FORMAT_TEXT_COMMAND,
    FORMAT_ELEMENT_COMMAND,
    REDO_COMMAND,
    SELECTION_CHANGE_COMMAND,
    UNDO_COMMAND,
    type EditorState,
    type LexicalEditor,
    type ElementNode,
    type ElementFormatType,
} from "lexical";
import { mergeRegister, $findMatchingParent } from "@lexical/utils";
import { $setBlocksType } from "@lexical/selection";
import { cn } from "@/lib/utils";
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    List,
    ListOrdered,
    Undo,
    Redo,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    ChevronDown,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type BlockOption = "paragraph" | "h1" | "h2" | "h3";

const BLOCK_OPTIONS: Array<{ value: BlockOption; label: string }> = [
    { value: "paragraph", label: "Paragraph" },
    { value: "h1", label: "Heading 1" },
    { value: "h2", label: "Heading 2" },
    { value: "h3", label: "Heading 3" },
];

type AlignmentOption = "left" | "center" | "right" | "justify";

const ALIGNMENT_OPTIONS: Array<{ value: AlignmentOption; label: string }> = [
    { value: "left", label: "Align Left" },
    { value: "center", label: "Align Center" },
    { value: "right", label: "Align Right" },
    { value: "justify", label: "Justify" },
];

const ALIGNMENT_ICON: Record<AlignmentOption, React.ReactNode> = {
    left: <AlignLeft className="h-4 w-4" />,
    center: <AlignCenter className="h-4 w-4" />,
    right: <AlignRight className="h-4 w-4" />,
    justify: <AlignJustify className="h-4 w-4" />,
};

interface RichTextEditorProps {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    ariaInvalid?: boolean;
    ariaDescribedBy?: string;
    autoFocus?: boolean;
    showToolbar?: boolean;
    toolbarClassName?: string;
}

const theme = {
    text: {
        bold: "font-semibold",
        italic: "italic",
        underline: "underline",
        strikethrough: "line-through",
        code: "font-mono text-sm bg-muted px-1 py-0.5 rounded",
    },
    paragraph: "mb-2",
    heading: {
        h1: "text-2xl font-bold mb-4",
        h2: "text-xl font-semibold mb-3",
        h3: "text-lg font-semibold mb-2",
    },
    quote: "border-l-2 pl-4 italic text-muted-foreground",
    list: {
        ul: "list-disc ml-6",
        ol: "list-decimal ml-6",
        listitem: "mb-1",
        nested: {
            listitem: "ml-4",
        },
    },
    code: "bg-muted text-sm font-mono px-2 py-1 rounded",
};

const onError = (error: Error) => {
    console.error(error);
};

function replaceEmptyParagraph(root: ReturnType<typeof $getRoot>) {
    if (root.getChildrenSize() === 0) {
        root.append($createParagraphNode());
    }
}

function normalizeHtml(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        return "";
    }

    if (typeof window === "undefined") {
        return trimmed;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, "text/html");

    const textContent =
        doc.body.textContent?.replace(/\u00A0/g, " ").trim() ?? "";

    const hasRichContent = doc.body.querySelector(
        "img,video,audio,iframe,embed,object,table,ul,ol,li,blockquote,pre,code,hr"
    );

    if (!textContent && !hasRichContent) {
        return "";
    }

    return trimmed;
}

function prepareHtmlForEditor(value: string): string {
    if (typeof window === "undefined") {
        return value;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(value, "text/html");

    if (doc.body.childElementCount > 0) {
        return value;
    }

    if (!value) {
        return "";
    }

    const escaped = value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const withBreaks = escaped.replace(/\r?\n/g, "<br />");

    return `<p>${withBreaks}</p>`;
}

function ExternalValuePlugin({
    value,
    lastInternalValueRef,
}: {
    value: string;
    lastInternalValueRef: React.MutableRefObject<string>;
}) {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        const normalizedValue = normalizeHtml(value);
        if (normalizedValue === lastInternalValueRef.current) {
            return;
        }

        lastInternalValueRef.current = normalizedValue;

        editor.update(() => {
            const root = $getRoot();
            root.clear();

            if (!normalizedValue) {
                replaceEmptyParagraph(root);
                return;
            }

            const html = prepareHtmlForEditor(normalizedValue);

            if (html) {
                const parser = new DOMParser();
                const dom = parser.parseFromString(html, "text/html");
                const nodes = $generateNodesFromDOM(editor, dom);

                nodes.forEach((node) => root.append(node));
                replaceEmptyParagraph(root);
            } else {
                replaceEmptyParagraph(root);
            }
        });
    }, [editor, value, lastInternalValueRef]);

    return null;
}

export function RichTextEditor({
    id,
    value,
    onChange,
    placeholder,
    className,
    ariaInvalid,
    ariaDescribedBy,
    autoFocus,
    showToolbar = true,
    toolbarClassName,
}: RichTextEditorProps) {
    const lastInternalValueRef = useRef<string>("");
    const reactId = useId();

    const namespace = useMemo(() => `RichTextEditor-${reactId}`, [reactId]);

    const initialConfig = useMemo(
        () => ({
            namespace,
            theme,
            onError,
            nodes: [
                HeadingNode,
                QuoteNode,
                ListNode,
                ListItemNode,
                LinkNode,
                CodeNode,
                CodeHighlightNode,
            ],
        }),
        [namespace]
    );

    const handleChange = useCallback(
        (editorState: EditorState, editor: LexicalEditor) => {
            editorState.read(() => {
                const html = $generateHtmlFromNodes(editor, null);
                const normalized = normalizeHtml(html);

                if (normalized === lastInternalValueRef.current) {
                    return;
                }

                lastInternalValueRef.current = normalized;
                onChange(normalized);
            });
        },
        [onChange]
    );

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className="flex flex-col gap-2">
                {showToolbar && (
                    <ToolbarPlugin className={toolbarClassName} />
                )}
                <div className="relative">
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable
                                id={id}
                                aria-invalid={ariaInvalid || undefined}
                                aria-describedby={ariaDescribedBy}
                                className={cn(
                                    "relative min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                    "prose prose-sm max-w-none text-foreground",
                                    className
                                )}
                            />
                        }
                        placeholder={
                            placeholder ? (
                                <div className="pointer-events-none absolute left-3 top-2 text-sm text-muted-foreground">
                                    {placeholder}
                                </div>
                            ) : null
                        }
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                </div>
                <HistoryPlugin />
                <OnChangePlugin onChange={handleChange} />
                <ListPlugin />
                <ExternalValuePlugin
                    value={value}
                    lastInternalValueRef={lastInternalValueRef}
                />
                {autoFocus && <AutoFocusPlugin />}
            </div>
        </LexicalComposer>
    );
}

function ToolbarPlugin({ className }: { className?: string }) {
    const [editor] = useLexicalComposerContext();
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [blockType, setBlockType] = useState<string>("paragraph");
    const [blockAlignment, setBlockAlignment] =
        useState<ElementFormatType>("left");
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            setIsBold(false);
            setIsItalic(false);
            setIsUnderline(false);
            setIsStrikethrough(false);
            setBlockType("paragraph");
            setBlockAlignment("left");
            return;
        }

        setIsBold(selection.hasFormat("bold"));
        setIsItalic(selection.hasFormat("italic"));
        setIsUnderline(selection.hasFormat("underline"));
        setIsStrikethrough(selection.hasFormat("strikethrough"));

        const anchorNode = selection.anchor.getNode();
        let element: ElementNode | null = null;

        if (anchorNode.getKey() === "root") {
            const root = anchorNode;
            if ($isRootOrShadowRoot(root)) {
                const firstChild = root.getFirstChild();
                if ($isElementNode(firstChild)) {
                    element = firstChild;
                }
            }
        } else {
            try {
                element = anchorNode.getTopLevelElementOrThrow();
            } catch (error) {
                element = null;
            }
        }

        if ($isRootOrShadowRoot(element)) {
            const firstChild = element.getFirstChild();
            if (!$isElementNode(firstChild)) {
                setBlockType("paragraph");
                setBlockAlignment("left");
                return;
            }
            element = firstChild;
        }

        if (!element) {
            setBlockType("paragraph");
            setBlockAlignment("left");
            return;
        }

        setBlockAlignment(element.getFormatType());

        if ($isListNode(element)) {
            const parentList = $findMatchingParent(anchorNode, $isListNode);
            const list =
                parentList !== null ? (parentList as ListNode) : (element as ListNode);
            setBlockType(list.getListType());
            return;
        }

        if ($isHeadingNode(element)) {
            setBlockType(element.getTag());
            return;
        }

        setBlockType(element.getType());
    }, []);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    editor.getEditorState().read(() => {
                        updateToolbar();
                    });
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                CAN_UNDO_COMMAND,
                (payload: boolean) => {
                    setCanUndo(payload);
                    return false;
                },
                COMMAND_PRIORITY_LOW
            ),
            editor.registerCommand(
                CAN_REDO_COMMAND,
                (payload: boolean) => {
                    setCanRedo(payload);
                    return false;
                },
                COMMAND_PRIORITY_LOW
            )
        );
    }, [editor, updateToolbar]);

    const formatList = useCallback(
        (type: ListType) => {
            if (type === "bullet") {
                if (blockType === "bullet") {
                    editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
                } else {
                    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
                }
            } else if (type === "number") {
                if (blockType === "number") {
                    editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
                } else {
                    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
                }
            }
        },
        [blockType, editor]
    );

    const handleBlockTypeChange = useCallback(
        (value: BlockOption) => {
            editor.update(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) {
                    return;
                }

                if (value === "paragraph") {
                    $setBlocksType(selection, () => $createParagraphNode());
                } else {
                    $setBlocksType(selection, () =>
                        $createHeadingNode(value as HeadingTagType)
                    );
                }
            });
        },
        [editor]
    );

    const applyAlignment = useCallback(
        (alignment: AlignmentOption) => {
            const target: ElementFormatType =
                alignment === "left"
                    ? "left"
                    : alignment === "right"
                    ? "right"
                    : alignment === "center"
                    ? "center"
                    : "justify";
            editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, target);
        },
        [editor]
    );

    const selectedBlockOption = useMemo<BlockOption>(() => {
        if (blockType === "h1" || blockType === "h2" || blockType === "h3") {
            return blockType;
        }
        return "paragraph";
    }, [blockType]);

    const normalizedAlignment = useMemo<AlignmentOption>(() => {
        if (blockAlignment === "center") return "center";
        if (blockAlignment === "right" || blockAlignment === "end") return "right";
        if (blockAlignment === "justify") return "justify";
        return "left";
    }, [blockAlignment]);

    return (
        <div
            className={cn(
                "flex flex-wrap items-center gap-1 rounded-md border border-input bg-muted/40 p-1",
                className
            )}
        >
            <label className="sr-only" htmlFor="rte-block-select">
                Text style
            </label>
            <select
                id="rte-block-select"
                className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedBlockOption}
                onChange={(event) =>
                    handleBlockTypeChange(event.target.value as BlockOption)
                }
            >
                {BLOCK_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="inline-flex items-center gap-2"
                        aria-label="Text alignment"
                    >
                        {ALIGNMENT_ICON[normalizedAlignment]}
                        <ChevronDown className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                    <DropdownMenuRadioGroup
                        value={normalizedAlignment}
                        onValueChange={(value) =>
                            applyAlignment(value as AlignmentOption)
                        }
                    >
                        {ALIGNMENT_OPTIONS.map((option) => (
                            <DropdownMenuRadioItem
                                key={option.value}
                                value={option.value}
                                className="flex items-center gap-2"
                            >
                                {ALIGNMENT_ICON[option.value]}
                                <span>{option.label}</span>
                            </DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
            <ToolbarButton
                label="Undo"
                disabled={!canUndo}
                onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
            >
                <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                label="Redo"
                disabled={!canRedo}
                onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
            >
                <Redo className="h-4 w-4" />
            </ToolbarButton>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
            <ToolbarButton
                label="Bold"
                isActive={isBold}
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
            >
                <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                label="Italic"
                isActive={isItalic}
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
            >
                <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                label="Underline"
                isActive={isUnderline}
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
            >
                <Underline className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                label="Strikethrough"
                isActive={isStrikethrough}
                onClick={() =>
                    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
                }
            >
                <Strikethrough className="h-4 w-4" />
            </ToolbarButton>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
            <ToolbarButton
                label="Bulleted list"
                isActive={blockType === "bullet"}
                onClick={() => formatList("bullet")}
            >
                <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
                label="Numbered list"
                isActive={blockType === "number"}
                onClick={() => formatList("number")}
            >
                <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
        </div>
    );
}

interface ToolbarButtonProps {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    isActive?: boolean;
    children: React.ReactNode;
}

function ToolbarButton({
    label,
    onClick,
    disabled,
    isActive,
    children,
}: ToolbarButtonProps) {
    return (
        <button
            type="button"
            className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-sm transition-colors",
                isActive
                    ? "bg-foreground/15 text-foreground"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground",
                disabled ? "cursor-not-allowed opacity-50 hover:bg-transparent" : ""
            )}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            disabled={disabled}
            aria-pressed={isActive}
            aria-label={label}
            title={label}
        >
            {children}
        </button>
    );
}


