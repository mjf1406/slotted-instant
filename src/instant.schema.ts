/** @format */

// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
    entities: {
        // ----------------------
        //      Admin Tables
        // ----------------------
        $files: i.entity({
            path: i.string().unique().indexed(),
            url: i.string(),
        }),
        $users: i.entity({
            email: i.string().unique().indexed().optional(),
            imageURL: i.string().optional(),
            type: i.string().optional(),
        }),
        profiles: i.entity({
            joined: i.date(),
            plan: i.string(),
            firstName: i.string(),
            lastName: i.string(),
            googlePicture: i.string().optional(),
        }),
        // ----------------------
        //      Data Tables
        // ----------------------
        _5e_classes: i.entity({
            // Primary identifiers
            className: i.string().indexed(), // e.g., "Barbarian", "Wizard"
            primarySource: i.string().indexed(), // e.g., "XPHB", "PHB"
            classData: i.json(),
            classFeatures: i.json().optional(), // Array of class features
            subclasses: i.json().optional(), // Array of subclasses
            subclassFeatures: i.json().optional(), // Array of subclass features
            fullData: i.json(),
        }),

        // ----------------------
        //      User Tables
        // ----------------------
        todos: i.entity({
            text: i.string(),
            done: i.boolean(),
            createdAt: i.number(),
        }),
    },
    links: {
        // ----------------------
        //      Admin Tables
        // ----------------------
        $usersLinkedPrimaryUser: {
            forward: {
                on: "$users",
                has: "one",
                label: "linkedPrimaryUser",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "linkedGuestUsers",
            },
        },
        userProfiles: {
            forward: {
                on: "profiles",
                has: "one",
                label: "user",
            },
            reverse: {
                on: "$users",
                has: "one",
                label: "profile",
            },
        },
        // ----------------------
        //      User Tables
        // ----------------------
        todosOwners: {
            forward: {
                on: "todos",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "ownerTodos",
            },
        },
    },
    rooms: {
        todos: {
            presence: i.entity({}),
        },
        didjyahs: {
            presence: i.entity({}),
        },
    },
});

// This helps Typescript display nicer intellisense
type AppSchema = typeof _schema;
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
