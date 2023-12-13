import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable, map, startWith } from 'rxjs';

@Component({
  selector: 'tms-workspace-eta-popup',
  templateUrl: './eta-popup.component.html',
  styleUrls: ['./eta-popup.component.scss'],
})
export class ETAPopupComponent implements OnInit {
  //#region properties
  filteredETAOptions!: Observable<string[]>;
  estimatedTime = new FormControl();
  @Output() ETAEmmiter: EventEmitter<any> = new EventEmitter();
  @Input() ETAInput: any;
  allowedKeyCodes: number[] = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 104, 109, 32, 13, 46];
  ETAToPass!: string;
  //#endregion

  constructor() { }

  ngOnInit(): void {
    if (this.ETAInput) {
      this.estimatedTime.setValue(this.ETAInput);
    }
    this.filteredETAOptions = this.estimatedTime.valueChanges.pipe(
      startWith(''),
      map((value) => this.findSuggestionForETA(value))
    );
    this.filteredETAOptions.subscribe((response: any) => {
      this.ETAToPass = response;
    });
    this.estimatedTime.setValidators(Validators.required);
    this.estimatedTime.updateValueAndValidity();
  }

  // ETA suggestions based on the user input
  findSuggestionForETA(value: string) {
    if (value) {
      let splitETAArray = value.split(' ');
      splitETAArray = splitETAArray.filter((time) => time != '');
      // check if only length = 1;
      if (splitETAArray && splitETAArray.length > 0) {
        let option: any = '';
        if (splitETAArray[0] && splitETAArray[0].includes('h')) {
          option = splitETAArray[0].split('h')[0] + ' Hours';
        } else {
          if (splitETAArray[1] && splitETAArray[1].includes('m')) {
            option = splitETAArray[0] + ' Minutes';
          } else {
            option = splitETAArray[0] + ' Hours';
          }
        }
        if (splitETAArray[1] && splitETAArray[1].includes('m')) {
          if (!option.includes('Minutes') && !option.includes(splitETAArray[0])) {
            option = option + ' ' + splitETAArray[1].split('m')[0] + ' Minutes';
          }
        } else {
          // if only numbers are there, set hours to default
          const _hOrMFindIndex = splitETAArray.findIndex((ETAObject: any) => ETAObject.includes('h') || ETAObject.includes('m'));
          if (_hOrMFindIndex > -1) {
            // find index of element which has 'h';
            const hoursIndex = splitETAArray.findIndex((ETAObject: any) => ETAObject.includes('h') && ETAObject.length > 1);
            if (hoursIndex > -1) {
              option = splitETAArray[hoursIndex].split('h')[0] + ' Hours';
            }
            // set minutes after index of 'h'
            if (hoursIndex > -1 && splitETAArray[hoursIndex + 1]) {
              if (!isNaN(+splitETAArray[hoursIndex + 1])) {
                // find 'm' in array, if not found that means only minutes numbers are there
                const minutesIndex = splitETAArray.findIndex((ETAObject: any) => ETAObject.includes('m'));
                if (minutesIndex > -1) {
                  let minutesString = '';
                  for (let i = hoursIndex + 1; i <= splitETAArray.length - 1; i++) {
                    if (splitETAArray[i] && !isNaN(+splitETAArray[i])) {
                      minutesString = minutesString + '' + splitETAArray[i];
                    }
                  }
                  option = option + ' ' + minutesString + ' Minutes';
                } else {
                  let minutesString = '';
                  for (let i = hoursIndex + 1; i <= splitETAArray.length - 1; i++) {
                    minutesString = minutesString + '' + splitETAArray[i];
                  }
                  if (minutesString) {
                    option = option + ' ' + minutesString + ' Minutes';
                  }
                }
              }
            } else {
              // check if hours already set, that means minutes are combined without space
              if (hoursIndex > -1) {
                if (splitETAArray[hoursIndex].includes('m')) {
                  if (splitETAArray[hoursIndex].split('h')[1].split('m')[0]) {
                    option = option + ' ' + splitETAArray[hoursIndex].split('h')[1].split('m')[0] + ' Minutes';
                  }
                } else {
                  if (splitETAArray[hoursIndex].split('h')[1]) {
                    option = option + ' ' + splitETAArray[hoursIndex].split('h')[1] + ' Minutes';
                  }
                }
              } else {
                // check if option includes hours
                if (option.includes('Hours')) {
                  const _hIndex = splitETAArray.findIndex((ETAObject: any) => ETAObject == 'h');
                  if (_hIndex > -1) {
                    let minutesArray = splitETAArray.slice(_hIndex + 1);
                    if (minutesArray && minutesArray.length > 0) {
                      // check if m exists with combined minutes
                      const _mIndex = minutesArray.findIndex((minutesObject: any) => minutesObject.includes('m') && minutesObject.length > 1);
                      if (_mIndex > -1) {
                        option = option + ' ' + minutesArray[_mIndex].split('m')[0] + ' Minutes';
                      } else {
                        minutesArray = minutesArray.filter((minutesObject: any) => minutesObject !== 'm');
                        option = option + ' ' + minutesArray.join('') + ' Minutes';
                      }
                    }
                  } else {
                    // check if 1 object is there and has 'm' combined;
                    if (splitETAArray[0] && splitETAArray[0].includes('m')) {
                      option = splitETAArray[0].split('m')[0] + ' Minutes';
                    }
                  }
                }
              }
            }
          } else {
            option = splitETAArray.join('') + ' Hours';
          }
        }

        // point(.) code block
        if (splitETAArray[0].includes('.')) {
          //check if input contains m or M
          if (splitETAArray[0].includes('m') || splitETAArray[0].includes('M')) {

            const minutes: any = splitETAArray[0]

            let newMinutes: any = ""
            //remove characters that are not numbers and store them in newMinutes
            for (let i = 0; i < minutes.length; i++) {
              if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(minutes.charAt(i))) {
                newMinutes = newMinutes + minutes.charAt(i);
              } else {
                break;
              }
            }
            let newOption = ''
            let newmin = Number((newMinutes));
            if (newmin > 0) {
              newOption = newOption + Math.round(newmin) + ' Minutes';
            }
            option = newOption
          } else {
            const hours = Number(splitETAArray[0].split('.')[0]);
            // console.log('%c  hours:', 'color: #0e93e0;background: #aaefe5;', hours);
            const minutes: any = splitETAArray[0].split('.')[1]
            let newMinutes: any = "0."
            for (let i = 0; i < minutes.length; i++) {
              if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(minutes.charAt(i))) {
                newMinutes = newMinutes + minutes.charAt(i);
              } else {
                break;
              }
            }
            let newHours = hours;
            let newmin = Number((newMinutes) * 60);
            let newOption = '';
            if (newHours > 0) {
              newOption = newHours + ' Hours '
            }
            if (newmin > 0) {
              newOption = newOption + Math.round(newmin) + ' Minutes';
            }
            option = newOption
          }
        }

        return this.isValidEta(option) ? [option] : [];
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  hasSameCharacters(str: string) {
    const characters = str.split('');
    const uniqueCharacters = new Set(characters);
    return uniqueCharacters.size === 1;
  }

  onSelectETA() {
    this.ETAEmmiter.emit(this.ETAToPass[0] ? this.ETAToPass[0] : this.estimatedTime.value ? this.estimatedTime.value : '');
  }

  omitCharacters(event: any) {
    // console.log("EVENET",event.which)
    // check if 'm' is already entered in input, and user pressed 'm' again, restrict it.
    if ((event.which === 109 || event.which === 77) && (this.estimatedTime.value.includes('m') || this.estimatedTime.value.includes('M'))) {
      event.preventDefault();
    }
    // check if 'h' is already entered in input, and user pressed 'h' again, restrict it.
    else if ((event.which === 104 || event.which === 72) && (this.estimatedTime.value.includes('h') || this.estimatedTime.value.includes('H'))) {
      event.preventDefault();
    }
    // check if 'h' is entered in input, and no time is entered, prevent it.
    else if ((event.which === 104 || event.which === 72) && !this.estimatedTime.value) {
      event.preventDefault();
    }
    // check if 'm' is entered in input, and no time is entered, prevent it.
    else if ((event.which === 109 || event.which === 77) && !this.estimatedTime.value) {
      event.preventDefault();
    }
    // handled invalid inputs for point(.) inputs
    else if ((event.which === 46) ) {
      if (this.estimatedTime.value === "" || this.estimatedTime.value.includes('.') || this.estimatedTime.value === "m" || this.estimatedTime.value === "h" || this.estimatedTime.value.endsWith("m") || this.estimatedTime.value.endsWith("h") || this.estimatedTime.value.endsWith("M") || this.estimatedTime.value.endsWith("H") || this.estimatedTime.value.endsWith(' ') || this.estimatedTime.value.endsWith('.')) {
        event.preventDefault();
      }
    }
    else if (event.which && !this.allowedKeyCodes.includes(event.which)) {
      event.preventDefault();
    }
  }
  isValidEta = (option: string) => {
    if (option) {
      if (option.includes('Hours')) {
        let hrs: any = option.split('Hours')[0].trim();
        hrs = Number.parseInt(hrs);
        if (!Number.isNaN(hrs) && hrs >= 0 && hrs <= 999) {
          if (hrs !== 0) {
            if (option.includes('Minutes')) {
              return this.isValidMinutes(option.split('Hours')[1], 0);
            } else {
              return true;
            }
          } else {
            if (option.includes('Minutes')) {
              return this.isValidMinutes(option.split('Hours')[1], 1);
            } else {
              return false;
            }
          }
        }
      } else {
        if (option.includes('Minutes')) {
          return this.isValidMinutes(option, 1);
        } else {
          return false;
        }
      }
    }
    return false;
  };
  isValidMinutes(text: any, allowedMinimum: number) {
    if (text.includes('Minutes')) {
      let minutes: any = text.split('Minutes')[0].trim();
      minutes = Number.parseInt(minutes);
      if (!Number.isNaN(minutes) && minutes >= allowedMinimum && minutes < 60) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
}
