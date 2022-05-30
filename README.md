## Quick-start

1. Please check the .env.sample file and setup all the environment variables in your `.env` file.
2. Execute below commands
```bash
npm install && NODE_ENV=development npm run start:dev
```
3. After docker build, if below errors happen, please set up the `-e NODE=development` when running the docker run command.
```
  Provided flags:
    --config-name = ./runtime-env.js
    --env-file = ./.env

  Your environment variables will be available on 'window.__RUNTIME_CONFIG__'

./runtime-env.js does not exist. Creating one...
Error creating ./runtime-env.js: Error: Error getting 'REACT_APP_BE_URL' from process.env
    at /usr/local/lib/node_modules/runtime-env-cra/lib/index.js:45:13
```

## Change BE URL
The default of the BE endpoint is `http://peaq-network-ev-charging-sim-be-jx-devbr.ci.peaq.network`.
However, if we want to change the BE endpoint, we can add `backend=URL` into the current URL.
For example, if we want to connect to http://localhost:25566, we can use the below URL.
```
http://localhost:9000/?backend=http://localhost:25566
```

## Development scripts
```sh
# Install development/build dependencies
npm install

# Start the development server
npm run start:dev

# Run a production build (outputs to "dist" dir)
npm run build

# Run the test suite
npm run test

# Run the test suite with coverage
npm run test:coverage

# Run the linter
npm run lint

# Run the code formatter
npm run format

# Launch a tool to inspect the bundle size
npm run bundle-profile:analyze

# Start the express server (run a production build first)
npm run start

# Start storybook component explorer
npm run storybook

# Build storybook component explorer as standalone app (outputs to "storybook-static" dir)
npm run build:storybook
```
