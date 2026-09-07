# Configurable List Core

Reactに依存しない型、JSON検証、Markdown防御、値移行、表示状態の純粋ロジックです。

```ts
import {
  createInputBoundaryAdapter,
  filterItemCompositionConfig,
  type CollectionDefinition,
} from "@torisetsu/configurable-list-core";

declare const externalInput: unknown;
const boundary = createInputBoundaryAdapter(filterItemCompositionConfig);
const safeComposition = boundary.require(externalInput);
```

契約JSONは `@torisetsu/configurable-list-core/contracts/<file>.json` から参照できます。

`filterJsonInputAtBoundary`はJSON共通の形式・総量・危険propertyを確認します。通常は、固有契約まで確認する`filterItemCompositionConfig`または`filterDetailLayoutConfig`を境界へ配置してください。
