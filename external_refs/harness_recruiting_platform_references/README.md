# ハーネス・採用プラットフォーム外部参照

## 目的

スクリーンショットで見えた `Skills トップ5` を手がかりに、ハーネスを何から作るか、いつ使うか、どう管理するかを考えるための外部参照を置く。

あわせて、TODOアプリ修正後の次の実験場として、個人サービスや個人ツールの一部切り出しではなく、採用プラットフォームを作る案を検討する。

## 現時点の結論

- 最初に見る順番は、`テスト・品質保証`、`Git操作`、`データ分析/業務ドメイン`。
- 採用プラットフォームは、TODOアプリの次の実験場として相性がよい。
- SmartHR Design System は学習用の参照にするが、正解として固定しない。
- OpenCATS などの既存ATSも、業務フローの参考として見る。

理由:

- 採用は、候補者、求人、応募、面接、評価、内定などの状態変化がある。
- テーブル、フォーム、詳細画面、権限、監査ログ、通知、検索、絞り込みが自然に出る。
- ハーネスで、UI品質、状態遷移、API契約、権限、a11y、レビュー負荷を測りやすい。

## 何から作るか

優先度とおすすめ度は5が高い。ここでの優先度は `TODO修正後に、次の実験場へ移る視点` で見る。

| 作るもの | 優先度 | おすすめ度 | 背景 |
|---|---:|---:|---|
| 採用プラットフォームMVPの業務フロー | 5 | 5 | 何を作るかが曖昧だと、UIもハーネスもズレる |
| UIパターン参照リスト | 5 | 5 | テーブル、フォーム、フィードバック、権限表示を先に見るため |
| 品質ハーネス対象表 | 5 | 5 | 何を機械確認し、何を人間確認するか分けるため |
| Issue #1の進捗補足 | 4 | 4 | フェーズ2の対象変更を後から追えるようにするため |
| 実装候補技術の比較 | 3 | 4 | 先に重い構成へ寄せすぎないため |

## 採用プラットフォームで試す流れ

1. TODOアプリの不足をレビューし、ハーネスとプロンプトの不足を整理する。
2. 採用プラットフォームMVPの範囲を決める。
3. SmartHR、Primer、GOV.UK、OpenCATS などを見て、画面と業務フローの参照を集める。
4. 画面、責務、依存関係、状態遷移、API契約を先に書く。
5. 実装前に、品質ハーネスで見る項目を定義する。
6. MVPを小さく作る。
7. ハーネスで自動確認し、人間レビューとの差分を記録する。
8. 修正回数、所要時間、品質条件通過率を記録する。

## 最小MVP案

| 領域 | 最小要素 | 見たいこと |
|---|---|---|
| 求人 | 求人一覧、求人詳細、求人作成 | テーブル、フォーム、詳細の基本品質 |
| 候補者 | 候補者一覧、候補者詳細 | 検索、絞り込み、個人情報の扱い |
| 応募 | 候補者を求人へ紐づける | 関係性と状態遷移 |
| 選考 | 書類、面接、評価、内定、辞退 | workflowと権限 |
| 評価 | 評価入力、コメント、判定 | フォーム、監査ログ、レビュー品質 |

## ハーネスで見るもの

| 観点 | 具体例 | 自動化候補 |
|---|---|---|
| API契約 | `Candidate.status` が許可値だけか | schema check |
| 状態遷移 | `applied -> interview -> offer` はOK、`rejected -> offer` はNG | scenario JSON |
| UI操作 | 候補者作成、検索、選考ステータス変更 | Playwright |
| a11y | label、エラー読み上げ、キーボード操作 | axe-core + 人間確認 |
| 依存関係 | UI層が保存層へ直接依存しない | dependency-cruiser |
| レビュー負荷 | 修正依頼回数、所要時間、人間だけが見つけた不足 | benchmark log |

## いつ使うか

| タイミング | 使うハーネス | 目的 |
|---|---|---|
| 設計前 | 責務/依存/状態遷移チェック | 作る前にズレを見つける |
| 実装中 | unit/schema/scenario | 小さい破綻を早く止める |
| UI追加後 | Storybook/Playwright/a11y | 見た目と操作を確認する |
| push前 | full quality profile | 合流できる状態か見る |
| フィードバック後 | benchmark log | 改善が効いたか測る |

## どう管理するか

| 情報 | 置き場所 | 理由 |
|---|---|---|
| 外部参照 | `external_refs/harness_recruiting_platform_references/` | 参照先と学習メモを通常ドキュメントから分ける |
| フェーズ計画 | `internal_refs/ai_experiment_scopes/phase_plan/` | 次に何を試すかを管理する |
| ベンチマーク | `internal_refs/ai_experiment_scopes/benchmark_threshold_design/` | 効果を数値で追う |
| AIとのすり合わせ | `internal_refs/ai_experiment_scopes/ai_collaboration_cheatsheet/knowledge/` | 判断ズレを次へ反映する |
| 実装/ハーネス本体 | `harness_lab/` | 動くものと検証コードを置く |
| 進捗メモ | GitHub Issue #1 | 外から見ても流れを追えるようにする |

## 見に行く候補

| 種別 | 参照先 | 使いどころ |
|---|---|---|
| SmartHR Design System | https://smarthr.design/products/ | toB SaaSのデザイン原則、情報設計、パターンを見る |
| SmartHR Components | https://smarthr.design/products/components/ | コンポーネント、テーブル、フォーム、権限、フィードバックを見る |
| SmartHR UI GitHub | https://github.com/kufu/smarthr-ui | 実装されているUIライブラリの構成を見る |
| SmartHR UI Storybook | https://story.smarthr-ui.dev/ | 実物コンポーネントの状態と使い方を見る |
| OpenCATS | https://github.com/opencats/OpenCATS | 採用管理/ATSの業務領域と機能を参考にする |
| OpenCATS docs | https://documentation.opencats.org/ | 求人、候補者、応募、採用フローの参考にする |
| Primer React | https://github.com/primer/react | GitHubのデザインシステム実装、Storybook運用を見る |
| Primer Philosophy | https://www.primer.style/product/getting-started/react/philosophy/ | UI部品がAPI通信を持たない責務分離を見る |
| GOV.UK Design System | https://design-system.service.gov.uk/ | 公的サービス向けのフォーム、エラー、アクセシビリティを見る |
| GOV.UK GitHub | https://github.com/alphagov/govuk-design-system | デザインシステムの公開運用を見る |
| Storybook | https://github.com/storybookjs/storybook | UI部品を単体で確認する実験場に使う |
| Playwright | https://github.com/microsoft/playwright | 実ブラウザ操作、E2E、スクリーンショット確認に使う |
| axe-core | https://github.com/dequelabs/axe-core | a11yの自動検出に使う。ただし人間確認も残す |
| dependency-cruiser | https://github.com/sverweij/dependency-cruiser | import境界、循環依存、層ルールを見る |
| React Testing Library | https://github.com/testing-library/react-testing-library | ユーザー操作に近いコンポーネントテストを見る |
| Vitest | https://github.com/vitest-dev/vitest | Vite系のunit/component test候補として見る |
| TanStack Table | https://github.com/TanStack/table | 採用候補者一覧などの複雑なテーブルに使えるか見る |
| React Hook Form | https://github.com/react-hook-form/react-hook-form | 採用フォームや評価フォームの入力管理候補として見る |
| Zod | https://zod.dev/ | API契約、フォーム入力、fixture検証のschema候補として見る |

## 注意

- 外部参照は正解として扱わない。
- 参照先の思想、対象ユーザー、制約、運用規模がこのリポジトリと合うかを見る。
- 採用プラットフォームは、実サービス化より先に、ハーネスとプロンプト改善の実験場として扱う。
- 個人サービスや個人ツールの一部を直接切り出すより、情報漏れやドメイン固有事情の持ち込みを抑えやすい。
