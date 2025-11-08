/** @format */

import { id } from "@instantdb/react";
import type { InstaQLEntity } from "@instantdb/react";
import { db } from "./db";
import type { AppSchema } from "../instant.schema";

export type Todo = InstaQLEntity<AppSchema, "todos">;

export function addTodo(
    text: string,
    userId: string,
    todos: Todo[],
    setNotice: (notice: string | null) => void
) {
    const todoId = id();
    const tx = db.tx.todos[todoId].update({
        text,
        done: false,
        createdAt: Date.now(),
    });

    setNotice(null);

    db.transact(tx.link({ owner: userId })).catch((err) => {
        const message = err.body?.message || err.message || "";
        const permsFailed =
            message.includes("perms-pass") ||
            message.toLowerCase().includes("permission denied");

        if (permsFailed && todos.length >= 5) {
            setNotice("Upgrade for more todos");
        }
    });
}

export function deleteTodo(todo: Todo) {
    db.transact(db.tx.todos[todo.id].delete());
}

export function toggleDone(todo: Todo) {
    db.transact(db.tx.todos[todo.id].update({ done: !todo.done }));
}

export function deleteCompleted(todos: Todo[]) {
    const completed = todos.filter((todo) => todo.done);
    const txs = completed.map((todo) => db.tx.todos[todo.id].delete());
    db.transact(txs);
}

export function toggleAll(todos: Todo[]) {
    const newVal = !todos.every((todo) => todo.done);
    db.transact(
        todos.map((todo) => db.tx.todos[todo.id].update({ done: newVal }))
    );
}

