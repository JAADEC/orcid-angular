import { Component, OnInit, forwardRef } from '@angular/core'
import {
  FormGroup,
  ControlValueAccessor,
  Validator,
  FormControl,
  AbstractControl,
  ValidationErrors,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validators,
  AsyncValidatorFn,
  ValidatorFn,
  FormGroupDirective,
  NgForm,
  NG_ASYNC_VALIDATORS,
} from '@angular/forms'
import { BaseForm } from '../BaseForm'
import {
  TLD_REGEXP,
  ILLEGAL_NAME_CHARACTERS_REGEXP,
  URL_REGEXP,
} from 'src/app/constants'
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
export class FormPersonalComponent extends BaseForm implements OnInit {
  constructor(private _register: RegisterService) {
    super()
  }

  emails: FormGroup = new FormGroup({})
  additionalEmails: FormGroup = new FormGroup({})

  ngOnInit() {
    this.emails = new FormGroup(
      {
        email: new FormControl('', {
          validators: [
            Validators.required,
            Validators.email,
            Validators.pattern(TLD_REGEXP),
          ],
          asyncValidators: this._register.backendValueValidate('email'),
        }),
        confirmEmail: new FormControl('', {
          validators: [
            Validators.required,
            Validators.email,
            Validators.pattern(TLD_REGEXP),
          ],
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
        if (additionalEmail.value === registerForm.email.value) {
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
    this.form.valueChanges.subscribe(value => {
      const emailsForm = this._register.formGroupToEmailRegisterForm(<
        FormGroup
      >this.form.controls['emails'])
      const namesForm =
        this._register.formGroupToNamesRegisterForm(this.form) || {}

      fn({ ...emailsForm, ...namesForm })
    })
  }
}
