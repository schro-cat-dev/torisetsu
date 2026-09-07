# UIデザインの土台ルールとハーネス導入候補

作成日: 2026-09-07

## 位置づけ

この文書は独立調査メモです。

これまでの会話メモ、AI協働ナレッジ、既存ハーネス設計とは混ぜない。外部公開ドキュメントから確認できるUIデザインの土台と、そこから作れるハーネス候補を分けて記録する。

## 調査した問い

UIデザインでは、フォーマット、統一性、アクセシビリティ、操作性などの土台があり、その上で固有の味やスタイルを出す。
この考え方を、外部ドキュメントから確認できるか。さらに、ハーネスとして導入できる形にできるか。

## 結論

外部資料から見る限り、UIデザインは次の順番で扱うのが妥当です。

```text
1. アクセシビリティと基本操作を成立させる
2. レイアウト、文言、コンポーネントの統一性を守る
3. よくある操作パターンを使い、迷いを減らす
4. その上で、プロダクト固有の味、ブランド感、業務らしさを乗せる
```

固有の味は重要だが、土台の代わりにはならない。
読めない、押せない、戻れない、迷う、画面ごとに意味が変わるUIは、見た目に個性があってもUIとして成立しにくい。

## 外部資料から確認できる土台

| 資料 | 確認できること | ハーネスで使える形 |
|---|---|---|
| W3C WCAG 2.2 | Webコンテンツを知覚可能、操作可能、理解可能、堅牢にする基準。成功基準はテスト可能な形で書かれている。 | contrast、keyboard、label、入力目的、エラー補助などを機械チェック候補にする |
| WAI-ARIA APG | button、dialog、breadcrumbなど、UIパターンごとのrole、状態、keyboard interactionの実装指針。 | modal focus、Escape close、buttonのEnter/Space操作などをE2E化する |
| Nielsen Norman Group | 状態表示、現実の言葉、ユーザー制御、統一性、エラー予防などの基本原則。 | UIレビュー観点、手動レビューrubric、E2E観点に分ける |
| GOV.UK Design System | styles、components、patternsを分け、再利用できるUIとして管理している。 | design token、component、flow patternを別policyに分ける |
| Apple Human Interface Guidelines | accessibility、color、layout、typography、inputs、componentsなどを土台として扱う。 | platform感、読みやすさ、色だけに依存しない表現をレビュー項目にする |
| Microsoft Fluent 2 | focus、keyboard、contrast、responsive、meaningful textなどを具体的に整理している。 | focus順、320px相当、200% text zoom、contrastをチェック候補にする |
| Material Design 3 | enabled、disabled、hover、focused、pressed、draggedなど、interactive stateを一貫して扱う。 | component stateの欠落をvisual/E2Eで見る |
| Atlassian Design System | quality foundations、components、toolsを土台にし、Core / Platform / Appのように共通と固有を分ける考え方がある。 | 共通UIルールとアプリ固有表現を別レイヤーで扱う |

## ハーネス導入案

UIデザインハーネスは、1つの大きなチェックにしない。土台から順番に通す。

| Gate | 見ること | 判定方法 |
|---|---|---|
| `baseAccessibility` | 文字、色、label、keyboard、focus、支援技術で扱える構造 | axe、Playwright、DOM検査、contrast検査 |
| `interactionPattern` | button、dialog、menu、formなどが一般的な動きになっているか | E2E、ARIA role確認、keyboard操作確認 |
| `layoutConsistency` | 余白、見出し、配置、画面内の優先順位が揃っているか | screenshot比較、CSS token確認、目視レビュー |
| `componentConsistency` | 同じ役割のUIが同じ見た目、文言、動きになっているか | component catalog、Storybook、静的検査、目視レビュー |
| `domainSpecificTaste` | 業務らしさ、ブランド感、利用者に合う雰囲気があるか | 判断レビュー。AI/人のどちらでもよいが、判断主体、根拠、未確認点を残す |

重要なのは、`domainSpecificTaste` を最初に判定しないこと。
まずUIとして成立する土台を通し、その後で固有表現を見る。

## policy例

`policy` は、ハーネスrunnerへ渡す設定ファイルです。
runner本体には対象アプリ固有のpathや文言を直書きしない。

```json
{
  "schemaVersion": "ui-design-foundation-gate.v1",
  "target": {
    "appName": "example-ui",
    "routes": ["/", "/items", "/items/new"]
  },
  "requiredGates": [
    "baseAccessibility",
    "interactionPattern",
    "layoutConsistency",
    "componentConsistency"
  ],
  "judgmentReviewGates": [
    "domainSpecificTaste"
  ],
  "thresholds": {
    "normalTextContrastRatio": 4.5,
    "largeTextContrastRatio": 3,
    "minViewportWidthPx": 320,
    "textZoomPercent": 200
  },
  "blockingRules": [
    "primaryActionsMustBeKeyboardOperable",
    "dialogsMustTrapFocusAndClose",
    "formFieldsMustHaveLabels",
    "errorsMustBeNearRelatedFields",
    "sameActionMustUseSameLabel"
  ]
}
```

## 出力例

```json
{
  "schemaVersion": "ui-design-foundation-result.v1",
  "status": "fail",
  "checkedAt": "2026-09-07",
  "target": "example-ui",
  "results": [
    {
      "gate": "baseAccessibility",
      "status": "fail",
      "evidence": "フォームの3項目中1項目でlabel関連付けがない",
      "blocking": true
    },
    {
      "gate": "domainSpecificTaste",
      "status": "not_checked",
      "evidence": "土台gateがfailのため、固有表現レビューは未実施",
      "blocking": false
    }
  ]
}
```

## OK例 / NG例

| 種別 | 内容 |
|---|---|
| OK | label、focus、keyboard、contrast、modal closeが成立している。その上で色、余白、文体、図版で固有感を出している。 |
| NG | 見た目は独自だが、buttonがkeyboardで押せない。modalが閉じられない。エラーが入力欄から離れている。画面ごとに同じ操作の名前が違う。 |

## 機械チェックと判断レビューの分離

機械チェックに向くもの:

- contrast比
- `label` と `input` の関連
- buttonのkeyboard操作
- modalのfocus移動とEscape close
- 画面幅320px相当での横スクロールや文字はみ出し
- 同じ操作名の統一
- 入力エラーの表示位置

判断レビューに残すもの:

- 業務らしさ
- ブランド感
- 情報の優先順位が自然か
- 固有の味が過剰ではないか
- 利用者の作業順に合っているか

## ハーネス化する時の注意

- 判断主体の違和感をそのまま機械判定にしない。
- `ダサい`、`味がない`、`業務っぽくない` は、そのままではpolicyにしない。
- 機械判定にする場合は、観察できる条件へ変換する。

例:

| 観察メモ | policy化する条件 |
|---|---|
| ごちゃついている | 1画面内のprimary actionを1つに制限する、またはprimary/secondary/dangerを分類する |
| 操作が分かりにくい | button labelが動詞で始まるか、同じ操作に同じlabelを使っているかを見る |
| modalが不安 | focusがmodal内へ移るか、Escapeで閉じるか、背面操作が止まるかを見る |
| 統一感がない | spacing token、font scale、button variantの使用数を見る |

## 参照元

- W3C: [Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/wcag/)
- W3C WAI: [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/about/introduction/)
- Nielsen Norman Group: [10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/)
- GOV.UK: [GOV.UK Design System](https://design-system.service.gov.uk/)
- Apple: [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- Apple: [Accessibility - Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- Microsoft: [Fluent 2 Accessibility](https://fluent2.microsoft.design/accessibility)
- Material Design: [States - Material Design 3](https://m3.material.io/foundations/interaction/states/overview)
- Atlassian: [Atlassian Design System](https://atlassian.design/)

## 残リスク

- この文書は外部資料の初回整理であり、各資料の全ページを網羅したものではない。
- Material Design 3の一部ページはJavaScript依存で、取得できた本文が限定的だった。
- 固有の味、業務らしさ、ブランド感は、現時点では判断レビュー前提。完全自動判定にはしない。

## 次にやるなら

1. `ui-design-foundation-gate.v1` のpolicy schemaを作る。
2. Playwright + axeで `baseAccessibility` と `interactionPattern` を先に自動化する。
3. screenshot比較やtoken検査で `layoutConsistency` を足す。
4. `domainSpecificTaste` は判断レビューrubricとして別ファイルに分ける。
