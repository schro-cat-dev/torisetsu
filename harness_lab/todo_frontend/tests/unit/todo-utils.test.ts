import { describe, expect, it } from "vitest";
import type { Todo } from "../../src/features/todos/types";
import { getVisibleTodos } from "../../src/features/todos/utils/todoFilters";
import { validateTodoInput } from "../../src/features/todos/utils/validation";

const todos: Todo[] = [
  {
    id: "1",
    title: "請求書を確認する",
    description: "月末までに見る",
    status: "todo",
    priority: "high",
    dueDate: "2026-08-30",
    createdAt: "2026-08-20T00:00:00.000Z",
    updatedAt: "2026-08-20T00:00:00.000Z"
  },
  {
    id: "2",
    title: "議事録を書く",
    description: "共有用",
    status: "done",
    priority: "low",
    dueDate: "",
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
        dueDate: ""
      })
    ).toEqual({});
  });
});

describe("getVisibleTodos", () => {
  it("検索と状態で絞り込む", () => {
    const visible = getVisibleTodos(todos, "請求", "todo", "createdDesc");
    expect(visible.map((todo) => todo.id)).toEqual(["1"]);
  });

  it("優先度順で並び替える", () => {
    const visible = getVisibleTodos(todos, "", "all", "priorityDesc");
    expect(visible.map((todo) => todo.id)).toEqual(["1", "2"]);
  });
});
