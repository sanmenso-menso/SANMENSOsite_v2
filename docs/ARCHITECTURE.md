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

## Build and deployment assets

Viteが `dist/` を生成する。`public/_redirects`、`public/_headers`、`public/404.html` はstatic hosting上のroutingとresponse設定に使う。画像最適化は `scripts/` の既存Node scriptで扱う。

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
