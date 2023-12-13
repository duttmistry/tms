
var characters = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
var lenString = 7;
var randomstring = '';
for (var i=0; i<lenString; i++) {
  var rnum = Math.floor(Math.random() * characters.length);
  randomstring += characters.substring(rnum, rnum+1);
}

var projectName = "JS Project " + randomstring

beforeEach(() => {
  cy.visit("http://localhost:4201//login")
  cy.get('#mat-input-0').type("ABC")
  cy.get('#mat-input-1').type("pritey")
  cy.get('button[type="submit"]').click()
  cy.url().should("eq", "http://localhost:4201/login")
  cy.get('#mat-input-0').clear()
  cy.get('#mat-input-1').clear()
  cy.get('#mat-input-0').type("CCCEMP0055")
  cy.get('#mat-input-1').type("pritey@911")
  cy.get('button[type="submit"]').click()
  cy.url().should("eq", "http://localhost:4201/dashboard")
  cy.wait(3000)

  cy.get('.mat-drawer').should('be.visible');
  cy.get('.container-wrapper').should('be.visible');

})
describe("Project module testing", () => {
  it("Create Project", () => {
    // cy.get('.container-child').should("contain","Projects")
    // cy.visit("http://localhost:4201/dashboard")
    cy.get('[ng-reflect-router-link="project"] > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content > span').click()
    // cy.get('input[placeholder="Search"]').type(`${projectName}{enter}`,{force:true})
    // cy.wait(1000)
    // cy.get('.no-record-section').should("contain", "No records found.")
    cy.get('.workspace-blk > strong').should("contain","Projects")
    cy.wait(3000)
    cy.get('button[tabIndex="0"]').click({force:true})
    cy.get('input[placeHolder="Project Name"]').type(projectName)
    cy.get('#mat-select-8').click()
    cy.get('#mat-option-113').click()
    cy.get('input[placeHolder="Project Key"]').type(randomstring)
    cy.get('input[placeHolder="Tag"]').type("ReactJs{enter}")
    // cy.get('#mat-mdc-checkbox-83-input').click()
    // cy.get('#mat-mdc-checkbox-86-input').click()
    // cy.get('input[placeHolder="Tag"]-option-0').click()
    cy.get('input[placeHolder="Start Date"]').click()
    cy.contains('11').click();
    cy.get('input[placeHolder="Estimated Completion Date"]').click({force:true})
    cy.contains("2023").click();
    cy.contains("2024").click();
    cy.contains("DEC").click();
    cy.contains("31").click();
    // cy.get('#mat-mdc-chip-list-input-1').type("Pritee")
    cy.get('#mat-mdc-chip-list-input-1').click()
    // cy.get("input[placeholder='Search...']-option-0'")
    cy.get('#mat-option-144').click()
    // cy.get('#mat-option-136').click()
    cy.get('.next > .mat-mdc-button-touch-target').click({force:true})
    cy.wait(3000)
    cy.get('.container-child').should("contain",projectName)
    //Logout code
    // cy.get('.header-profile-menu > .mat-mdc-tooltip-trigger').click({force:true})
    // cy.get('.cancel > .mdc-button__label > span').click({force:true})
    // cy.url().should("eq", "http://localhost:4201/login")
  })

  it("Edit Project", () => {
    // cy.visit("http://localhost:4201/dashboard")
    cy.get('[ng-reflect-router-link="project"] > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content').click()
    cy.get(':nth-child(1) > .mat-mdc-card > .mat-mdc-card-content > .card-height > :nth-child(2) > [src="assets/images/pencil.svg"]').click()
    cy.get('#mat-input-7').invoke('val').then(txt => cy.log(txt))
    cy.get('#mat-input-7').clear()
    cy.get('#mat-input-7').type("Hello this is for testing")
    
    // cy.get('.workspace-dialog > .chip-wrap > div[_ngcontent-hxt-c373=""] > .mat-icon').click({force:true})
    // cy.get('#myInput').type("Richa")

    cy.get("button[type='submit']").click({force:true})
    cy.get(':nth-child(1) > .mat-mdc-card > .mat-mdc-card-content > .card-height > :nth-child(2) > [src="assets/images/pencil.svg"]').click({force:true})
    cy.wait(3000)
    
    cy.get("textarea[placeholder='Description']").then(($textArea) => {
      const ta = $textArea[0].value
      expect(ta).to.contains("Hello this is for testing")
    })

    //Logout code
    // cy.get('.header-profile-menu > .mat-mdc-tooltip-trigger').click({force:true})
    // cy.get('.cancel > .mdc-button__label > span').click({force:true})
    // cy.url().should("eq", "http://localhost:4201/login")
  })

  it("Project dashboard", () => {
    cy.get('[ng-reflect-router-link="project"] > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content').click()
    cy.get('#mat-select-2 > .mat-mdc-select-trigger').click()
    cy.get('.button-wrapper > div > :nth-child(2)').click()

    //Logout code
    // cy.get('.header-profile-menu > .mat-mdc-tooltip-trigger').click({force:true})
    // cy.get('.cancel > .mdc-button__label > span').click({force:true})
    // cy.url().should("eq", "http://localhost:4201/login")
  })

  it("Match Project members count", () => {
    // cy.visit("http://localhost:4201/dashboard")
    let totalProject = 0;
    cy.get('[ng-reflect-router-link="project"] > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content > span').click()
      cy.get('strong > .ng-star-inserted')
        .invoke('text')
        .then((text) => {
          totalProject = Number(text.slice(1, text.length - 1));
          for (let i = 1; i <= totalProject; i++) {
            cy.get(`:nth-child(${i}) > .mat-mdc-card > .mat-mdc-card-content > .card-height > :nth-child(2) > [src="assets/images/pencil.svg"]`).click()
  
            cy.wait(2000);
            // cy.get('.chip-wrap > .mat-mdc-chip-set > .mdc-evolution-chip-set__chips > .ng-star-inserted')
            cy.get('.workspace-team > .workspace-team-right > .add-h2 > .workspace-dialog > .chip-wrap > .mat-mdc-chip-set > .mdc-evolution-chip-set__chips > .ng-star-inserted')
            .its('length')
            .then((len) => {
              cy.get('.cancel > .mat-mdc-button-touch-target').click({force:true})
              cy.get('.mat-mdc-dialog-actions > .cancel > .mat-mdc-button-touch-target').click({force:true})
              cy.get(`:nth-child(${i}) > .mat-mdc-card > .mat-mdc-card-content > .card-height > :nth-child(1) > :nth-child(1) > span`).contains(len)
            })
            cy.wait(2000);
            cy.get(
              '#cdk-accordion-child-0 > .mat-expansion-panel-body > :nth-child(2) > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content'
            ).click();
          }
        });
      });

      // it("count", () => {
      //   let totalProject = 0;
      //   cy.get('[ng-reflect-router-link="project"] > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content > span').click()
        
      //   cy.get(':nth-child(1) > .mat-mdc-card > .mat-mdc-card-content > .card-height > :nth-child(2) > [src="assets/images/pencil.svg"]').click()

      //   cy.get('.chip-wrap > .mat-mdc-chip-set > .mdc-evolution-chip-set__chips > .ng-star-inserted')
      //   .its('length')
      //   .then((len) => {
      //     cy.get('.cancel > .mat-mdc-button-touch-target').click({force:true})
      //     cy.get('.mat-mdc-dialog-actions > .cancel > .mat-mdc-button-touch-target').click({force:true})
      //     cy.get(':nth-child(1) > .mat-mdc-card > .mat-mdc-card-content > .card-height > :nth-child(1) > :nth-child(1) > span').contains(len)
      //   })

      // });

      afterEach(() => {
      // Logout code
          cy.get('.header-profile-menu > .mat-mdc-tooltip-trigger').click({force:true})
          cy.get('.cancel > .mdc-button__label > span').click({force:true})
          cy.url().should("eq", "http://localhost:4201/login")
      });
})