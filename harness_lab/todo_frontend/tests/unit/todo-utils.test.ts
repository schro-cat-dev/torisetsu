import { describe, expect, it } from "vitest";
import type { Todo } from "../../src/features/todos/types";
import {
  filterTodosByViewMode,
  getVisibleTodos,
  sortCompletedTodos
} from "../../src/features/todos/utils/todoFilters";
import { validateTodoInput } from "../../src/features/todos/utils/validation";

const todos: Todo[] = [
  {
    id: "1",
    title: "請求書を確認する",
    description: "月末までに見る",
    status: "todo",
    priority: "high",
    categoryId: "category-work",
    dueDate: "2026-08-30",
    completedAt: "",
    createdAt: "2026-08-20T00:00:00.000Z",
    updatedAt: "2026-08-20T00:00:00.000Z"
  },
  {
    id: "2",
    title: "議事録を書く",
    description: "共有用",
    status: "done",
    priority: "low",
    categoryId: "category-private",
    dueDate: "",
    completedAt: "2026-08-22T00:00:00.000Z",
    createdAt: "2026-08-21T00:00:00.000Z",
    updatedAt: "2026-08-21T00:00:00.000Z"
  }
];

describe("validateTodoInput", () => {
  it("タイトルが空ならエラーにする", () => {
    expect(
      validateTodoInput({
        title: "",
        description: "",
        priority: "medium",
        categoryId: "category-work",
        dueDate: ""
      })
    ).toEqual({ title: "タイトルを入力してください。" });
  });

  it("有効な入力ならエラーなし", () => {
    expect(
      validateTodoInput({
        title: "確認する",
        description: "",
        priority: "medium",
        categoryId: "category-work",
        dueDate: ""
      })
    ).toEqual({});
  });

  it("タイトルと説明の文字数上限を確認する", () => {
    expect(
      validateTodoInput({
        title: "あ".repeat(81),
        description: "い".repeat(401),
        priority: "medium",
        categoryId: "category-work",
        dueDate: ""
      })
    ).toEqual({
      title: "タイトルは80文字以内にしてください。",
      description: "説明は400文字以内にしてください。"
    });
  });
});

describe("getVisibleTodos", () => {
  it("検索と状態で絞り込む", () => {
    const visible = getVisibleTodos(todos, "請求", "todo", "all", "createdDesc");
    expect(visible.map((todo) => todo.id)).toEqual(["1"]);
  });

  it("優先度順で並び替える", () => {
    const visible = getVisibleTodos(todos, "", "all", "all", "priorityDesc");
    expect(visible.map((todo) => todo.id)).toEqual(["1", "2"]);
  });

  it("分類で絞り込む", () => {
    const visible = getVisibleTodos(todos, "", "all", "category-private", "createdDesc");
    expect(visible.map((todo) => todo.id)).toEqual(["2"]);
  });

  it("優先度が同じなら期限が近い順にする", () => {
    const visible = getVisibleTodos(
      [
        {
          ...todos[0],
          id: "1",
          priority: "high",
          dueDate: "2026-09-10"
        },
        {
          ...todos[0],
          id: "2",
          priority: "high",
          dueDate: "2026-09-01"
        },
        {
          ...todos[0],
          id: "3",
          priority: "medium",
          dueDate: "2026-08-01"
        }
      ],
      "",
      "all",
      "all",
      "priorityDueAsc"
    );
    expect(visible.map((todo) => todo.id)).toEqual(["2", "1", "3"]);
  });

  it("通常一覧では完了済みを外す", () => {
    const visible = filterTodosByViewMode(todos, "active");
    expect(visible.map((todo) => todo.id)).toEqual(["1"]);
  });

  it("完了一覧では完了した日時の新しい順にする", () => {
    const visible = sortCompletedTodos([
      {
        ...todos[1],
        id: "old",
        completedAt: "2026-08-21T00:00:00.000Z"
      },
      {
        ...todos[1],
        id: "new",
        completedAt: "2026-08-23T00:00:00.000Z"
      }
    ]);
    expect(visible.map((todo) => todo.id)).toEqual(["new", "old"]);
  });
});
