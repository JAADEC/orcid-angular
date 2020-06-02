import {
  Component,
  OnInit,
  forwardRef,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core'
import {
  FormGroup,
  FormControl,
  NG_VALUE_ACCESSOR,
  Validators,
  ValidatorFn,
  NG_ASYNC_VALIDATORS,
} from '@angular/forms'
import { BaseForm } from '../BaseForm'
import { ILLEGAL_NAME_CHARACTERS_REGEXP, URL_REGEXP } from 'src/app/constants'
import { Observable } from 'rxjs'
import { RegisterService } from 'src/app/core/register/register.service'
import { map } from 'rxjs/operators'
import { OrcidValidators } from 'src/app/validators'

@Component({
  selector: 'app-form-personal',
  templateUrl: './form-personal.component.html',
  styleUrls: ['./form-personal.component.scss'],
  preserveWhitespaces: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormPersonalComponent),
      multi: true,
    },
    {
      provide: NG_ASYNC_VALIDATORS,
      useExisting: forwardRef(() => FormPersonalComponent),
      multi: true,
    },
  ],
})
export class FormPersonalComponent extends BaseForm
  implements OnInit, AfterViewInit {
  @ViewChild('firstInput') firstInput: ElementRef
  constructor(private _register: RegisterService) {
    super()
  }

  emails: FormGroup = new FormGroup({})
  additionalEmails: FormGroup = new FormGroup({
    '0': new FormControl('', {
      validators: [OrcidValidators.email],
    }),
  })

  ngOnInit() {
    this.emails = new FormGroup(
      {
        email: new FormControl('', {
          validators: [Validators.required, OrcidValidators.email],
          asyncValidators: this._register.backendValueValidate('email'),
        }),
        confirmEmail: new FormControl('', {
          validators: [Validators.required, OrcidValidators.email],
        }),
        additionalEmails: this.additionalEmails,
      },
      {
        validators: [
          OrcidValidators.matchValues('email', 'confirmEmail'),
          this.allEmailsAreUnique(),
        ],
        asyncValidators: [this._register.backendAdditionalEmailsValidate()],
        updateOn: 'change',
      }
    )

    this.form = new FormGroup({
      givenNames: new FormControl('', {
        validators: [
          Validators.required,
          OrcidValidators.notPattern(ILLEGAL_NAME_CHARACTERS_REGEXP),
          OrcidValidators.notPattern(URL_REGEXP),
        ],
        asyncValidators: this._register.backendValueValidate('givenNames'),
      }),
      familyNames: new FormControl('', {
        validators: [
          OrcidValidators.notPattern(URL_REGEXP),
          OrcidValidators.notPattern(ILLEGAL_NAME_CHARACTERS_REGEXP),
        ],
      }),
      emails: this.emails,
    })
  }

  ngAfterViewInit(): void {
    // Timeout used to get focus on the first input after the first step loads
    setTimeout(() => {
      this.firstInput.nativeElement.focus()
    }, 100)
  }

  allEmailsAreUnique(): ValidatorFn {
    return (formGroup: FormGroup) => {
      let hasError = false
      const registerForm = this._register.formGroupToEmailRegisterForm(
        formGroup
      )

      const error = { backendErrors: { additionalEmails: {} } }

      Object.keys(registerForm.emailsAdditional).forEach((key, i) => {
        const additionalEmail = registerForm.emailsAdditional[key]
        if (!error.backendErrors.additionalEmails[additionalEmail.value]) {
          error.backendErrors.additionalEmails[additionalEmail.value] = []
        }
        const additionalEmailsErrors = error.backendErrors.additionalEmails
        if (
          registerForm.email &&
          additionalEmail.value === registerForm.email.value
        ) {
          hasError = true
          additionalEmailsErrors[additionalEmail.value] = [
            'additionalEmailCantBePrimaryEmail',
          ]
        } else {
          Object.keys(registerForm.emailsAdditional).forEach(
            (elementKey, i2) => {
              const element = registerForm.emailsAdditional[elementKey]
              if (i !== i2 && additionalEmail.value === element.value) {
                hasError = true
                additionalEmailsErrors[additionalEmail.value] = [
                  'duplicatedAdditionalEmail',
                ]
              }
            }
          )
        }
      })

      if (hasError) {
        return error
      } else {
        return null
      }
    }
  }

  // OVERWRITE
  registerOnChange(fn: any) {
    this.form.valueChanges.subscribe((value) => {
      const emailsForm = this._register.formGroupToEmailRegisterForm(
        <FormGroup>this.form.controls['emails']
      )
      const namesForm =
        this._register.formGroupToNamesRegisterForm(this.form) || {}

      fn({ ...emailsForm, ...namesForm })
    })
  }
}
