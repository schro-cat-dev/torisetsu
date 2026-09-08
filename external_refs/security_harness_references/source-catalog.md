# セキュリティ調査元一覧

調査日: 2026-09-08

## 信用区分

| 区分 | 意味 | 使い方 |
|---|---|---|
| A | 標準化団体、公的機関、公式project、vendor公式repo | 一般基準とtool仕様の一次資料にする |
| B | 継続更新されている主要OSSまたは専門組織 | tool候補と実装パターンの一次資料にする |
| C | 個人まとめ、mirror、出所不明 | 判定根拠に使わない |

信用区分は安全性や導入可否を保証しない。導入時はversion、license、権限、network、出力を別途確認する。

## license確認状況

2026-09-08にGitHub repository metadataの`license.spdx_id`を確認した。`未確定`はlicenseがないと断定する値ではなく、今回のmetadataだけでは利用条件を確定できないことを表す。

| license | repository |
|---|---|
| MIT | `NyxFoundation/speca`, `NyxFoundation/kurtosis-harness`, `NyxFoundation/skills`, `NyxFoundation/mulu`, `NyxFoundation/bb-crypto-inventory`, `gitleaks/gitleaks`, `zizmorcore/zizmor`, `github/codeql`, `pnpm/pnpm.io`, `Microsoft365DSC/Microsoft365DSC` |
| Apache-2.0 | `ossf/scorecard`, `sigstore/cosign`, `anchore/syft`, `CycloneDX/cyclonedx-cli`, `google/osv-scanner`, `aquasecurity/trivy`, `docker/docker-bench-security`, `aquasecurity/kube-bench`, `falcosecurity/falco`, `bridgecrewio/checkov` |
| GPL-3.0 | `hadolint/hadolint` |
| CC-BY-SA-4.0 | `OWASP/www-project-llm-verification-standard` |
| CC0-1.0 | `cisagov/ScubaGear` |
| 未確定 | `NyxFoundation/ethereum-vuln-dataset`, `NyxFoundation/wallet-vuln-dataset`, `slsa-framework/slsa`, `in-toto/in-toto`, `OWASP/www-project-top-10-for-large-language-model-applications`, `osquery/osquery`, `fleetdm/fleet`, `wazuh/wazuh`, `usnistgov/OSCAL` |

README、dataset、rule、query、binaryを実際に再利用する前に、対象repository内のLICENSEと対象fileの個別条件を再確認する。

## Nyx Foundation

| source | 区分 | 確認できた事実 | 取り入れる観点 | 限界・注意 |
|---|---|---|---|---|
| [NyxFoundation/speca](https://github.com/NyxFoundation/speca) | B | 自然言語仕様から型付きsecurity propertyを作り、実装へproof-attemptを行う。候補findingは人間監査が必要とREADMEに明記 | 仕様、property、code evidence、review結果を追跡する | LLM出力を確定脆弱性にしない。依存導入や実行は別評価 |
| [NyxFoundation/kurtosis-harness](https://github.com/NyxFoundation/kurtosis-harness) | B | finding固有情報をbundleへ分離し、共通engineで到達、症状、guardによる解消、既定防御下の再現を判定 | 共通runnerと対象spec分離、負の対照実験、named verdict | live backendはDocker/Kurtosisが必要。authorized local環境に限定する |
| [NyxFoundation/ethereum-vuln-dataset](https://github.com/NyxFoundation/ethereum-vuln-dataset) | B | 過去の修正をauthority tier、confidence、複数signalで分類する | authoritative、corroborated、candidateを分ける。単一heuristicを信用しない | 特定domainのdataset。一般ソフトウェアへ精度を外挿しない |
| [NyxFoundation/wallet-vuln-dataset](https://github.com/NyxFoundation/wallet-vuln-dataset) | B | walletの過去security fixを収集する公開dataset | custody、署名、鍵管理の過去修正をtest seed候補にする | licenseがGitHub metadataで未確定。利用前にdataset条件を確認する |
| [NyxFoundation/skills](https://github.com/NyxFoundation/skills) | B | agent Skill群の正本として公開されている | security review手順の分割、発火条件、証拠要求を比較する | Skillを無条件にcopyしない。prompt injectionと権限境界を監査する |
| [NyxFoundation/mulu](https://github.com/NyxFoundation/mulu) | B | 形式model、証明certificate、kernel再検査、unsupported時の非ゼロ終了を扱う | 証明対象と未証明範囲を分け、改変検知と独立再検査を置く | source program全体の安全証明とは限らない。model対応範囲を確認する |
| [NyxFoundation/bb-crypto-inventory](https://github.com/NyxFoundation/bb-crypto-inventory) | B | endpoint観測から暗号資産inventoryとCBOMを作る構成を公開 | crypto inventory、観測channel、confidence、blackbox限界を分ける | network scanと能動検証を含み得る。承認済みscope以外で実行しない |

## リポジトリ・供給網・CI

| source | 区分 | 公開されている用途 | 導入時に確認する一般的な論点 |
|---|---|---|---|
| [OpenSSF Scorecard](https://github.com/ossf/scorecard) | A | OSS projectのsecurity health metrics | branch protection、review、pinned dependency、token permission、SAST、fuzzing、security policyを分けて確認する |
| [SLSA](https://github.com/slsa-framework/slsa) | A | software artifactのsupply-chain level | source、build、provenance、distributionを追跡する |
| [in-toto](https://github.com/in-toto/in-toto) | A | supply-chain integrity framework | 誰がどのstepを実行し、何を生成したかを証拠化する |
| [Sigstore Cosign](https://github.com/sigstore/cosign) | A | containerとbinaryの署名・透明性 | artifact署名、identity、verification policyを分ける |
| [Syft](https://github.com/anchore/syft) | B | imageとfilesystemからSBOMを生成 | dependency inventoryをscanより先に固定する |
| [CycloneDX CLI](https://github.com/CycloneDX/cyclonedx-cli) | A | SBOMの解析、merge、diff、形式変換 | SBOM生成だけでなく差分と形式検証を見る |
| [OSV-Scanner](https://github.com/google/osv-scanner) | A | OSV dataを使うGo製vulnerability scanner | lockfile/SBOMとadvisoryを照合し、対象versionを残す |
| [Trivy](https://github.com/aquasecurity/trivy) | B | container、Kubernetes、repository、cloudの脆弱性、設定、secret、SBOM検査 | 複数scannerを一つの合否へ潰さず、finding種別を保つ |
| [Gitleaks](https://github.com/gitleaks/gitleaks) | B | secret検出 | current treeとhistoryを分け、検出後の失効確認を別checkにする |
| [Zizmor](https://github.com/zizmorcore/zizmor) | B | GitHub Actionsの静的解析 | workflowのpermission、危険な式展開、第三者Action参照を検査する |
| [pnpm公式文書source](https://github.com/pnpm/pnpm.io/blob/main/docs/supply-chain-security.md) | A | pnpmの供給網security設定 | package manager版、lockfile固定、release-age、trust policy、install script許可を版別に確認する |

## container・cloud・runtime

| source | 区分 | 公開されている用途 | 導入時に確認する一般的な論点 |
|---|---|---|---|
| [Hadolint](https://github.com/hadolint/hadolint) | B | Dockerfileとinline shellのlint | Dockerfile規則をbuild前に検査する |
| [Docker Bench for Security](https://github.com/docker/docker-bench-security) | A | production Docker配置のbest-practice検査 | daemon、host、container設定をimage scanと別に確認する |
| [Kube-bench](https://github.com/aquasecurity/kube-bench) | B | CIS Kubernetes Benchmarkに沿った配置確認 | cluster/node/control plane設定の証拠を取る |
| [Falco](https://github.com/falcosecurity/falco) | A | cloud native runtime security | build時検査では見えないprocess、file、network挙動を監視する |
| [Checkov](https://github.com/bridgecrewio/checkov) | B | IaC、container image、packageのbuild時misconfiguration検出 | Terraform/Kubernetes等の設定をdeploy前に検査する |

## application・AI

| source | 区分 | 公開されている用途 | 導入時に確認する一般的な論点 |
|---|---|---|---|
| [GitHub CodeQL](https://github.com/github/codeql) | A | code scanningを支えるqueryとlibrary | SAST findingをquery、language、revisionと紐づける |
| [OWASP LLM Security Verification Standard](https://github.com/OWASP/www-project-llm-verification-standard) | A | LLM security verification standard | model、prompt、tool、data、retrieval、output、operationを層別に確認する |
| [OWASP Top 10 for LLM Applications](https://github.com/OWASP/www-project-top-10-for-large-language-model-applications) | A | LLM applicationの主要risk分類 | prompt injection、sensitive information、supply chain、excessive agency等をthreat seedにする |

## 情シス・端末運用

| source | 区分 | 公開されている用途 | 導入時に確認する一般的な論点 |
|---|---|---|---|
| [osquery](https://github.com/osquery/osquery) | B | OS状態をSQL形式で観測 | device inventory、process、package、設定状態を定期取得する |
| [Fleet](https://github.com/fleetdm/fleet) | B | open device management | device enrollment、query、policy、remediation、ownerを管理する |
| [Wazuh](https://github.com/wazuh/wazuh) | B | endpoint/cloud向けXDR・SIEM | endpoint event、alert、correlation、response証拠を扱う |
| [NIST OSCAL](https://github.com/usnistgov/OSCAL) | A | security controlとassessment情報を機械可読形式で扱う | control catalog、profile、実装、assessment、resultを別記録にする |
| [CISA ScubaGear](https://github.com/cisagov/ScubaGear) | A | M365 tenantをCISA baselineに対して自動評価する | SaaS設定を人手の画面確認だけにせず、baselineと実結果を保存する |
| [Microsoft365DSC](https://github.com/Microsoft365DSC/Microsoft365DSC) | B | Microsoft 365 tenant設定の取得、管理、監視 | SaaS設定のsnapshot、差分、drift、復旧可能性を確認する |

## 調査から得た共通設計

1. inventoryを先に作り、scan対象の欠落を見えるようにする。
2. candidate、corroborated、verifiedを別状態にする。
3. 静的findingは、可能な場合に隔離環境の再現と負の対照で確かめる。
4. source、build、release、deploy、runtimeを別の証拠として保存する。
5. toolのPASSを安全性全体のPASSにしない。
6. unsupported、not reachable、not reproduced、mitigatedを黙って削除しない。
7. policy、target、threshold、exceptionはrunner外から渡す。
8. active validationにはauthorized scopeと人の承認を必須にする。

## 導入前の未確認

- 各toolの現在versionとbreaking change。
- transitive dependencyと配布binaryの署名。
- licenseの組み合わせと社内利用条件。
- offline実行可否、telemetry、外部送信先。
- false positive、false negative、対象language・package manager・OSの対応範囲。
- 結果JSON/SARIF/SBOMを共通resultへ変換するためのfield対応。
