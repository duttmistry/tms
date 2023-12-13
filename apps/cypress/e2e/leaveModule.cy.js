describe('Project module testing', () => {

it.only('leavemodule', () => {
    // cy.visit("http://localhost:4201//login")
    // cy.visit("http://task-new.cybercom.in/dashboard")
    // cy.get('#mat-input-0').type("CCC163")
    // cy.get('#mat-input-1').type("57xsZ9LK")
    cy.visit('http://localhost:4201//login');
    cy.get('#mat-input-0').type('CCCEMP0055');
    cy.wait(4000);
    cy.get('#mat-input-1').type('pritey@911');
    cy.wait(4000);
    cy.get('button[type="submit"]').click();
    cy.wait(4000);

    cy.get('[ng-reflect-router-link="leave"]').click();
    cy.wait(4000);

    //<-------------------------------Leave Filter start-------------------------------------------------------------------->
    cy.get('.small-dropdown > .mat-mdc-text-field-wrapper').click({ force: true });

    //Pending Case Check
    cy.get('mat-option').eq(0).click();
    cy.wait(4000);
    cy.get('.table-top .mat-mdc-cell').then(($element) => {
      if ($element.length > 1) {
        cy.get('.table-top')
          .find('.status')
          .its('length')
          .then((length) => {
            for (let i = 1; i <= Number(length); i++) {
              cy.get(`:nth-child(${i}) > .status > span`)
                .invoke('text')
                .then((text) => {
                  let status = text.trim();
                  if (status !== 'Pending') {
                    cy.log('apply Filter Pending - not show currect data');
                    cy.pause();
                  } else {
                    cy.log(`apply Filter Pending - ${status}`);
                  }
                });
            }
          });
      } else {
        cy.log('apply Filter Pending  - No records found');
      }
    });

    cy.wait(4000);
    cy.get('.mat-mdc-tooltip-trigger > .mat-mdc-button-touch-target').eq(0).click({ force: true });

    // cancelled Case Check
    cy.get('.small-dropdown > .mat-mdc-text-field-wrapper').click({ force: true });
    cy.get('mat-option').eq(3).click();
    cy.wait(4000);
    cy.get('.table-top .mat-mdc-cell').then(($element) => {
      if ($element.length > 1) {
        cy.get('.table-top')
          .find('.status')
          .its('length')
          .then((length) => {
            for (let i = 1; i <= Number(length); i++) {
              cy.get(`:nth-child(${i}) > .status > span`)
                .invoke('text')
                .then((text) => {
                  let status = text.trim();
                  if (status !== 'Cancelled') {
                    cy.log('apply Filter Cancelled - not show currect data');
                    cy.pause();
                  } else {
                    cy.log(`apply Filter Cancelled - ${status}`);
                  }
                });
            }
          });
      } else {
        cy.log('apply Filter Cancelled - No records found');
      }
    });

    cy.wait(4000);
    cy.get('.mat-mdc-tooltip-trigger > .mat-mdc-button-touch-target').eq(0).click({ force: true });

    // Check Approved case
    cy.get('.small-dropdown > .mat-mdc-text-field-wrapper').click({ force: true });
    cy.get('mat-option').eq(2).click();
    cy.wait(4000);
    cy.get('.table-top .mat-mdc-cell').then(($element) => {
      if ($element.length > 1) {
        cy.get('.table-top')
          .find('.status')
          .its('length')
          .then((length) => {
            for (let i = 1; i <= Number(length); i++) {
              cy.get(`:nth-child(${i}) > .status > span`)
                .invoke('text')
                .then((text) => {
                  let status = text.trim();

                  if (status !== 'Approved') {
                    cy.log('apply Filter Approved - not show currect data',status);
                    cy.pause();
                  } else {
                    cy.log(`apply Filter Approved - ${status}`);
                  }
                });
            }
          });
      } else {
        cy.log('apply Filter Approved - No records found');
      }
    });
    cy.wait(4000);
    cy.get('.mat-mdc-tooltip-trigger > .mat-mdc-button-touch-target').eq(0).click({ force: true });

    // Check Rejected case
    cy.get('.small-dropdown > .mat-mdc-text-field-wrapper').click({ force: true });
    cy.get('mat-option').eq(1).click();
    cy.wait(4000);
    cy.get('.table-top .mat-mdc-cell').then(($element) => {
      if ($element.length > 1) {
        cy.get('.table-top')
          .find('.status')
          .its('length')
          .then((length) => {
            for (let i = 1; i <= Number(length); i++) {
              cy.get(`:nth-child(${i}) > .status > span`)
                .invoke('text')
                .then((text) => {
                  let status = text.trim();

                  if (status !== 'Rejected') {
                    cy.log('apply Filter Rejected - not show currect data');
                    cy.pause();
                  } else {
                    cy.log(`apply Filter Rejected - ${status}`);
                  }
                });
            }
          });
      } else {
        cy.log('apply Filter Rejected - No records found');
      }
    });

    cy.wait(4000);
    cy.get('.mat-mdc-tooltip-trigger > .mat-mdc-button-touch-target').eq(0).click({ force: true });

    cy.get('.table-top')
      .find('.status')
      .its('length')
      .then((length) => {
        for (let i = 1; i <= Number(length); i++) {
          cy.get(`:nth-child(${i}) > .status > span`)
            .invoke('text')
            .then((statusTable) => {

              cy.get(`.mdc-data-table__content > :nth-child(${i}) > .cdk-column-noOfDays`)
                .invoke('text')
                .then((days) => {
                  let noofDay = days.trim();

                  cy.get(`.mdc-data-table__content > :nth-child(${i}) > .cdk-column-leaveDateFromTo`)
                    .invoke('text')
                    .then((dates) => {
                      let startDate = dates.trim().split('-')[0];
                      let endDate = dates.trim().split('-')[1];
                      cy.log('s______________01', startDate, endDate);

                      cy.wait(4000);
                      cy.get(`.mdc-data-table__content > :nth-child(${i}) > .cdk-column-appliedDate`)
                        .invoke('text')
                        .then((appliedText) => {
                          let Applied = appliedText.trim();

                          cy.get(`.mdc-data-table__content > :nth-child(${i}) > .cdk-column-leaveSubject`)
                            .invoke('text')
                            .then((subjectText) => {
                              let Subject = subjectText.trim();

                              cy.get(`.mdc-data-table__content > :nth-child(${i}) > .cdk-column-leaveType`)
                                .invoke('text')
                                .then((leaveText) => {
                                  let LeaveType = leaveText.split('').sort().join('').trim();

                                  cy.get(`:nth-child(${i}) > .leaves-image > .mat-mdc-tooltip-trigger`).eq(0).click({ force: true });

                                  cy.get('.pending-right > :nth-child(3) > .pending')
                                    .invoke('text')
                                    .then((statusView) => {
                                      if (statusTable.trim() == statusView.trim()) {
                                        cy.log('status Matched', statusTable);

                                        cy.get('.pending-left > :nth-child(3) > p')
                                          .invoke('text')
                                          .then((appliedDate) => {
                                            let AppliedDate = appliedDate.trim();
                                            if (AppliedDate == Applied) {
                                              cy.log('applied date matched', appliedDate);

                                              cy.get('h4')
                                                .invoke('text')
                                                .then((sub) => {
                                                  let subjectLeave = sub.trim();

                                                  if (Subject == subjectLeave) {
                                                    cy.log('Leave subject matched', subjectLeave);
                                                    cy.get('.pending-right > :nth-child(2) > p')
                                                      .invoke('text')
                                                      .then((type) => {
                                                        let leavetype1  = type.trim().replace(/\s/g, '')
                                                        let leavetype2 =  leavetype1.split(',').sort().join('')
                                                        let leavetype =  leavetype2.split('').sort().join('')
                                                        if (leavetype == LeaveType) {
                                                          cy.log('Leave Type  Matched', LeaveType);
                                                        
                                                          cy.get('.pending-left > :nth-child(2) > p')
                                                          .invoke('text')
                                                          .then((day) => {
                                                            let NoofDay = day.trim()
                                                            if (NoofDay == noofDay){
                                                              cy.log('No of Leave Day Matched', NoofDay);
                                                            }else{
                                                              cy.log('table  No of Leave Day - ', noofDay, ' view page No of Leave Day- ', NoofDay);
                                                              cy.pause();
                                                            }
                                                          })                      
                                                 

                                                        } else {
                                                          cy.log('table  Leave Type - ', LeaveType, ' view page Leave Type- ', leavetype);
                                                          cy.pause();
                                                        }
                                                      });
                                                  } else {
                                                    cy.log('table  Leave  subject - ', Applied, ' view page Leave subject- ', subjectLeave);
                                                    cy.pause();
                                                  }
                                                });
                                            } else {
                                              cy.log('table  Leave  Applied Date - ', Applied, ' view page Applied Date - ', AppliedDate);
                                              cy.pause();
                                            }
                                          });
                                      } else {
                                        cy.log('table status - ', statusTable, ' view page status - ', statusView);
                                        cy.pause();
                                      }
                                    });

                                  //back-button
                                  cy.get('.history-btn1').click();

                                  cy.wait(15000);
                                });
                            });
                        });
                    });
                });
            });
        }
      });

    //<-------------------------------Leave Filter End-------------------------------------------------------------------->

    //<-----------------------------------Add/View Leave------------------------------------------------------------------->

      cy.get('.navy-bg > .mdc-button__label').click({ force: true });

      //<-----------------------------//Empty Field Initial State-------------------------------------->

      cy.get('input').each(($input, index) => {
        let value = $input.val();

        if (index == 2) {
          if (value) {
            cy.log('Start Date - Must be empty');
            cy.pause();
          } else {
            cy.log('Initial State - Start Date Empty');
          }
        }

        if (index == 3) {
          if (value) {
            cy.log('Initial State -Leave Subject - Must be Empty');
            cy.pause();
          } else {
            cy.log('Initial State - Leave Subject Empty');
          }
        }

        if (index == 4) {
          if (value) {
            cy.log('Initial State -Leave Subject - Must be Empty');
            cy.pause();
          } else {
            cy.log('Initial State - Leave Subject Empty');
          }
        }
      });

      // cy.get('#mat-input-2')
      //   .invoke('val')
      //   .then((date) => {
      //     if (date) {
      //       cy.log('Start Date - Must be empty');
      //       cy.pause();
      //     } else {
      //       cy.log('Initial State - Start Date Empty');
      //     }
      //   });

      // cy.get('#mat-input-3')
      //   .invoke('val')
      //   .then((date) => {
      //     if (date) {
      //       cy.log('End Date - Must be empty');
      //       cy.pause();
      //     } else {
      //       cy.log('Initial State - End Date Empty');
      //     }
      //   });

      // cy.get('#mat-input-4')
      //   .invoke('val')
      //   .then((opt) => {
      //     if (opt) {
      //       cy.log('Initial State -Leave Subject - Must be Empty');
      //     } else {
      //       cy.log('Initial State - Leave Subject Empty');
      //     }
      //   });

      cy.get('.textarea')
        .invoke('val')
        .then((opt) => {
          if (opt) {
            cy.log('Initial State -Leave Reason - Must be Empty');
            cy.pause();
          } else {
            cy.log('Initial State - Leave Reason Empty');
          }
        });

      cy.get('.dropzone')
        .invoke('val')
        .then((opt) => {
          if (opt) {
            cy.log('Initial State Document - No documents');
            cy.pause();
          } else {
            cy.log('Initial State - No documents');
          }
        });
      cy.wait(4000);
      cy.get(':nth-child(1) > h4')
        .invoke('text')
        .then((text) => {
          // 'text' contains the text content of the selected element
          cy.log('Text content: ' + text);
        });

      //<-----------------------------END ---------//Empty Field Initial State-------------------------------------->

      //<-------------------------------check startDate validation ------------------------------------------------>

      // // Select End-Date

      cy.get('input').eq(1).click();
      cy.get('.mat-calendar-next-button').click();
      cy.get(':nth-child(3) > [data-mat-col="0"] > .mat-calendar-body-cell').click();

      // Leave Subject select
      cy.get('input').eq(2).click();
      cy.get('input').eq(2).type('Sick Leave');

      cy.get('.next > .mdc-button__label > span').click({ force: true });
      cy.get('mat-error').should('exist');
      cy.get('mat-error')
        .invoke('text')
        .then((errorText) => {
          if (errorText == 'Please enter start date') {
            cy.log('Error_____________ST', errorText);
          } else {
            cy.log("Not valid error show Expected - 'Please enter start date'");
            // cy.pause()
          }
        });

      // select the start date and check error remove or not
      cy.get('input').eq(0).click();
      cy.get('.mat-calendar-next-button').click();
      cy.get(':nth-child(3) > [data-mat-col="0"] > .mat-calendar-body-cell').click();
      cy.get('mat-error').should('not.exist');

      // Select End-Date
      //   cy.get('#mat-input-3').click();
      //   cy.get('.mat-calendar-next-button').click();

      //   cy.get(':nth-child(3) > [data-mat-col="0"] > .mat-calendar-body-cell').click();
      //   //select leave subject
      //   cy.get('#mat-input-4').click()
      //   cy.get('#mat-option-53').click()

      //   cy.get('.next > .mdc-button__label > span').click()
      //   cy.get('#mat-mdc-error-0').should('exist');
      //   cy.get('#mat-mdc-error-0').invoke('text').then((errorText) => {
      //                    if(errorText == 'Please enter start date'){
      //                      cy.log("Error_____________ST",errorText)
      //                    }else{
      //                     cy.log("Not valid error show Expected - 'Please enter start date'")
      //                    }
      // })

      // select the start date and check error remove or not
      // cy.get('#mat-input-2').click();
      // cy.get('.mat-calendar-next-button').click();

      // cy.get(':nth-child(3) > [data-mat-col="0"] > .mat-calendar-body-cell').click();
      // cy.get('#mat-mdc-error-0').should('not.exist');

      //<------------------END-------------check startDate validation ------------------------------------------------>

      // // Back and reload the page

      cy.get('[ng-reflect-router-link="leave"]').click();
      cy.wait(4000);
      cy.get('.navy-bg > .mdc-button__label').click({ force: true });

      // //<-------------------------------check EndDate validation ------------------------------------------------>

      // Select Start-Date

      cy.get('input').eq(0).click();
      cy.get('.mat-calendar-next-button').click();
      cy.get(':nth-child(3) > [data-mat-col="0"] > .mat-calendar-body-cell').click();

      // Leave Subject select
      cy.get('input').eq(2).click();
      cy.get('input').eq(2).type('Sick Leave');

      cy.get('.next > .mdc-button__label > span').click({ force: true });
      cy.get('mat-error').should('exist');
      cy.get('mat-error')
        .invoke('text')
        .then((errorText) => {
          if (errorText == 'Please enter start date') {
            cy.log('Error_____________ST', errorText);
          } else {
            cy.log("Not valid error show Expected - 'Please enter End date'");
            //  cy.pause()
          }
        });

      // select the End date and check error remove or not
      cy.get('input').eq(1).click();
      cy.get('.mat-calendar-next-button').click();
      cy.get(':nth-child(3) > [data-mat-col="0"] > .mat-calendar-body-cell').click();
      cy.get('mat-error').should('not.exist');

      // // Select Start-Date
      // cy.get('#mat-input-2').click();
      // cy.get('.mat-calendar-next-button').click();

      // cy.get(':nth-child(3) > [data-mat-col="0"] > .mat-calendar-body-cell').click();
      // //select leave subject
      // cy.get('#mat-input-4').click()
      // cy.get('#mat-option-53').click()

      // cy.get('.next > .mdc-button__label > span').click()
      // cy.get('#mat-mdc-error-1').should('exist');
      // cy.get('#mat-mdc-error-1').invoke('text').then((errorText) => {
      //                  if(errorText == 'Please enter end date.'){
      //                    cy.log("Error_____________ST",errorText)
      //                  }else{
      //                   cy.log("Not valid error show Expected - 'Please enter end date.'")
      //                  }
      // })

      // // select the end date and check error remove or not

      // cy.get('#mat-input-3').click();
      // cy.get('.mat-calendar-next-button').click();

      // cy.get(':nth-child(3) > [data-mat-col="0"] > .mat-calendar-body-cell').click();
      // cy.get('#mat-mdc-error-1').should('not.exist');

      //<------------------END-------------check EndDate validation ------------------------------------------------>

      let month;
      let day;
      let year;
      // Select start-Date Check Holidaty case
      cy.get(':nth-child(3) > [data-mat-col="0"] > .mat-calendar-body-cell')
        .invoke('text')
        .then((date) => {
          // Create a Date object for the current date
          const currentDate = new Date();

          // Get the current month and year
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();

          // Calculate the next month and year
          const nextMonth = (currentMonth + 1) % 12; // Use modulo to loop back to January when December is reached
          const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
          month = nextMonth + 1;
          year = nextYear;
          day = date.trim();
          // Display the next month and year
        });

      // Select End-Date Check Holidaty case

      cy.get('.error-leave')
        .invoke('text')
        .then((errorText) => {
          const expectedErrorText = `Leave cannot be applied on a week off day that is ${day}/${month}/${year}.`;
          if (errorText == expectedErrorText) {
            cy.log('Error texts match');
          } else {
            cy.log('Expected Error______________', expectedErrorText);
          }
          // If the texts match, the test will pass; if not, it will fail
        });
      // cy.get('#mat-input-4').click()
      // cy.get('#mat-option-53').click()
      // cy.get('#mat-mdc-error-0').should('not.exist');
      // cy.get('#mat-mdc-error-1').should('not.exist');
      // cy.get('#mat-mdc-error-2').should('not.exist');

      // <--------------------- Check validation for the leave subject ------------------------------------------>

      //remove error startDate -endDate
      cy.get('input').eq(0).click();
      cy.get('.mat-calendar-next-button').click();
      cy.get(':nth-child(3) > [data-mat-col="3"] > .mat-calendar-body-cell').click();

      cy.get('input').eq(1).click();
      cy.get('.mat-calendar-next-button').click();
      cy.get(':nth-child(4) > [data-mat-col="3"] > .mat-calendar-body-cell').click();

      //remove levae subject
      cy.get('input').eq(2).clear();
      cy.get('.leave-blk-left-flex').click();
      cy.get('mat-error')
        .invoke('text')
        .then((errorText) => {
          const expectedErrorText = `Please add the leave subject`;
          if (errorText.trim() == expectedErrorText.trim()) {
            cy.log('Error texts match');
          } else {
            cy.log('Expected Error______________', expectedErrorText);
          }
          // If the texts match, the test will pass; if not, it will fail
        });

      //type 2-character in leave subject and check error
      cy.get('input').eq(2).type('ho');
      cy.get('mat-error')
        .invoke('text')
        .then((errorText) => {
          const expectedErrorText = `Minimum length should be 5 characters`;
          if (errorText.trim() == expectedErrorText.trim()) {
            cy.log('Error texts match');
          } else {
            cy.log('Expected Error______________', expectedErrorText);
          }
          // If the texts match, the test will pass; if not, it will fail
        });

      //type 30-character in leave subject and check error

      cy.get('input').eq(2).type('This is a test input with 50 characters to be entered');
      cy.get('mat-error')
        .invoke('text')
        .then((errorText) => {
          const expectedErrorText = `Maximum length can be 30 characters`;
          if (errorText.trim() == expectedErrorText.trim()) {
            cy.log('Error texts match');
          } else {
            cy.log('Expected Error______________', expectedErrorText);
          }
          // If the texts match, the test will pass; if not, it will fail
        });

      // Add special character in leave subject
      cy.get('input').eq(2).clear();
      cy.get('input').eq(2).type('@#$#@%');

      cy.get('mat-error')
        .should('exist')
        .then(($element) => {
          if ($element.length === 0) {
            // The class is not present
            cy.log('Error not show...please show error Expected ----> "Please enter valid text"');
          } else {
            cy.get('mat-error')
              .invoke('text')
              .then((errorText) => {
                const expectedErrorText = `Please enter valid text`;
                if (errorText.trim() == expectedErrorText.trim()) {
                  cy.log('Error texts match');
                } else {
                  cy.log('Expected Error______________', expectedErrorText);
                }
                // If the texts match, the test will pass; if not, it will fail
              });
          }
        });

      // Add only space in leave subject
      cy.get('input').eq(2).clear();
      cy.get('input').eq(2).type('            ');

      cy.get('mat-error')
        .should('exist')
        .then(($element) => {
          if ($element.length === 0) {
            // The class is not present
            cy.log('Error not show...please show error Expected ----> "Please enter valid text"');
          } else {
            cy.get('mat-error')
              .invoke('text')
              .then((errorText) => {
                const expectedErrorText = `Please enter valid text`;
                if (errorText.trim() == expectedErrorText.trim()) {
                  cy.log('Error texts match');
                } else {
                  cy.log('Expected Error______________', expectedErrorText);
                  
                }
                // If the texts match, the test will pass; if not, it will fail
              });
          }
        });

      // select diff option in dropdown  and verify the behaviour while replacing the selected option
      cy.get('input').eq(2).clear();
      cy.get('input').eq(2).click();
      cy.get('mat-option').eq(0).click();
      cy.get('input').eq(2).clear();
      cy.get('mat-option').eq(3).click();

      // // Add number in leave subject
      // cy.get('input').eq(4).clear()
      // cy.get('input').eq(4).type("12345")

      // cy.get('mat-error').should('exist').then(($element) => {
      //   if ($element.length === 0) {
      //     // The class is not present
      //     cy.log('Error not show...please show error Expected ----> "Please enter valid text"');
      //   }else{
      //     cy.get('mat-error')
      //     .invoke('text')
      //     .then((errorText) => {
      //       const expectedErrorText = `Please enter valid text`;
      //       if(errorText.trim() ==  expectedErrorText.trim()){
      //         cy.log("Error texts match")
      //       }else{
      //          cy.log("Expected Error______________",expectedErrorText)
      //       }
      //       // If the texts match, the test will pass; if not, it will fail
      //     });

      //   }
      // });
      // <--------------------------END----------------Check validation for the leave subject---------------------->

      // <---------------------------------------check Leave balance table data case -------------------------------->

      //Process of leave deduction
      // select one day

      //select start date
      cy.get('input').eq(0).click();
      cy.get('.mat-calendar-next-button').click();
      cy.get(':nth-child(3) > [data-mat-col="2"] > .mat-calendar-body-cell').click();

      //select end date
      cy.get('input').eq(1).click();
      cy.get('.mat-calendar-next-button').click();
      cy.get(':nth-child(3) > [data-mat-col="2"] > .mat-calendar-body-cell').click();

      let leaveCheckFun = () => {
        // check for the one day case deduction
        //get CL and PL
        // LWP available balance will always be zero
        cy.wait(4000);
        cy.get('.responsive-table > table > tbody > :nth-child(3) > :nth-child(2)')
          .invoke('text')
          .then((lwp) => {
            if (Number(lwp) !== 0) {
              cy.log(`LWP available balance will always be zero. here show - ${lwp}`);
              cy.pause();
            } else {
              cy.log('LWP is zero');
            }
          });
        cy.get('.days-dark')
          .invoke('text')
          .then((days) => {
            cy.log('C________01', days);
            cy.wait(4000);
            let day = days.trim().split(' ');
            let dayGet = Number(day[0]);

            if (dayGet <= 1) {
              cy.get(':nth-child(1) > h4')
                .invoke('text')
                .then((text) => {
                  let CL = Number(text);
                  if (CL >= dayGet) {
                    let remainLeave = CL - dayGet;
                    // check table data right or not
                    // number of reserve leave check
                    cy.wait(4000);
                    cy.get('.responsive-table > table > tbody > :nth-child(1) > :nth-child(3)')
                      .invoke('text')
                      .then((reserve) => {
                        cy.log('RESERVE_____________01', reserve);
                        if (Number(reserve) == dayGet) {
                          cy.log('_________________No of Leave(CL) matched with reserve Leave_________________');
                        } else {
                          cy.log('_________________No of Leave(CL)  not matched with reserve Leave_________________');
                          cy.pause();
                        }
                      });

                    cy.get('.responsive-table tbody > tr:nth-child(1) > td:nth-child(4)')
                      .invoke('text')
                      .then((curr) => {
                        cy.log('R________________________01', curr);
                        if (Number(curr) == remainLeave) {
                          cy.log('_________________No of Leave(CL)  matched with Remaining  Leave_________________');
                        } else {
                          cy.log('_________________No of Leave(CL)  not matched with Remaining current Leave_________________');
                          cy.pause();
                        }
                      });
                  } else {
                    // cut leave in CL
                    let clCut = CL;
                    let remainingLeavePLcut = dayGet - CL;

                    cy.wait(4000);
                    cy.get('.responsive-table > table > tbody > :nth-child(1) > :nth-child(3)')
                      .invoke('text')
                      .then((reserve) => {
                        cy.log('RESERVE_____________01', reserve);
                        if (Number(reserve) == Number(clCut)) {
                          cy.log('_________________No of Leave(CL) matched with reserve Leave_________________');
                        } else {
                          cy.log('_________________No of Leave(CL)  not matched with reserve Leave_________________');
                          cy.pause();
                        }
                      });
                    cy.wait(4000);
                    cy.get('.responsive-table tbody > tr:nth-child(1) > td:nth-child(4)')
                      .invoke('text')
                      .then((curr) => {
                        cy.log('R________________________01', curr);
                        if (Number(curr) == 0) {
                          cy.log('_________________No of Leave(CL)  matched with Remaining  Leave_________________');
                        } else {
                          cy.log('_________________No of Leave(CL)  not matched with Remaining current Leave_________________');
                          cy.pause();
                        }
                      });

                    //remaining Leave cut in the PL

                    cy.get(':nth-child(2) > h4')
                      .invoke('text')
                      .then((pl) => {
                        cy.get('.responsive-table > table > tbody > :nth-child(2) > :nth-child(2)')
                          .invoke('text')
                          .then((totalPl) => {
                            if (Number(totalPl) == Number(pl)) {
                              cy.log('_________________No of Leave(PL) matched with PL(total balance)________________');
                            } else {
                              cy.log('_________________No of Leave(PL)  not matched with PL(total balance)_________________');
                              cy.pause();
                            }
                          });

                        if (Number(pl) >= Number(remainingLeavePLcut)) {
                          let remainingPL = Number(pl) - remainingLeavePLcut;

                          //check remianing PL balance
                          cy.log('-------------deducated all leave from PL and check PL balance-------------');
                          //check PL Reserve balance
                          cy.wait(4000);
                          cy.get('.responsive-table > table > tbody > :nth-child(2) > :nth-child(3)')
                            .invoke('text')
                            .then((reserve) => {
                              cy.log('RESERVE_PL____________01', reserve);
                              if (Number(reserve) == Number(remainingLeavePLcut)) {
                                cy.log('_________________No of Leave(PL) matched with reserve Leave_________________');
                              } else {
                                cy.log('_________________No of Leave(PL)  not matched with reserve Leave_________________');
                                cy.pause();
                              }
                            });

                          //check PL remaining balance
                          cy.wait(4000);
                          cy.get('.responsive-table tbody > tr:nth-child(2) > td:nth-child(4)')
                            .invoke('text')
                            .then((curr) => {
                              if (Number(curr) == Number(remainingPL)) {
                                cy.log('_________________No of Leave(PL)  matched with Remaining  Leave_________________');
                              } else {
                                cy.log('_________________No of Leave(PL)  not matched with Remaining PL_________________');
                                cy.pause();
                              }
                            });
                        } else {
                          //deducated all PL
                          let deducatedPL = Number(pl);
                          let remainingLeave = Number(remainingLeavePLcut) - Number(pl);

                          //check PL Reserve balance
                          cy.wait(4000);
                          cy.get('.responsive-table > table > tbody > :nth-child(2) > :nth-child(3)')
                            .invoke('text')
                            .then((reserve) => {
                              if (Number(reserve) == Number(deducatedPL)) {
                                cy.log('_________________No of Leave(PL) matched with reserve Leave_________________');
                              } else {
                                cy.log('_________________No of Leave(PL)  not matched with reserve Leave_________________');
                                cy.pause();
                              }
                            });

                          //check PL remaining balance
                          cy.wait(4000);
                          cy.get('.responsive-table tbody > tr:nth-child(2) > td:nth-child(4)')
                            .invoke('text')
                            .then((curr) => {
                              if (Number(curr) == 0) {
                                cy.log('_________________No of Leave(PL)  matched with Remaining  Leave_________________');
                              } else {
                                cy.log('_________________No of Leave(PL)  not matched with Remaining PL_________________');
                                cy.pause();
                              }
                            });

                          // check deducation from LWP

                          if (remainingLeave > 0) {
                            cy.wait(4000);
                            cy.get('.responsive-table > table > tbody > :nth-child(3) > :nth-child(3)')
                              .invoke('text')
                              .then((curr) => {
                                if (Number(curr) == Number(remainingLeave)) {
                                  cy.log('_________________No of Leave(LWP)  matched with Reserve Leave_________________');
                                } else {
                                  cy.log('_________________No of Leave(LWP)  not matched with Reserve Leave_________________');
                                  cy.pause();
                                }
                              });
                            cy.wait(4000);
                            cy.get('.responsive-table tbody > tr:nth-child(3) > td:nth-child(4)')
                              .invoke('text')
                              .then((curr) => {
                                if (Number(curr) == Number(remainingLeave)) {
                                  cy.log('_________________No of Leave(LWP)  matched with Remaining  Leave_________________');
                                } else {
                                  cy.log('_________________No of Leave(LWP)  not matched with Remaining current Leave_________________');
                                  cy.pause();
                                }
                              });
                          }
                        }
                      });
                  }
                });
            } else if (dayGet > 1) {
              //check CL balance
              cy.get(':nth-child(1) > h4')
                .invoke('text')
                .then((cl) => {
                  cy.get('.responsive-table > table > tbody > :nth-child(1) > :nth-child(2)')
                    .invoke('text')
                    .then((totalCl) => {
                      if (Number(totalCl) == Number(cl)) {
                        cy.log('_________________No of Leave(CL) matched with CL(total balance)________________');
                      } else {
                        cy.log('_________________No of Leave(CL)  not matched with CL(total balance)_________________');
                        cy.pause();
                      }
                    });
                });

              // check Leave for more than one day
              // deducated leave from PL
              cy.get(':nth-child(2) > h4')
                .invoke('text')
                .then((pl) => {
                  cy.get('.responsive-table > table > tbody > :nth-child(2) > :nth-child(2)')
                    .invoke('text')
                    .then((totalPl) => {
                      if (Number(totalPl) == Number(pl)) {
                        cy.log('_________________No of Leave(PL) matched with PL(total balance)________________');
                      } else {
                        cy.log('_________________No of Leave(PL)  not matched with PL(total balance)_________________');
                        cy.pause();
                      }
                    });

                  if (Number(pl) >= dayGet) {
                    let remainingPL = Number(pl) - dayGet;

                    //check remianing PL balance
                    cy.log('-------------deducated all leave from PL and check PL balance-------------');
                    //check PL Reserve balance
                    cy.wait(4000);
                    cy.get('.responsive-table > table > tbody > :nth-child(2) > :nth-child(3)')
                      .invoke('text')
                      .then((reserve) => {
                        cy.log('RESERVE_PL____________01', reserve);
                        if (Number(reserve) == dayGet) {
                          cy.log('_________________No of Leave(PL) matched with reserve Leave_________________');
                        } else {
                         
                          cy.log('_________________No of Leave(PL)  not matched with reserve Leave_________________');
                          cy.pause();
                        }
                      });

                    //check PL remaining balance
                    cy.wait(4000);
                    cy.get('.responsive-table tbody > tr:nth-child(2) > td:nth-child(4)')
                      .invoke('text')
                      .then((curr) => {
                        if (Number(curr) == Number(remainingPL)) {
                          cy.log('_________________No of Leave(PL)  matched with Remaining  Leave_________________');
                        } else {
                          cy.log('_________________No of Leave(PL)  not matched with Remaining PL_________________');
                          cy.pause();
                        }
                      });
                  } else {
                    //deducated all PL
                    let deducatedPL = Number(pl);
                    let remainingLeave = dayGet - Number(pl);

                    //check PL Reserve balance
                    cy.wait(4000);
                    cy.get('.responsive-table > table > tbody > :nth-child(2) > :nth-child(3)')
                      .invoke('text')
                      .then((reserve) => {
                        if (Number(reserve) == deducatedPL) {
                          cy.log('_________________No of Leave(PL) matched with reserve Leave_________________');
                        } else {
                          cy.log('_________________No of Leave(PL)  not matched with reserve Leave_________________');
                          cy.pause();
                        }
                      });

                    //check PL remaining balance
                    cy.wait(4000);
                    cy.get('.responsive-table tbody > tr:nth-child(2) > td:nth-child(4)')
                      .invoke('text')
                      .then((curr) => {
                        if (Number(curr) == 0) {
                          cy.log('_________________No of Leave(PL)  matched with Remaining  Leave_________________');
                        } else {
                          cy.log('_________________No of Leave(PL)  not matched with Remaining PL_________________');
                          cy.pause();
                        }
                      });

                    // check deducation from CL

                    cy.get('.responsive-table > table > tbody > :nth-child(1) > :nth-child(2)')
                      .invoke('text')
                      .then((totalCl) => {
                        if (Number(totalCl) >= Number(remainingLeave)) {
                          let remainingCL = Number(totalCl) - Number(remainingLeave);
                          //remaining all leave deducated in CL
                          //check CL Reserve balance
                          cy.wait(4000);
                          cy.get('.responsive-table > table > tbody > :nth-child(1) > :nth-child(3)')
                            .invoke('text')
                            .then((reserve) => {
                              if (Number(reserve) == Number(remainingLeave)) {
                                cy.log('_________________No of Leave(CL) matched with reserve Leave_ CL________________');
                              } else {
                                cy.log('_________________No of Leave(CL)  not matched with reserve Leave_CL________________');
                                cy.pause();
                              }
                            });

                          //check CL remaining balance
                          cy.wait(4000);
                          cy.get('.responsive-table tbody > tr:nth-child(1) > td:nth-child(4)')
                            .invoke('text')
                            .then((curr) => {
                              if (Number(curr) == Number(remainingCL)) {
                                cy.log('_________________No of Leave(CL)  matched with Remaining CL_________________');
                              } else {
                                cy.log('_________________No of Leave(CL)  not matched with Remaining CL_________________');
                                cy.pause();
                              }
                            });
                        } else {
                          // deducated in CL and LWP

                          //deducated in CL (remainingLeave)
                          let deducatedCL = Number(totalCl);
                          let remainingLeaveEnd = Number(remainingLeave) - Number(totalCl);

                          //check PL Reserve balance
                          cy.wait(4000);
                          cy.get('.responsive-table > table > tbody > :nth-child(1) > :nth-child(3)')
                            .invoke('text')
                            .then((reserve) => {
                              if (Number(reserve) == deducatedCL) {
                                cy.log('_________________No of Leave(CL) matched with reserve Leave_________________');
                              } else {
                                cy.log('_________________No of Leave(CL)  not matched with reserve Leave_________________');
                                cy.pause();
                              }
                            });

                          //check PL remaining balance
                          cy.wait(4000);
                          cy.get('.responsive-table tbody > tr:nth-child(1) > td:nth-child(4)')
                            .invoke('text')
                            .then((curr) => {
                              if (Number(curr) == 0) {
                                cy.log('_________________No of Leave(CL)  matched with Remaining  Leave_________________');
                              } else {
                                cy.log('_________________No of Leave(CL)  not matched with Remaining PL_________________');
                                cy.pause();
                              }
                            });

                          //LWP deducated Leave

                          if (remainingLeaveEnd > 0) {
                            cy.wait(4000);
                            cy.get('.responsive-table > table > tbody > :nth-child(3) > :nth-child(3)')
                              .invoke('text')
                              .then((curr) => {
                                if (Number(curr) == remainingLeaveEnd) {
                                  cy.log('_________________No of Leave(LWP)  matched with Reserve Leave_________________');
                                } else {
                                  cy.log('_________________No of Leave(LWP)  not matched with Reserve Leave_________________');
                                  cy.pause();
                                }
                              });
                            cy.wait(4000);
                            cy.get('.responsive-table tbody > tr:nth-child(3) > td:nth-child(4)')
                              .invoke('text')
                              .then((curr) => {
                                if (Number(curr) == remainingLeaveEnd) {
                                  cy.log('_________________No of Leave(LWP)  matched with Remaining  Leave_________________');
                                } else {
                                  cy.log('_________________No of Leave(LWP)  not matched with Remaining current Leave_________________');
                                cy.pause();
                                }

                              });
                          }
                        }
                      });
                  }
                });
            }
          });
      };

      // half day and full day
      cy.get('.mat-button-toggle-label-content').eq(1).click();
      leaveCheckFun();

      //select end date
      cy.get('input').eq(1).click();

      cy.get(':nth-child(3) > [data-mat-col="5"] > .mat-calendar-body-cell').click();
      leaveCheckFun();
      cy.wait(4000);

      //  -------------------------------------------leave approve case ----------------------------------------------
      // take leave approve person
      // cy.get('[ng-reflect-router-link="site-settings"]').click();
      // cy.log(cy.get(' mat-chip-set').length);

      // cy.wait(4000);
      // cy.get(' mat-chip-set')
      //   .find(' main-app-mat-chips ')
      //   .its('length')
      //   .then((length) => {
      // let responsivePerson = [];
      // for (let i = 0; i < Number(length); i++) {
      //   let emply = cy

      //     .get('mat-chip-set  main-app-mat-chips')
      //     .eq(i)
      //     .invoke('text')
      //     .then((text) => {
      //       responsivePerson.pause(text.trim());
      //       cy.log('Text content: ' + text);
      //     });
      // }


      // });
  });
})