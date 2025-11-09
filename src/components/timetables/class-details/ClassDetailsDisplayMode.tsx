/** @format */

"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { sanitizeHtml } from "@/lib/html-utils";
import parse, { type DOMNode, Text } from "html-react-parser";

interface ClassDetailsDisplayModeProps {
    displayText: string;
}

const HashtagBadge: React.FC<{ tag: string }> = ({ tag }) => (
    <Badge
        variant="secondary"
        className="inline-flex items-center bg-blue-100 text-blue-800"
    >
        #{tag}
    </Badge>
);

const ClassDetailsDisplayMode: React.FC<ClassDetailsDisplayModeProps> = ({
    displayText,
}) => {
    const contentStyle = `
        .class-content ol {
            list-style-type: decimal;
            margin-left: 1.5em;
        }
        .class-content ul {
            list-style-type: disc;
            margin-left: 1.5em;
        }
        .class-content li {
            display: list-item;
        }
        .class-content h1 {
            font-size: 2em;
            font-weight: bold;
            margin-top: 0.75rem;
            margin-bottom: 0.2rem;
        }
        .class-content h2 {
            font-size: 1.75em;
            font-weight: bold;
            margin-top: 0.75rem;
            margin-bottom: 0.2rem;
        }
        .class-content h3 {
            font-size: 1.5em;
            font-weight: bold;
            display: list-item;
        }
    `;

    const sanitized = sanitizeHtml(displayText);

    const options = {
        replace: (domNode: DOMNode) => {
            if (domNode instanceof Text) {
                const textContent = domNode.data;
                const hashtagRegex = /#[^\s]+/g;
                const parts: React.ReactNode[] = [];
                let lastIndex = 0;
                let match;

                while ((match = hashtagRegex.exec(textContent)) !== null) {
                    if (match.index > lastIndex) {
                        parts.push(
                            textContent.substring(lastIndex, match.index)
                        );
                    }
                    parts.push(
                        <HashtagBadge
                            key={match.index}
                            tag={match[0].slice(1)}
                        />
                    );
                    lastIndex = match.index + match[0].length;
                }

                if (lastIndex < textContent.length) {
                    parts.push(textContent.substring(lastIndex));
                }

                return <>{parts}</>;
            }
            return undefined;
        },
    };

    const processedText = parse(sanitized, options);

    return (
        <>
            <style>{contentStyle}</style>
            {displayText ? (
                <div className="class-content">{processedText}</div>
            ) : (
                <div className="text-muted-foreground">
                    No content available for this class.
                </div>
            )}
        </>
    );
};

export default ClassDetailsDisplayMode;
