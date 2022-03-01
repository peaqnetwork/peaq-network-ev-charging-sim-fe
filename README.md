## Quick-start

```bash
npm install && npm run start:dev
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
