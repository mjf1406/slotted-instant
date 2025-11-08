/** @format */

// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const adminBind = [
    "isAuthenticated",
    "auth.id != null",
    "isCreator",
    "auth.id != null && auth.id == data.creatorId",
    "isStillCreator",
    "auth.id != null && auth.id == newData.creatorId",
    "isOwner",
    "auth.id != null && auth.id == data.id",
    "isStillOwner",
    "auth.id != null && auth.id == newData.id",
    "isPremium",
    "auth.ref('$user.profile.plan').exists(p, p in ['basic', 'plus', 'pro'])",
];

const dataBind = [
    "isAuthenticated",
    "auth.id != null",
    "isOwner",
    "data.owner == auth.id",
    "isGuestOwner",
    "data.owner in auth.ref('$user.linkedGuestUsers.id')",
    "isPremium",
    "auth.ref('$user.profile.plan').exists(p, p in ['basic', 'plus', 'pro'])",
];

const rules = {
    // -----------------------------
    //      Admin Tables
    // -----------------------------
    $files: {
        allow: {
            view: "isAuthenticated",
            create: "isAuthenticated",
            update: "isAuthenticated",
            delete: "isAuthenticated",
        },
        bind: adminBind,
    },
    $users: {
        allow: {
            view: "isOwner",
            create: "false",
            delete: "false",
            update: "false",
        },
        bind: adminBind,
    },
    userProfiles: {
        allow: {
            view: "isOwner",
            create: "isAuthenticated",
            update: "isOwner",
            delete: "isOwner",
        },
        bind: adminBind,
    },

    // ----------------------
    //      User Tables
    // ----------------------
    users: {
        allow: {
            view: "isOwner || isGuestOwner",
            create: "isAuthenticated",
            update: "isOwner || isGuestOwner",
            delete: "isOwner || isGuestOwner",
        },
        bind: dataBind,
    },
    timetables: {
        allow: {
            view: "isOwner || isGuestOwner",
            create: "isAuthenticated",
            update: "isOwner || isGuestOwner",
            delete: "isOwner || isGuestOwner",
        },
        bind: dataBind,
    },
    classes: {
        allow: {
            view: "isOwner || isGuestOwner",
            create: "isAuthenticated",
            update: "isOwner || isGuestOwner",
            delete: "isOwner || isGuestOwner",
        },
        bind: dataBind,
    },
    slots: {
        allow: {
            view: "isOwner || isGuestOwner",
            create: "isAuthenticated",
            update: "isOwner || isGuestOwner",
            delete: "isOwner || isGuestOwner",
        },
        bind: dataBind,
    },
    slotClasses: {
        allow: {
            view: "isOwner || isGuestOwner",
            create: "isAuthenticated",
            update: "isOwner || isGuestOwner",
            delete: "isOwner || isGuestOwner",
        },
        bind: dataBind,
    },
    disabledSlots: {
        allow: {
            view: "isOwner || isGuestOwner",
            create: "isAuthenticated",
            update: "isOwner || isGuestOwner",
            delete: "isOwner || isGuestOwner",
        },
        bind: dataBind,
    },
} satisfies InstantRules;

export default rules;
