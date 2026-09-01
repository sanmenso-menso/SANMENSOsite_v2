# WORKS taxonomy and content update

## Scope

未掲載の告知から選定したWORKSを追加し、外向けの主categoryを `Music`、`Visual`、`Live & Culture` に再編する。

## Classification policy

- categoryは、実績が証明する能力と主な受け手を最優先し、媒体、収益化可能性、ブランド整合性を加味して選ぶ。音楽と映像など複数分野の成果物を担当した実績は、該当する複数categoryへ掲載する。
- `Original` / `Client` はproject typeとして継続する。
- ラジオ、取材、インタビューは主categoryにせず、`Appearance` / `Press` の横断属性で表す。
- 共同制作は第四categoryにせず、`Collaboration` の横断属性で表す。
- 複数分野にまたがる実績は、会場や付随作業ではなく主な成果物と将来つなげたい仕事を基準に分類する。

## Outcome

- 既存WORKSを3つの主categoryへ再分類し、複数分野の実績へ複数categoryを設定した。
- `Original` / `Client` filterを維持し、横断属性をcardと詳細dialogへ表示した。
- 公開済み告知から5件のWORKSと画像を追加した。未公開指定の `Synapse-タマシイ` と `つながりvol2.0` は追加していない。
- HOMEのCUBE、update notice、プロフィール文、WORKS表示、mobile navigationとCONTACTの表示を更新した。
- dependency audit、外部リンク、公開画像metadata、runtime挙動を監査し、確認できた問題を修正した。

## Validation

- 全WORKSに1つ以上の対応categoryとproject typeが1つあること
- 横断属性が対応値だけで構成されること
- category / project type filter、FLOW / INDEX、作品詳細が成立すること
- formatter、lint、typecheck、tests、build、audit、実画面smoke testが成功すること
