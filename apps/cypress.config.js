// import { defineConfig } from 'cypress';
// import { nxE2EPreset } from '@nrwl/cypress/plugins/cypress-preset';
// export default defineConfig({
//   e2e: nxE2EPreset(__dirname),
// });

const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});