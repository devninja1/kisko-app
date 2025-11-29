import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, user, User, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  readonly user$: Observable<User | null> = user(this.auth);

  constructor() {}

  login(email: string, password: string): Promise<any> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  register(email: string, password: string): Promise<any> {
    return createUserWithEmailAndPassword(this.auth, email, password)
      .catch(err => {
        console.error('Firebase register error', err);
        throw err;
      });
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }
}