# UI品質ハーネス完成契約

更新日: 2026-09-07

## 完了の定義

次の全項目が `完了` になり、記載した確認commandが成功した時だけ、UI品質ハーネスのローカル実装を完成とする。

GitHub上のrequired check設定、Safari/Firefox、実機、screen readerによる確認は、このローカル実装の完成範囲に含めない。未実施を自動確認済みとは表示しない。

## チェックリスト

| ID | 状態 | 完成条件 | 確認方法 |
|---|---|---|---|
| C-01 | 完了 | profile、adapter、snapshot、review、resultを実行時Schema検証する | unknown、missing、wrong type、enum外、空配列fixtureが失敗 |
| C-02 | 完了 | assertionごとのparams必須field、型、非空、範囲を外部contractで検証する | 空params、負数、空配列、unknown keyが失敗 |
| C-03 | 完了 | evidence source IDを任意名へ変えてもengine変更なしで同じ判定になる | ID差し替え回帰test |
| C-04 | 完了 | 対象ruleが0件、全skip、証跡欠落を成功扱いしない | 各negative testがexit 1 |
| C-05 | 完了 | 全adapter結果を `ui-quality-adapter-result.v1` へ正規化する | DOM、browser、axe、layout、judgment結果のSchema検証 |
| C-06 | 完了 | 1つのorchestratorが全source、rule、scenario、gateを集約する | final resultから全対応を追跡できる |
| C-07 | 完了 | blocking gateの未検証・失敗・skipで全体を失敗させる | blocking反例がexit 1 |
| C-08 | 完了 | command失敗、timeout、依存失敗を分類して停止する | fault fixtureでexit codeとmessageを確認 |
| C-09 | 完了 | profileに元の5観点を明示し、追加観点と混同しない | 5 gate IDとruleの存在確認 |
| C-10 | 完了 | 情報量の過多と不足を同じpolicyから判定する | min/max直前・同値・直後test |
| C-11 | 完了 | DOM順、視覚順、edge gap、center distanceを別metricとして扱う | hidden/CSS order/複数要素/距離境界test |
| C-12 | 完了 | 同じ役割の複数要素を実際に比較し、0比較を成功扱いしない | multiple element fixtureでpass/failを確認 |
| C-13 | 完了 | loading、empty、error、retry、cancel、disabled、successをbrowserで確認する | state/recovery Playwright test |
| C-14 | 完了 | keyboard操作、visible focus、label、dialog closeをbrowserで確認する | Playwright + axe。除外ruleなし |
| C-15 | 完了 | 全routeと主要stateをvisual manifestへ列挙する | manifest completeness check |
| C-16 | 完了 | manifestの全caseにmobile/desktop baselineがある | baseline inventory check |
| C-17 | 完了 | visual thresholdのoperator、値、単位、scope、根拠、境界testがある | threshold policy + unit test |
| C-18 | 完了 | Linux CIでbaseline fileを解決できる | platform非依存snapshot path + CI相当静的check |
| C-19 | 完了 | generated resultとrun logがgit対象を汚さない | 実行前後のtracked/untracked対象差分が増えない |
| C-20 | 完了 | 共通runnerがroot外pathを拒否し、失敗時もrestoreする | traversal/failure fixture test |
| C-21 | 完了 | 共通runner、loader、formatterを含む汎用性scanが通る | 対象固有path、ID、port、test pathの直書き0件 |
| C-22 | 完了 | pre-push、CI、ローカルの入口が同じ最終判定を呼ぶ | 各設定のcommand照合とローカル実行 |

実測値と未確認範囲は [verification/2026-09-07-completion-evidence.md](verification/2026-09-07-completion-evidence.md) を正本とする。

## 最終確認

```bash
node --test internal_refs/harness_arch/ui_quality_harness/tools/tests/*.test.mjs
npm --prefix harness_lab/todo_frontend run typecheck
npm --prefix harness_lab/todo_frontend run check:ui-quality
sh internal_refs/harness_arch/ui_quality_harness/runbooks/pre-push-hook.sample.sh
git diff --check
```

期待結果:

- C-01からC-22がすべて完了。
- 最終resultが全gate、全rule、全scenario、全evidence sourceを持つ。
- 未検証、missing、skipを `ok` と表示しない。
- runner本体にTODO固有path、固有ID、port、しきい値を持たない。
