
let txt
let userName; // Declare the variable at a higher scope
let role;
let projectsName = [];
let projectsName2 = [];
let pTemp, uName, pForTask;
let length;

beforeEach(() => {
  cy.visit("http://localhost:4201//login")
  // cy.visit("http://localhost:4201/dashboard")
  cy.get('#mat-input-0').type("CCCEMP0055")
  cy.get('#mat-input-1').type("pritey@911")
  cy.get('button[type="submit"]').click()
  cy.url().should("eq", "http://localhost:4201/dashboard")
  // if(cy.get('.mat-step-text-label').should("contain","Project Preference"))
  // if(!(cy.get('.active > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content > span').should("contain"," Dashboard")))
  // {
  //   // cy.get('.mat-mdc-button-touch-target').click({force:true})
  //   cy.get('.mdc-button__label').click({force:true})
  //   // cy.get('.mat-mdc-button-touch-target').click()
  // }
  cy.wait(3000)
  cy.get('.mat-drawer').should('be.visible');
  cy.get('.container-wrapper').should('be.visible');
  cy.get('.header-right > .mat-mdc-list-item').click()

  cy.get(':nth-child(2) > .content-item-blk > a')
  .invoke('text') // Extract the text content of the selected element
    .as('userName') // Store the text in the variable with the alias 'userName'
    .then((text) => {
      // Store the text in the variable declared at a higher scope
      userName = text;
    });
  cy.get('p.ng-star-inserted')
  .invoke('text') // Extract the text content of the selected element
    .as('role') // Store the text in the variable with the alias 'userName'
    .then((text) => {
      // Store the text in the variable declared at a higher scope
      role = text;
    });
})

describe("Tasks Module Testing", () => {
  
  it("", () => {
    let totalProject = 0;
    
    let totalP = 0;
    let projectLength = 0;
    cy.get('[ng-reflect-router-link="tasks"] > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content').click({force: true})
    cy.wait(3000)
    cy.get('.assignee-wrapper > .close-icon-wrapper > .mat-mdc-form-field > .mat-mdc-text-field-wrapper').click()

    // /1. By default only logged in user should be displayed as selected.
    cy.get('.mat-option-wrapper .mdc-list-item__primary-text').eq(0)
    .invoke('text')
    .then((text) => {
      expect(text.substring(3)).to.contains(userName)
    })
    cy.get('.cdk-overlay-backdrop').click()

    cy.get('#mat-select-value-5 > .mat-mdc-select-value-text > .select-value').click({force:true})

    //By default 3 status should be displayed as selected. To Do, In Progress, On Hold.
    cy.get('#mat-option-8 > .mdc-list-item__primary-text')
    .invoke('text')
    .then((text) => {
      expect(text).to.contains("To Do")
    })
    cy.get('#mat-option-8 > .mat-pseudo-checkbox')   
    .invoke('attr', 'ng-reflect-state')
    .should('eq', 'checked')

    cy.get('#mat-option-9 > .mdc-list-item__primary-text')
    .invoke('text')
    .then((text) => {
      expect(text).to.contains("In Progress")
    })
    cy.get('#mat-option-9 > .mat-pseudo-checkbox')
    .invoke('attr', 'ng-reflect-state')
    .should('eq', 'checked')

    cy.get('#mat-option-10 > .mdc-list-item__primary-text')
    .invoke('text')
    .then((text) => {
      expect(text).to.contains("On Hold")
    })
    cy.get('#mat-option-10 > .mat-pseudo-checkbox')
    .invoke('attr', 'ng-reflect-state')
    .should('eq', 'checked')

    //Close button should be displayed to remove the selection.
    cy.get('.filter-close').eq(2).should('exist')
    cy.get('.cdk-overlay-backdrop').click()
    //By Default Project value should be displayed as selected value.
    cy.get('.mat-mdc-select-value-text').eq(2).should("contain", "Project")

    // cy.get('.cdk-overlay-backdrop').click()
    cy.get('[ng-reflect-router-link="project"] > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content > span').click()
    if(role != "Super Admin")
    {
      cy.get('strong > .ng-star-inserted')
        .invoke('text')
        .then((text) => {
          totalProject = Number(text.slice(1, text.length - 1));
          // totalProject = 1
          for (let i = 1; i <= totalProject; i++) {
            cy.get(`:nth-child(${i}) > .mat-mdc-card > .mat-mdc-card-content > .card-height > :nth-child(2) > [src="assets/images/pencil.svg"]`).click()

            cy.wait(2000);
            cy.get('.workspace-team > .workspace-team-right > .add-h2 > .workspace-dialog > .chip-wrap > .mat-mdc-chip-set > .mdc-evolution-chip-set__chips > .ng-star-inserted')
            .invoke('text')
            .then((text) => {
              if(text.includes(userName))
              {
                cy.get('input[placeholder="Project Name"]').then(($input) => {
                  const ta = $input.val()
                  projectsName.push(ta)
                })
              }
            })
            
            cy.wait(2000);
            cy.get('.cancel > .mdc-button__label').click()
            cy.get('.cancel > .mdc-button__label > span').click()
          }
          // if(projectsName.length >= 0) {
          //   for(let i=0;i< projectsName.length;i++){
          //     cy.log(projectsName[i])
          //   }  
          //   cy.get('[ng-reflect-router-link="tasks"] > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content > span').click({force:true})

          //   cy.get('workspace-grouped-project-selection > .close-icon-wrapper > .mat-mdc-form-field > .mat-mdc-text-field-wrapper').click()
          //   // for(let j=0 j<j;j++)
          //   // It should display only those project in which the logged in user is included. 
          //   cy.get('mat-option')
          //   .invoke('text')
          //   .then((text) => {
          //     // projectLength = Number(text.slice(1, text.length - 1));
          //     // cy.log(text)
          //     for(let i=0;i< projectsName.length;i++){
          //       // cy.log(projectsName[i])
          //       if(!text.includes(projectsName[i]))
          //       {
          //         throw new Error("test fails here because " + projectsName[i] +" does not exists")
          //       }
          //     }
          //   })
          // }
          cy.log(projectLength)
      });
      cy.get('[ng-reflect-router-link="tasks"] > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content > span').click({force:true})
      
      //Only placeholder should be displayed.
      if(projectsName.length < 0)
      {
        cy.log("No projects assigned")
        cy.get('workspace-grouped-project-selection > .close-icon-wrapper > .mat-mdc-form-field > .mat-mdc-text-field-wrapper')
        .should("contain", "Workspace and Project")
        cy.get('workspace-grouped-project-selection > .close-icon-wrapper > .mat-mdc-form-field > .mat-mdc-text-field-wrapper').click()
        cy.get('.cdk-overlay-container .task_count').should("contain","0 Selected")
      }

      // cy.get('#mat-select-value-23 > .mat-mdc-select-value-text > .select-value').click({force:true})
      
      //class for status
      // cy.get('mat-option .mdc-list-item__primary-text')
    }
  })

  it("Add new task", async () => {
    let totalProject2 = 0;
      // cy.on("fail", (err, runnable) => {
      //   cy.log(err.message);
      //   return false;
      // });
      // cy.on('uncaught:exception', (err, runnable) => {
      //   if(err.message.includes('Unexpected token')){
      //   console.log('Application Error Javascript Token')
      //   return false;
      //  }
      //  return true
      //  })
      cy.get('[ng-reflect-router-link="tasks"] > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content').click({force: true})

      cy.get('.mdc-button__label').click({force: true})
      cy.wait(1000)
      cy.log("-----------Check for right URL-----------")

      cy.url().should("eq", "http://localhost:4201/tasks/add?r_url=list")
      cy.wait(3000)

      cy.log("---------------Click on save button without filling any detail------------")
      cy.get('.next > .mdc-button__label').click({force:true})
      cy.wait(3000)
      // cy.get('.project-dropdown-wrapper > .mat-mdc-form-field')
      cy.log("---------------Checking for mandatory fields------------")
      cy.get('.project-dropdown-wrapper > .mat-mdc-form-field > .mat-mdc-text-field-wrapper > .mat-mdc-form-field-flex > .mat-mdc-form-field-infix > .error')
      .should("contain", "Please select project.")
      cy.wait(2000)
      cy.get('.task-type-wrapper > .mat-mdc-form-field > .mat-mdc-text-field-wrapper > .mat-mdc-form-field-flex > .mat-mdc-form-field-infix > .error')
      .should("contain", "Please select task Type")
      cy.wait(2000)
      cy.get('.task-name-wrapper > .error')
      .should("contain", "Task title is required")
      cy.wait(2000)
      cy.get('.right-btn > .mat-mdc-form-field > .mat-mdc-text-field-wrapper > .mat-mdc-form-field-flex > .mat-mdc-form-field-infix > .error')
      .should("contain", "Sub status is required")
      cy.wait(2000)
      cy.get('.next > .mdc-button__label').click({force:true})
      // cy.get('div[class="snackbar"]').should("contain","Task title is required")
      cy.wait(3000)
      cy.log("-------------Checking project dropdown as per assigned project list----------")
      cy.get('.project-dropdown-wrapper > .mat-mdc-form-field > .mat-mdc-text-field-wrapper').click()
      cy.get('mat-option')
      .invoke('text')
      .then((text) => {
        // projectLength = Number(text.slice(1, text.length - 1));
        cy.log(text)
        for(let i=0;i< projectsName.length;i++){
          cy.log(projectsName[i])
          if(!text.includes(projectsName[i]))
          {
            throw new Error("test fails here because " + projectsName[i] +" does not exists")
          }
        }
      })
    //   cy.wait(1000)
    //   cy.get('mat-select[placeholder="Project"]').click({force: true})
      cy.wait(2000)

      cy.log("---------------Selecting project------------")
      cy.get('mat-option .mdc-list-item__primary-text').eq(3).click()
      cy.wait(2000)
      // cy.get(':nth-child(1) > .task-right-label > .cursor-pointer > .name-icon-wrapper')
      // .invoke('text')
      // .then((text) => {
      //   expect(text).to.contains(userName)
      // })
      // cy.get(':nth-child(2) > .task-right-label > .cursor-pointer > .name-icon-wrapper')
      // .invoke('text')
      // .then((text) => {
      //   expect(text).to.contains(userName)
      // })
      cy.log("-----------------Checking default value of priority to be Normal---------------")
      cy.get('.mat-mdc-menu-trigger > .name-icon-wrapper').should("contain","Normal")
      cy.wait(2000)
      // cy.get('.project-dropdown-wrapper > .mat-mdc-form-field > .mat-mdc-text-field-wrapper').click()
      // cy.get('#mat-option-27 > .mdc-list-item__primary-text').click({force:true})
      // cy.get('#mat-select-value-11')
      // .invoke('text')
      // .as('pForTask')
      // .then((text) => {
      //   pForTask = text
      //   cy.log(pForTask)
      // })
      // cy.get('.cancel > .mdc-button__label').click()
      // cy.get('.cancel > .mat-mdc-button-touch-target').click({force:true})
      // cy.get('.cancel > .mdc-button__label > span').click({force:true})
      // cy.wait(3000)
      // cy.get('[ng-reflect-router-link="project"] > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content > span').click({force:true})
      // cy.wait(5000)
      // cy.log(pForTask)
      // cy.get('#mat-mdc-form-field-label-42 > .ng-tns-c181-104').click()
      cy.wait(3000)
      //It should show all the records in which 'na' term included in the project name
      cy.log("-----------Checking for search field inside project dropdown---------")
      cy.get('#mat-select-value-11').click()
      cy.wait(2000)
      cy.get('.mat-select-search-inner > .mat-select-search-input').type("test")
      cy.wait(2000)
      cy.get('mat-option')
      .invoke('text')
      .then((text) => {
        // projectLength = Number(text.slice(1, text.length - 1));
        cy.log(text)
        expect(text).to.includes('test')
      })
      cy.wait(2000)
      cy.get('.cdk-overlay-backdrop').click({force:true})
      cy.wait(2000)
      cy.log("-----------Checking for task type--------------")
      cy.get('.task-type-wrapper > .mat-mdc-form-field > .mat-mdc-text-field-wrapper').click({force:true})

      cy.get('mat-option')
      .invoke('text')
      .then((text) => {
        expect(text).to.includes('Task','Bug','Epic')
      })
      // cy.get('#mat-mdc-form-field-label-42 > .ng-tns-c181-104').type(pForTask)
      cy.wait(2000)
      cy.log("----------Selecting task type to be Task-----------")
      cy.get('mat-select[placeholder="Task type"]').click({force: true})
      cy.wait(2000)
      cy.get('mat-option .mdc-list-item__primary-text').eq(0).click({force: true})
      cy.wait(2000)
      cy.log("-----------------Checking validations on task title field--------------")
      cy.get('input[placeholder="Name"]').type("New")
      cy.get('.error').should('contain',"Task title should be of at least 5 characters")
      cy.get('input[placeholder="Name"]').clear()
      cy.get('input[placeholder="Name"]').type("  ")
      cy.get('.next > .mdc-button__label').click({force:true})
      cy.get('.error').should('contain',"Task title is required")

      cy.get('input[placeholder="Name"]').clear()
      cy.get('input[placeholder="Name"]').type("New Testing Task")
      cy.wait(1000)

    //cy.get('.ql-editor').type("this is for checking character limit....................................................lllllllllllllllllllllllllllllllllllllllllooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo")

      cy.wait(1000)
      
      cy.get('#fileDropRef').attachFile("node.msi");
      cy.wait(3000)
      
      cy.get('#cdk-overlay-7')
      .invoke('text')
      .then((text) => {
        cy.log(text)
        // expect(text).to.includes("File size should not be more than 5 mbclose")
      })
      // should("contain","File size should not be more than 5 mb")
      cy.wait(6000)

      cy.get('#fileDropRef').attachFile({filePath:"one.msi",allowEmpty: true})
      cy.get('#cdk-overlay-8').should("contain","extensions are allowed only.")
      cy.wait(6000)
      cy.get('#fileDropRef').attachFile("image.png", { subjectType: 'drag-n-drop' })
      cy.get('#fileDropRef').attachFile("image.png", { subjectType: 'drag-n-drop' })
      cy.get('#cdk-overlay-12').should("contain","A file with the same name has already been uploaded.")
      cy.wait(5000)
      cy.get('#fileDropRef').attachFile("image2.png")
      cy.get('#fileDropRef').attachFile("text4.txt",'text/plain')
      cy.wait(5000)
      cy.get('.upload-file-blk')
      .should("contain","image.png")
      .and("contain","image2.png")
      .and("contain","text.txt")
      .and("contain","text2.txt")
      .and("contain","text3.txt")
      .and("contain","text4.txt")
      cy.wait(5000)

      cy.get('#fileDropRef').attachFile("text5.txt",'text/plain')
      cy.get('#fileDropRef').attachFile("text6.txt",'text/plain')
      cy.get('#fileDropRef').attachFile("text7.txt",'text/plain')
      cy.get('#fileDropRef').attachFile("text8.txt",'text/plain')
      cy.get('#fileDropRef').attachFile("text9.txt",'text/plain')
      cy.wait(2000)
      cy.get('#cdk-overlay-13').should("contain","You are not allowed to add more than 10 documents.")
      cy.wait(3000)

      cy.get('.upload-file-blk')
      .should("contain","text5.txt")
      .and("contain","text6.txt")
      .and("contain","text7.txt")
      .and("contain","text8.txt")
      cy.wait(5000)
      cy.get('.upload-file-blk').should("not.contain","text9.txt")
      cy.get('.upload-file-blk').should("not.contain","node.msi")
      cy.get('.upload-file-blk').should("not.contain","one.msi")
      cy.wait(5000)
      cy.get('.mdc-icon-button > .mat-mdc-button-touch-target').eq(0).click({force:true})
      cy.wait(3000)
      cy.get('.upload-file-blk').should("not.contain","image.png")
      cy.wait(3000)
      // cy.get('.second > .mat-mdc-form-field > .mat-mdc-text-field-wrapper').click({force: true})
      // cy.get('mat-option .mdc-list-item__primary-text').eq(0).click({force: true})
      cy.get(':nth-child(6) > .task-right-label > .name-icon-wrapper').click({force:true})
      cy.get('.mat-calendar-next-button').click()
      cy.get(':nth-child(2) > [data-mat-col="2"] > .mat-calendar-body-cell').click({force:true})
      cy.get(':nth-child(7) > .task-right-label > .name-icon-wrapper').click({force:true})
      cy.get('.mat-calendar-next-button').click({force:true})
      cy.get(':nth-child(2) > [data-mat-col="5"] > .mat-calendar-body-cell').click({force:true})
      cy.get('.cdk-overlay-backdrop').click({force:true})
      cy.wait(3000)
      // cy.get(':nth-child(1) > .cursor-pointer > .name-icon-wrapper').eq(1).click({force:true})
      // cy.get(':nth-child(8) > .task-right-label > :nth-child(1) > .cursor-pointer > .name-icon-wrapper').click()
      cy.get(':nth-child(8) > .task-right-label > :nth-child(1) > .cursor-pointer > .name-icon-wrapper').click({force:true})
      cy.wait(3000)
      
      // cy.get('#myInput').type("4")
      // .type('{enter')
      cy.wait(3000)
      // cy.get('.next > .mdc-button__label').click({force:true})
      // cy.wait(3000)
      // cy.get('.comon-gap-wrapper > .view-task-edit > .view-task-edit-inner')
      // .should("contain","New Testing Task")
      // cy.wait(1000)
      // cy.get('[ng-reflect-router-link="tasks"] > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content').click({force: true})
      // cy.wait(1000)
      // cy.get(':nth-child(1) > .task-name-outer-wrapper > .task-name-wrapper > .task-name')
      // .should("contain","New Testing Task")
      // cy.wait(1000)
      // cy.get(':nth-child(1) > .task-status-wrapper-outer > .task-status-wrapper')
      // .should("contain","todo")
      // cy.wait(1000)


      // let project 
      // cy.get(':nth-child(1) > .project-wrapper-outer > .task-info')
      // .invoke('text')
      //   .then((text) => {
      //     project = text
      //   })
      // cy.get('.mat-content > .mat-mdc-tooltip-trigger')
      // .invoke('text')
      //   .then((text) => {
      //     cy.log(text)
      //     cy.log(project)
      //     expect(text).to.contain(project)
      //   })
    
    cy.get(':nth-child(1) > .task-name-outer-wrapper > .task-name-wrapper > .task-name').eq(0).click({force:true})
    // // cy.get('.comon-gap-wrapper > .view-task-edit > .view-task-edit-inner').click()
    // // cy.get('input[placeholder="Name"]').type("Created task for testing purpose")
    // cy.get('.mat-mdc-menu-trigger > .mat-mdc-tooltip-trigger').click({force:true})
    // cy.get(':nth-child(3) > .mdc-list-item__primary-text').click({force:true})
    // cy.get('.next > .mdc-button__label').click({force:true})
    // // cy.get('.mdc-tooltip__surface .mdc-tooltip__surface-animation').should("contain","epic")

    // cy.get('[ng-reflect-router-link="reports"] > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content').click({force:true})
    // cy.get(':nth-child(6) > .icon').click({force:true})
    

    //open comment till this
  //   cy.get('.mat-mdc-paginator-range-label')
  //   .invoke('text')
  //   .as('length')
  //   // .then((text) => {
  //   //   cy.log(text)
  //   //   length = text.slice(-3)
  //   // })
  // //   const myValue = await new Cypress.Promise((resolve) => {
  // //     cy.get('.mat-mdc-paginator-range-label')
  // //         .invoke('text')
  // //         .then((txt) => resolve(txt.toString()))
  // //  })
  // //   cy.log("--------------------------length-------------",myValue)

  //     for(let i=1; i<=15; i++)
  //     {
  //       cy.get(`.mdc-data-table__content > :nth-child(${i}) > .project-title`)
  //       //.then(($input) => {
  //         .invoke('text')
  //         .as('projectsName2')
  //         // .then((text) => {
  //           .then(($input) => {
  //             const ta = $input.val()
  //             projectsName2.push(ta)
  //           // cy.log(text)
  //           // projectsName2.push(text)
  //           // cy.log(projectsName2[i])
  //         })
  //       // cy.get('.project-title .ng-star-inserted')
  //         // const ta = $input.val()
          
  //       // })
  //     }
  //     cy.log(projectsName2.length)
  //     for(let i=0; i< projectsName2.length; i++)
  //     {
  //       cy.log(projectsName2[i])
  //     }
    // })
    // cy.get('.project-title')
    // .invoke('text')
    //     .then((text) => {
    //       totalProject2 = Number(text.slice(1, text.length - 1));
    //       cy.log(totalProject2)
    //       // totalProject = 1
    //       // for (let i = 1; i <= totalProject; i++) {
    //       //   cy.get(`:nth-child(${i}) > .mat-mdc-card > .mat-mdc-card-content > .card-height > :nth-child(2) > [src="assets/images/pencil.svg"]`).click()

    //       //   cy.wait(2000);
    //       //   cy.get('.workspace-team > .workspace-team-right > .add-h2 > .workspace-dialog > .chip-wrap > .mat-mdc-chip-set > .mdc-evolution-chip-set__chips > .ng-star-inserted')
    //       //   .invoke('text')
    //       //   .then((text) => {
    //       //     if(text.includes(userName))
    //       //     {
    //       //       cy.get('input[placeholder="Project Name"]').then(($input) => {
    //       //         const ta = $input.val()
    //       //         projectsName.push(ta)
    //       //       })
    //       //     }
    //         })
    //       // }
  })  


  it("Add quick task", () => {
    cy.get('[ng-reflect-router-link="tasks"] > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content').click({force: true})
 
    cy.get('workspace-grouped-project-selection > .close-icon-wrapper > .mat-mdc-form-field > .mat-mdc-text-field-wrapper').click()
    cy.get('.button-wrapper > div > :nth-child(2)').click()
    cy.get('#mat-mdc-checkbox-10 > .mdc-form-field > .mdc-checkbox > .mat-mdc-checkbox-touch-target').click()
    cy.get('.cdk-overlay-backdrop').click({force:true})

    cy.wait(2000)
    //Click on quick add task
    cy.get('.new-task-blk').click({force:true})
    cy.get('.status-wrapper > .cursor-pointer > .ng-star-inserted').should("contain","todo")
    cy.get('.task-cancel-svg > .mat-mdc-tooltip-trigger').click({force:true})
    // cy.get('.task-type-wrapper > .close-icon-wrapper > .mat-mdc-form-field > .mat-mdc-text-field-wrapper').click({force:true})

    cy.get('.group-by-wrapper > .mat-mdc-form-field > .mat-mdc-text-field-wrapper').click({force:true})
    //select group by project
    cy.get('#mat-option-12').click({force:true})
    //click on add new task
    cy.get('.new-task-blk').click({force:true})
    let p;
    //getting project name from heading
    cy.get('.project-name')
    .invoke('text')
        .then((text) => {
          p = text
        })
    //getting project name from new task
    cy.get('.mat-content > .mat-mdc-tooltip-trigger')
    .invoke('text')
        .then((text) => {
          expect(text).to.contains(p)
        })
    //checking for to do status as default
    cy.get('.task-type-wrapper > .mat-mdc-tooltip-trigger > span').should("contain", "To Do")
    //click on cancel button
    cy.get('.task-cancel-svg > .mat-mdc-tooltip-trigger').click({force:true})
    //click on group by dropdown
    cy.get('.group-by-wrapper > .mat-mdc-form-field > .mat-mdc-text-field-wrapper').click({force:true})
    //select group by status
    cy.get('#mat-option-13').click({force:true})
    
    let status
    //click on add task link
    cy.get('.new-task-blk').click({force:true})
    if(cy.get('.new-task-blk'))
    {
      cy.get('.new-task-blk').click()
    }

    //grtting status from headting
    cy.get('.task-type-wrapper > .mat-mdc-tooltip-trigger')
    .invoke('text')
    .then((text) => {
      status = text
    })
  //getting status from new task
    cy.get('.mat-content > .mat-mdc-tooltip-trigger')
    .invoke('text')
        .then((text) => {
          expect(text).to.contains(status)
        })
    //click on cancel button
    cy.get('.task-cancel-svg > .mat-mdc-tooltip-trigger').click({force:true})
    //click on group by dropdown
    cy.get('.group-by-wrapper > .mat-mdc-form-field > .mat-mdc-text-field-wrapper').click({force:true})
    // cy.get('#mat-option-19').cliick()
    //select group by user
    cy.get('#mat-option-14 > .mdc-list-item__primary-text').click()
    // cy.get('#cdk-overlay-3').eq(2).click()
    //click on new task link
    cy.get('.new-task-blk').click({forc:true})
    //checking for default status
    cy.get('.task-type-wrapper > .mat-mdc-tooltip-trigger > span').should("contain", "To Do")
    
    cy.get('.task-save-button-wrapper > .mat-mdc-tooltip-trigger').click()
    cy.get('div[class="snackbar"]').should("contain","Task title is required")

    cy.wait(2000)
    // cy.get('.project-wrapper > .mat-mdc-tooltip-trigger').click()
    cy.get('.project-wrapper > .mat-mdc-tooltip-trigger').click({force:true})
    
    cy.get('.project-lisitng-wrapper > :nth-child(1) > .mdc-list-item__content')
    .invoke('text')
        .then((text) => {
          pTemp = text
        })
      cy.log(pTemp)
    cy.get('.project-lisitng-wrapper > :nth-child(1) > .mdc-list-item__content').click({force:true})

    // cy.get('.task-save-button-wrapper > .mat-mdc-tooltip-trigger').click()
    // cy.get('#mat-input-26').type('aaaa')
    cy.get('.add-new-task-left > .mat-mdc-form-field > .mat-mdc-text-field-wrapper > .mat-mdc-form-field-flex > .mat-mdc-form-field-infix').type('aaaa')
    cy.get('.task-save-button-wrapper > .mat-mdc-tooltip-trigger').click()
    cy.get('div[class="snackbar"]').should("contain","Task title should be of at least 5 characters")
    cy.wait(2000)
    // cy.get('#mat-input-26').clear()
    cy.get('.add-new-task-left > .mat-mdc-form-field > .mat-mdc-text-field-wrapper > .mat-mdc-form-field-flex > .mat-mdc-form-field-infix').clear()
    // cy.get('#mat-input-26').type('Test Task')
    cy.get('.add-new-task-left > .mat-mdc-form-field > .mat-mdc-text-field-wrapper > .mat-mdc-form-field-flex > .mat-mdc-form-field-infix').type('Test Task')
    cy.wait(2000)
    cy.get('.task-save-button-wrapper > .mat-mdc-tooltip-trigger').click()
    cy.get('div[class="snackbar"]').should("not.contain","Task title should be of at least 5 characters")
    cy.get('.task-cancel-svg > .mat-mdc-tooltip-trigger').click({force:true})

    cy.get('.new-task-blk').click({forc:true})
    cy.get('.add-new-task-left > .mat-mdc-menu-trigger > .task-cell').click({force:true})
    cy.get('.mat-mdc-menu-content > :nth-child(1)').click({force:true})
    cy.get('.add-new-task-left > .mat-mdc-form-field > .mat-mdc-text-field-wrapper > .mat-mdc-form-field-flex > .mat-mdc-form-field-infix').type('Test Task')

    cy.wait(2000)
    cy.get('.project-wrapper > .mat-mdc-tooltip-trigger').click({force:true})

    cy.wait(5000)
    cy.get('.project-lisitng-wrapper > .ng-star-inserted')
      .invoke('text')
      .then((text) => {
        // projectLength = Number(text.slice(1, text.length - 1));
        cy.log(text)
        for(let i=0;i< projectsName.length;i++){
          cy.log(projectsName[i])
          if(!text.includes(projectsName[i]))
          {
            throw new Error("test fails here because " + projectsName[i] +" does not exists")
          }
        }
      })
      cy.wait(5000)
      let pName
      cy.get('.project-lisitng-wrapper > :nth-child(1) > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content')
      .invoke('text')
      .then((text) => {
        pName = text
        cy.log(pName)
      })
      cy.wait(5000)
      cy.get('.project-lisitng-wrapper > :nth-child(1) > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content').click({force:true})
      cy.get('.task-type-wrapper > .mat-mdc-tooltip-trigger > span').should("contain", "To Do")
      cy.get('.mat-content > .mat-mdc-tooltip-trigger')
      .invoke('text')
      .as('uName')
      .then((text) => {
        uName = text
        cy.log(uName)
      })
      cy.get('.status-wrapper > .cursor-pointer > .ng-star-inserted').click({force:true})
      cy.wait(3000)
      cy.get(':nth-child(1) > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content > .status-dropdown-list').click({force:true})
      cy.wait(3000)
      cy.get('.eta-wrapper').eq(1).click()
      cy.get('#myInput').type("5")
      cy.get('.mat-mdc-list > .ng-star-inserted > .mdc-list-item__content > .mat-mdc-list-item-unscoped-content').click()
      cy.get('.task-save-button-wrapper > .mat-mdc-tooltip-trigger').click()
      cy.get('.close-icon-wrapper > .filter-close').eq(0).click()
      
      // cy.get('#cdk-accordion-child-3 > .mat-expansion-panel-body > .task-list-table-wrapper > tbody > :nth-child(1) > .task-name-outer-wrapper > .task-name-wrapper > .task-name').click({force:true})
      cy.get(':nth-child(1) > .task-name-outer-wrapper > .task-name-wrapper > .task-name').eq(0).click({force:true})
      // cy.get('.task-right-inner > :nth-child(2) > :nth-child(1)')
      cy.get(':nth-child(1) > .task-right-label > .cursor-pointer > .name-icon-wrapper')
      .invoke('text')
      .then((text) => {
        // pName = text
        cy.log(text)
        // expect(text).to.contains(uName)
      })
    })  
})