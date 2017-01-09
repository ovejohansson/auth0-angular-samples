import { Injectable } from '@angular/core';
import { tokenNotExpired } from 'angular2-jwt';
import { Router } from '@angular/router';
import { AUTH_CONFIG } from './auth0-variables';

// Avoid name not found warnings
declare var Auth0Lock: any;
declare var jwt_decode: any;

@Injectable()
export class AuthService {

  lock = new Auth0Lock(AUTH_CONFIG.clientID, AUTH_CONFIG.domain, {
    auth: {
      redirectUri: AUTH_CONFIG.callbackURL,
      responseType: 'token id_token',
      params: {
        oidcConformant: true,
        audience: AUTH_CONFIG.apiUrl,
        scope: 'openid read:messages'
      }
    }
  });

  userProfile: any;

  constructor(private router: Router) {}

  public handleAuthentication(): void {
    this.lock.on('authenticated', (authResult) => {
      if (authResult && authResult.accessToken && authResult.idToken) {
        this.setUser(authResult);
      } else if (authResult && authResult.error) {
        alert(`Error: ${authResult.error}`);
      }
    });
  }
  
  public login(username: string, password: string): void {
    this.lock.show();
  }

  public getProfile(cb): void {
    let accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      throw 'Access token must exist to fetch profile';
    }

    let self = this;    
    this.lock.getUserInfo(accessToken, function(err, profile) {
      if (profile) {
        self.userProfile = profile;
      }
      cb(err, profile);
    });
  }

  getRole(): string {
    const namespace = 'https://example.com';
    const idToken = localStorage.getItem('id_token');
    return jwt_decode(idToken)[`${namespace}/role`] || null;
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  public isAuthenticated(): boolean {
    // Check whether the id_token is expired or not
    return tokenNotExpired();
  }

  public logout(): void {
    // Remove token from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    this.router.navigate(['home']);
  }

  private setUser(data): void {
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('id_token', data.idToken);
  }
}
