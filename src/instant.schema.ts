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
        users: i.entity({
            userName: i.string().indexed(),
            userEmail: i.string().unique().indexed(),
            userRole: i.string().indexed(), // "teacher" | "admin"
            joinedDate: i.date().indexed(),
            updatedDate: i.date().indexed(),
        }),
        // ----------------------
        //      User Tables
        // ----------------------
        timetables: i.entity({
            name: i.string().indexed(),
            days: i.json(), // string[]
            startTime: i.number().indexed(),
            endTime: i.number().indexed(),
        }),
        classes: i.entity({
            name: i.string().indexed(),
            defaultDay: i.string().optional(),
            defaultStart: i.string().optional(),
            defaultEnd: i.string().optional(),
            day: i.string().optional(),
            start: i.string().optional(),
            end: i.string().optional(),
            color: i.string().indexed(),
            iconName: i.string().indexed(),
            iconPrefix: i.string().indexed(),
            weekNumber: i.number().indexed().optional(),
            year: i.number().indexed().optional(),
        }),
        slots: i.entity({
            day: i.string().indexed(),
            startTime: i.string().indexed(),
            endTime: i.string().indexed(),
        }),
        slotClasses: i.entity({
            weekNumber: i.number().indexed(),
            year: i.number().indexed(),
            size: i.string().indexed(), // "whole" | "split"
            text: i.string().optional(),
            complete: i.boolean().indexed(),
            hidden: i.boolean().indexed(),
        }),
        disabledSlots: i.entity({
            disableDate: i.date().indexed(),
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
        usersToInstantUsers: {
            forward: {
                on: "users",
                has: "one",
                label: "instantUser",
            },
            reverse: {
                on: "$users",
                has: "one",
                label: "user",
            },
        },
        // ----------------------
        //      User Tables
        // ----------------------
        timetablesOwners: {
            forward: {
                on: "timetables",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "ownerTimetables",
            },
        },
        classesOwners: {
            forward: {
                on: "classes",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "ownerClasses",
            },
        },
        classesTimetables: {
            forward: {
                on: "classes",
                has: "one",
                label: "timetable",
                onDelete: "cascade",
            },
            reverse: {
                on: "timetables",
                has: "many",
                label: "classes",
            },
        },
        classesLinkedClass: {
            forward: {
                on: "classes",
                has: "one",
                label: "linkedClass",
            },
            reverse: {
                on: "classes",
                has: "many",
                label: "linkedClasses",
            },
        },
        slotsOwners: {
            forward: {
                on: "slots",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "ownerSlots",
            },
        },
        slotsTimetables: {
            forward: {
                on: "slots",
                has: "one",
                label: "timetable",
                onDelete: "cascade",
            },
            reverse: {
                on: "timetables",
                has: "many",
                label: "slots",
            },
        },
        slotClassesOwners: {
            forward: {
                on: "slotClasses",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "ownerSlotClasses",
            },
        },
        slotClassesTimetables: {
            forward: {
                on: "slotClasses",
                has: "one",
                label: "timetable",
                onDelete: "cascade",
            },
            reverse: {
                on: "timetables",
                has: "many",
                label: "slotClasses",
            },
        },
        slotClassesSlots: {
            forward: {
                on: "slotClasses",
                has: "one",
                label: "slot",
                onDelete: "cascade",
            },
            reverse: {
                on: "slots",
                has: "many",
                label: "slotClasses",
            },
        },
        slotClassesClasses: {
            forward: {
                on: "slotClasses",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
            reverse: {
                on: "classes",
                has: "many",
                label: "slotClasses",
            },
        },
        disabledSlotsOwners: {
            forward: {
                on: "disabledSlots",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "ownerDisabledSlots",
            },
        },
        disabledSlotsSlots: {
            forward: {
                on: "disabledSlots",
                has: "one",
                label: "slot",
                onDelete: "cascade",
            },
            reverse: {
                on: "slots",
                has: "many",
                label: "disabledSlots",
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
