<p align="center">
  <b style="font-size: 32px;">Tokens² Curated List</b>
  </br>
  <b>DEPRECATED: MIGRATED TO A VANILLA CURATE LIST</b>
</p>

<p align="center">
  <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="JavaScript Style Guide"></a>
  <a href="https://conventionalcommits.org"><img src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg" alt="Conventional Commits"></a>
  <a href="http://commitizen.github.io/cz-cli/"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen Friendly"></a>
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Styled with Prettier"></a>
</p>

The Kleros' Token² Curated List.

## Get Started

1.  Clone this repo;
2.  Duplicate and rename `.env.example` to `.env`;
3.  Inside `.env`, replace <api-key> with your infura key;
4.  Install and set up the [MetaMask](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) chrome extension;
5.  Configure MetaMask on the Kovan Test Network;
6.  Run `yarn` to install dependencies and then `yarn start` to start the dev server.

## Other Scripts

- `yarn run prettify` - Apply prettier to the entire project.
- `yarn run lint:scss` - Lint the entire project's .scss files.
- `yarn run lint:js` - Lint the entire project's .js files.
- `yarn run lint:scss --fix` - Fix fixable linting errors in .scss files.
- `yarn run lint:js --fix` - Fix fixable linting errors in .js files.
- `yarn run lint` - Lint the entire project's .scss and .js files.
- `yarn run cz` - Run commitizen.
- `yarn run build` - Create a production build.
- `yarn run build:analyze` - Analyze the production build using source-map-explorer.
