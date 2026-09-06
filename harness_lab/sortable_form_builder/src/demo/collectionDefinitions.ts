import type {
  CollectionDefinition,
  ConfigurableItem,
} from "@torisetsu/configurable-list";
import detailLayouts from "./detailLayouts.json";

export const collectionDefinitions = {
  tasks: {
    schemaVersion: "configurable-collection.v1",
    id: "tasks",
    label: "作業項目",
    itemLabel: "作業",
    creation: {
      initialTitle: {
        field: "title",
        value: "新しい作業",
      },
    },
    display: {
      titleField: "title",
      summaryField: "notes",
      badgeField: "priority",
      detailLayout: detailLayouts.tasks,
    },
    fields: [
      {
        name: "title",
        type: "text",
        label: "作業名",
        required: true,
        maxLength: 80,
        placeholder: "例: 仕様書を確認する",
        fullWidth: true,
      },
      {
        name: "notes",
        type: "textarea",
        label: "メモ",
        maxLength: 300,
        placeholder: "判断材料や完了条件を入力",
        fullWidth: true,
      },
      {
        name: "priority",
        type: "select",
        label: "優先度",
        required: true,
        defaultValue: "中",
        options: [
          { value: "高", label: "高" },
          { value: "中", label: "中" },
          { value: "低", label: "低" },
        ],
      },
      {
        name: "estimatedMinutes",
        type: "number",
        label: "見積もり（分）",
        required: true,
        defaultValue: 30,
        min: 5,
        max: 480,
        step: 5,
      },
      {
        name: "ready",
        type: "checkbox",
        label: "着手条件がそろっている",
        description: "必要な情報や権限を確認済みなら選択します。",
        fullWidth: true,
      },
    ],
  },
  contacts: {
    schemaVersion: "configurable-collection.v1",
    id: "contacts",
    label: "連絡メモ",
    itemLabel: "メモ",
    creation: {
      initialTitle: {
        field: "subject",
        value: "新しいメモ",
      },
    },
    display: {
      titleField: "subject",
      summaryField: "details",
      badgeField: "channel",
      detailLayout: detailLayouts.contacts,
    },
    fields: [
      {
        name: "subject",
        type: "text",
        label: "件名",
        required: true,
        maxLength: 80,
        placeholder: "例: 来週の日程確認",
        fullWidth: true,
      },
      {
        name: "details",
        type: "textarea",
        label: "伝える内容",
        required: true,
        maxLength: 400,
        placeholder: "相手に伝える内容を入力",
        fullWidth: true,
      },
      {
        name: "channel",
        type: "select",
        label: "連絡手段",
        defaultValue: "チャット",
        options: [
          { value: "チャット", label: "チャット" },
          { value: "メール", label: "メール" },
          { value: "口頭", label: "口頭" },
        ],
      },
      {
        name: "followUp",
        type: "checkbox",
        label: "返答を確認する",
        description: "送信後に返答の有無を確認する項目です。",
        fullWidth: true,
      },
    ],
  },
} satisfies Record<string, CollectionDefinition>;

export type CollectionId = keyof typeof collectionDefinitions;

export const initialItems: Record<CollectionId, Array<ConfigurableItem>> = {
  tasks: [
    {
      id: "task-prepare",
      values: {
        title: "要件を3行で整理する",
        notes: "目的、対象、完了条件を確認する",
        priority: "高",
        estimatedMinutes: 15,
        ready: true,
      },
    },
    {
      id: "task-implement",
      values: {
        title: "小さい単位で実装する",
        notes: "共通モジュールとデモ設定を分ける",
        priority: "中",
        estimatedMinutes: 45,
        ready: true,
      },
    },
    {
      id: "task-review",
      values: {
        title: "ブラウザで操作を確認する",
        notes: "追加、編集、削除、並び替えを試す",
        priority: "中",
        estimatedMinutes: 20,
        ready: false,
      },
    },
  ],
  contacts: [
    {
      id: "contact-schedule",
      values: {
        subject: "レビュー時間を確認する",
        details: "候補日時を2つ添えて確認する",
        channel: "チャット",
        followUp: true,
      },
    },
    {
      id: "contact-result",
      values: {
        subject: "検証結果を共有する",
        details: "実行結果と残っている問題を短く伝える",
        channel: "メール",
        followUp: false,
      },
    },
  ],
};
