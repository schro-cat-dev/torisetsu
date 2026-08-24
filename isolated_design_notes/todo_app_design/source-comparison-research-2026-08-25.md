# 設計チェックリスト追加調査メモ

作成日: 2026-08-25

## 結論

- SmartHR は正解ではなく、業務 UI 設計の参考元の一つ。
- TODO アプリ設計に使うなら、複数ソースを役割ごとに分ける方がよい。
- UX は Design System だけでなく、アクセシビリティ、セキュリティ、実装テンプレート、テスト設計まで合わせて見る。
- 指定 URL `https://zenn.dev/newt_st21/articles/next-template-2026` は、今回のブラウズでは直接取得できなかった。Zenn 内検索でも該当記事は確認できなかったため、slug 違い、非公開、削除、またはクロール対象外の可能性がある。

## 1. 参照元の役割分担

| 参照元 | 強い部分 | TODO 設計へ入れる要素 |
|---|---|---|
| SmartHR Design System | 日本語業務 UI、一覧、操作、平易な説明 | 一覧、フォーム、フィードバックの最低ライン |
| GOV.UK Design System / Service Manual | 公共サービス、フォーム、エラー、質問設計 | `なぜ聞くか`、エラー回復、1画面1目的 |
| Carbon Design System | 大規模プロダクト、フォーム、状態、アクセシビリティ検証 | component done 条件、状態別チェック |
| Shopify Polaris | 管理画面、一覧、検索、絞り込み、一括操作 | TODO 一覧、bulk action、pagination |
| Atlassian Design System | 業務 SaaS、空状態、文言、フォーム | empty state、メッセージ、UI文言 |
| Material Design | 入力欄、状態、エラー、密度 | text field の構成要素と状態 |
| WCAG / WAI-ARIA / WebAIM | アクセシビリティの土台 | label、keyboard、error identification |
| OWASP / CISA | セキュリティ設計 | localStorage 制限、secure by design |
| Next.js 公式 | ルーティング、server/client 境界、production checklist | App Router、error/loading、server-only |
| Zenn / GitHub template | 実装現場の構成例 | Storybook、MSW、CI、テスト、AI開発向け環境 |

## 2. SmartHR の位置づけ

SmartHR は、正解ではない。

使い方:
- 日本語の業務 UI の入口として見る。
- チーム全員が理解しやすい最低ラインとして見る。
- 一覧、フィードバック、アクセシビリティの考え方を借りる。

足りない部分:
- 技術選定の深さ。
- セキュリティ要件。
- Next.js の server/client 境界。
- テスト、CI、Storybook、MSW まで含む実装品質。
- 画面ごとの詳細状態設計。

## 3. TODO アプリ設計へ追加すべき観点

### 3.1 画面状態

- 初期表示。
- 読み込み中。
- 取得成功。
- 取得失敗。
- 0 件。
- 検索結果 0 件。
- 権限なし。
- 保存中。
- 保存成功。
- 保存失敗。
- 同期待ち。
- オフライン。
- 競合発生。

### 3.2 一覧

- 表示カラム。
- 行クリック時の動き。
- チェックボックス選択。
- 一括操作。
- 検索。
- フィルター。
- 並び替え。
- ページング。
- 小さい画面での表示。
- 行ごとの操作数。
- 削除など危険操作の扱い。

### 3.3 フォーム

- その項目を聞く理由。
- 必須 / 任意。
- 入力例。
- 文字数制限。
- 入力形式。
- 補足説明。
- 入力中 validation。
- submit 後 validation。
- サーバーエラーの表示。
- 未保存変更の扱い。
- 送信ボタンを押せる条件。

### 3.4 セキュリティ

- データ分類。
- 保存先。
- 認証方式。
- 権限チェック。
- Server Action / API route 側の再検証。
- CSRF / XSS 対策。
- localStorage に置かない情報。
- ログへ出さない情報。
- エラー表示で漏らさない情報。
- rate limit。

### 3.5 実装構成

- `app/` はルーティング中心。
- feature / module に UI、hook、service、schema を寄せる。
- server-only な処理を client 側へ漏らさない。
- validation schema は client/server で共有できる形にする。
- API mock は MSW で状態別に用意する。
- Storybook で UI 状態を確認できるようにする。

### 3.6 テスト

- unit: validation、filter、sort。
- component: 入力、エラー、ボタン状態。
- Storybook: UI 状態の一覧化。
- MSW: API 成功、空、失敗、遅延。
- E2E: 作成、編集、削除、完了切替。
- accessibility: label、keyboard、error message。
- CI: lint、typecheck、test、build。

## 4. Zenn / 類似テンプレート調査

指定 URL:
- `https://zenn.dev/newt_st21/articles/next-template-2026`
- 今回は直接取得できなかった。
- `newt_st21` の Zenn プロフィールは確認できたが、該当記事は見つからなかった。

確認できた類似情報:
- `AI時代のNext.js開発環境構築2026`
  - Dev Container。
  - Storybook。
  - MSW。
  - Vitest。
  - React Testing Library。
  - Playwright。
  - ESLint / Prettier / Markuplint / knip。
  - Lighthouse CI / Bundle Analyzer。
  - GitHub Actions。
- `Next.jsのディレクトリ構成: 2026年版ベストプラクティス`
  - App Router の公式規約。
  - route と実装領域の分離。
  - server/client 境界。
- `@mstfucrr/create-next-template`
  - Zod。
  - React Hook Form。
  - shadcn/ui。
  - TanStack Query。
  - `proxy.ts` 認可 starter。
  - Playwright。
  - public/private route groups。

## 5. 次の設計チェックリストへ反映するなら

優先度とおすすめ度は 5 が高い。

| 項目 | 種別 | 優先度 | おすすめ度 | 根拠 |
|---|---|---:|---:|---|
| SmartHR を唯一の基準にしない | 必須 | 5 | 5 | 業務 UI の一例であり、技術・安全・検証までは足りない |
| secure by design を前半へ移す | 必須 | 5 | 5 | 保存方式と認証方式は後から直すと影響が大きい |
| 画面状態チェックを追加する | 必須 | 5 | 5 | loading/error/empty/offline/permission が漏れると UX が崩れる |
| Storybook + MSW を設計段階に入れる | おすすめ | 4 | 5 | UI 状態を小さく確認しやすい |
| WCAG / WebAIM を accessibility の根拠にする | 必須 | 5 | 5 | Design System より基礎ルールとして強い |
| Next.js 公式 checklist を構成判断に入れる | 必須 | 5 | 5 | server/client 境界と production 要件に直結する |

## 6. 参照 URL

- https://smarthr.design/products/design-patterns/smarthr-table/
- https://smarthr.design/products/design-patterns/feedback/
- https://smarthr.design/accessibility/
- https://design-system.service.gov.uk/
- https://www.gov.uk/service-manual/design/form-structure
- https://design-system.service.gov.uk/components/error-message/
- https://carbondesignsystem.com/components/form/usage/
- https://carbondesignsystem.com/contributing/component-checklist/
- https://polaris-react.shopify.com/components/tables/index-table
- https://atlassian.design/components/empty-state
- https://design-system-docs-proxy.services.atlassian.com/patterns/forms
- https://m2.material.io/design/components/text-fields.html
- https://www.w3.org/TR/wcag/
- https://www.w3.org/WAI/ARIA/apg/
- https://webaim.org/techniques/formvalidation/
- https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
- https://www.cisa.gov/securebydesign
- https://nextjs.org/docs/app/getting-started/project-structure
- https://vercel-next-js.mintlify.app/app/guides/production-checklist
- https://zenn.dev/takayuu/articles/nextjs-template-2026-7a8b9c0d1e2f
- https://zenn.dev/yutabeee/articles/nextjs-directory-structure-2026
- https://www.npmjs.com/package/%40mstfucrr/create-next-template
