import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'
import { ErrorHandlerService } from '../error-handler/error-handler.service'
import { environment } from '../../../environments/environment'
import { catchError, retry } from 'rxjs/operators'
import { SignIn } from '../../types/sign-in.endpoint'
import { Reactivation } from '../../types/reactivation.endpoint'
import { CustomEncoder } from '../custom-encoder/custom.encoder'
import { getOrcidNumber } from '../../constants'

@Injectable({
  providedIn: 'root',
})
export class SignInService {
  private headers: HttpHeaders;

  constructor(
    private _http: HttpClient,
    private _errorHandler: ErrorHandlerService
  ) {
    this.headers = new HttpHeaders().set(
      'Content-Type',
      'application/x-www-form-urlencoded;charset=utf-8'
    )
  }

  signIn(data, type) {
    let loginUrl = 'signin/auth.json'

    if (type && type === 'institutional') {
      loginUrl = 'shibboleth/signin/auth.json'
    }

    let body = new HttpParams({ encoder: new CustomEncoder() })
      .set('userId', getOrcidNumber(data.username))
      .set('password', data.password)
    if (data.verificationCode) {
      body = body.set('verificationCode', data.verificationCode)
    }
    if (data.recoveryCode) {
      body = body.set('recoveryCode', data.recoveryCode)
    }
    body = body.set('oauthRequest', 'false')
    return this._http
      .post<SignIn>(environment.API_WEB + loginUrl,
        body,
        {
          headers: this.headers,
          withCredentials: true,
        })
      .pipe(
        retry(3),
        catchError((error) => this._errorHandler.handleError(error))
      )
  }

  reactivation(data) {
    let body = new HttpParams({ encoder: new CustomEncoder() })
    body = body.set('email', data.email)
    return this._http
      .post<Reactivation>(environment.API_WEB + `sendReactivation.json`, body, {
        headers: this.headers,
        withCredentials: true,
      })
      .pipe(
        retry(3),
        catchError((error) => this._errorHandler.handleError(error))
      )
  }
}
