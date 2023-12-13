// import { getGreeting } from '../src/support/app.po';
describe('angular-main-app', () => {
  
  // beforeEach(() => cy.visit('/'));
  it('should display welcome message', () => {
    cy.visit("http://localhost:4201//login")
    cy.get('#mat-input-0').type("CCCEMP0055")
    cy.get('#mat-input-1').type("pritey@911")
    cy.get('button[type="submit"]').click()
  // cy.url().should("eq", "http://localhost:4201/dashboard")
    // Custom command example, see `../support/commands.ts` file
    // cy.login('my-email@something.com', 'myPassword');
    // // Function helper example, see `../support/app.po.ts` file
    // getGreeting().contains('Welcome angular-main-app');
  });
});
