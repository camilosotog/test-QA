import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  id?: number;
  email: string;
  name: string;
  password?: string;
  user_role: string;
  avatarUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private apiUrl = '/api/users';

  constructor(private http: HttpClient) {}


  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getOnlineUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/online`);
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: User): Observable<any> {
    return this.http.post(this.apiUrl, user);
  }

  updateUser(id: number, user: User): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
