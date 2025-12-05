import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, user, User, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { environment } from '../../core/services/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  readonly user$: Observable<User | null> = user(this.auth);
  private readonly SESSION_EXPIRY_KEY = 'session_expiry';
  private readonly EXPIRY_DAYS = environment.session.expiryDays;

  constructor() {
    this.checkSessionExpiry();
  }

  login(email: string, password: string): Promise<any> {
    return signInWithEmailAndPassword(this.auth, email, password)
      .then(result => {
        this.setSessionExpiry();
        return result;
      });
  }

  register(email: string, password: string): Promise<any> {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .then(result => {
        this.setSessionExpiry();
        return result;
      })
      .catch(err => {
        console.error('Firebase register error', err);
        throw err;
      });
  }

  logout(): Promise<void> {
    localStorage.removeItem(this.SESSION_EXPIRY_KEY);
    return signOut(this.auth);
  }

  private setSessionExpiry(): void {
    const expiryTime = new Date().getTime() + (this.EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    localStorage.setItem(this.SESSION_EXPIRY_KEY, expiryTime.toString());
  }

  private checkSessionExpiry(): void {
    const expiryTime = localStorage.getItem(this.SESSION_EXPIRY_KEY);
    if (expiryTime && new Date().getTime() > parseInt(expiryTime)) {
      this.logout();
    }
  }

  isSessionExpired(): boolean {
    const expiryTime = localStorage.getItem(this.SESSION_EXPIRY_KEY);
    return expiryTime ? new Date().getTime() > parseInt(expiryTime) : false;
  }
}