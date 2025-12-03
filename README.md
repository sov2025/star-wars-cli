# Star Wars Character Search CLI

## Getting Started

Built using Node v24 + pnpm.

- `docker compose up` to run backend API server
- `nvm use` for v24 if needed

And then:

- `pnpm install`
- `pnpm start`

or

- `docker build -t star-wars-cli . && docker run -it --rm -e STARWARS_API_WS=ws://host.docker.internal:3000 star-wars-cli` if you do not have `pnpm`, `node` etc installed locally.

## Notes

- Written in typescript as per requirements. Unsure of the level wanted due to the nature of this take home.
- Lots of things to consider in this app! I focused on the core functionality and making sure it worked well with some semblance of decoupling and separation of concerns. Without going too overkill.
