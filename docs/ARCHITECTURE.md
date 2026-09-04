# Architecture

## Overview

SANMENSOsite_v2は、SANMENSOの作品・活動・連絡先を公開するReact製portfolio siteである。GitHubをSource of Truthとし、Viteで開発・test・production buildを行う。

## Application

- entrypoint: `src/main.jsx`
- route構成と画面遷移: `src/App.jsx`
- page単位のUI: `src/pages/`
- 再利用UIと演出: `src/components/`
- route、作品filter、transition等の純粋logic: `src/utils/`
- 公開画像とhosting設定: `public/`

React Routerがclient-side routingを担い、Framer Motionが画面遷移と主要なmotionを担う。`/secret` は演出上の公開隠しpageであり、認証境界ではない。

`numunumu` の連続キー入力で有効になるnumu modeは `NumunumuContext` がsession内の全routeへ共有する。状態は永続化せず、browser reloadで通常表示へ戻る。

WORKSのFLOW表示は同一作品列を前後へ連結し、scroll位置を循環させて自動再生と手動のdrag、swipe、短い慣性移動、keyboard操作を両立する。操作可能な作品cardは中央の1列だけとし、前後の複製は読み上げとfocusの対象外にする。

WORKSの射的modeはFLOW表示上だけで動作する一時的なgame UIである。filter状態にかかわらず全category・全project typeを景品として表示し、高さと傾きを揃えたまま動き続ける。中央固定の照準へ弾丸が到達した時点で命中を判定し、左右への命中は景品を反対方向へずらすだけで再射撃でき、中央命中だけが景品を落として加点する。得点はORIGINAL 400点、CLIENT 600点をbaseとし、横断属性ごとに100点を加算する。高得点の景品ほど小さく、上下に浮遊して難易度が上がる。scoreと命中状態はmode終了時にresetし、終了後は最終scoreを一時表示する。

WORKSの作品panelは主categoryに対応する面色を持ち、複数categoryの作品は対応色のgradientで示す。project typeはORIGINALを赤い二重枠、CLIENTを青い二重枠で区別する。文字badgeも併用し、色だけに意味を依存させない。長いtitleは文字数に応じて段階的に縮小し、thumbnailの縦横比を固定して作品画像の視認性を保つ。固定高のFLOW panelはtitleを最大3行、説明文を最大2行とし、tagとREAD MOREを含めてpanel内へ収める。全文は作品詳細で表示する。

## Build and deployment assets

Viteが `dist/` を生成する。`public/_redirects` は既知のSPA routeをURLを維持したままroot documentへproxyし、未知のpathは `public/404.html` によるCloudflare Pages標準の404 responseへ委ねる。`public/_headers` はresponse header設定に使う。画像最適化は `scripts/` の既存Node scriptで扱う。

## Validation

- Vitest / jsdom: unit、component、route、content integrityのtest
- ESLint: JavaScript / JSX lint
- TypeScript compiler: `jsconfig.json` に基づくtypecheck
- Prettier: repositoryで明示された対象のformatter check
- Vite: production build
- npm audit: dependency vulnerability確認

## Runtime management

`mise.toml` と `mise.lock` がdevelopment runtimeのSource of Truthである。

- Node 24.11.1
- Python 3.12.10
- Windows x64
- macOS arm64

Nodeはapplicationとproject validationに使用する。Pythonはenvironment doctorとそのunit testsにのみ使用し、application runtimeへ組み込まない。Agentやautomationは `mise exec -- <command>` を優先する。

## Agent Protocol

- 共通作業規則: `AGENTS.md`
- risk別process: `docs/WORKFLOW.md`
- environment diagnosis: `scripts/doctor.py`
- runtime lock: `mise.toml` / `mise.lock`
- 重要判断: `docs/DECISIONS.md`
- 製品境界: `docs/PRODUCT.md`
