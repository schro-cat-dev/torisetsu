# Configurable List

`core`と`react`を一つのimport先にまとめた配布用packageです。

```tsx
import {
  ConfigurableCollectionEditor,
  type CollectionDefinition,
} from "@torisetsu/configurable-list";
import "@torisetsu/configurable-list/styles.css";
```

一覧定義と`items`を渡し、更新後の配列を`onItemsChange`で受け取ります。保存先はpackageに含めず、利用側が決めます。
