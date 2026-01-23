import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
<<<<<<< HEAD

export interface Child {
    id: string;
    first_name: string;
    birth_date: Date;
    gender: 'boy' | 'girl';
}
=======
import { Child } from '../models/app.models';
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919

@Injectable({
    providedIn: 'root'
})
export class ChildService {
<<<<<<< HEAD
    private apiUrl = environment.PHP_API_URL + '/children.php';
=======
    private apiUrl = `${environment.PHP_API_URL}/children.php`;
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919

    constructor(private http: HttpClient) { }

    getChildren(): Observable<Child[]> {
<<<<<<< HEAD
        return this.http.get<{ success: boolean, data: any[] }>(this.apiUrl).pipe(
            map(res => res.data.map(child => ({
                ...child,
                birth_date: new Date(child.birth_date)
            })))
        );
    }

    getChild(id: string): Observable<Child> {
        return this.http.get<{ success: boolean, data: any }>(`${this.apiUrl}?id=${id}`).pipe(
            map(res => ({
                ...res.data,
                birth_date: new Date(res.data.birth_date)
            }))
        );
    }

    addChild(child: Omit<Child, 'id'>): Observable<Child> {
        return this.http.post<{ success: boolean, data: any }>(this.apiUrl, child).pipe(
            map(res => ({
                ...res.data,
                birth_date: new Date(res.data.birth_date)
            }))
        );
    }

    updateChild(child: Child): Observable<Child> {
        return this.http.post<{ success: boolean, data: any }>(this.apiUrl, child).pipe(
            map(res => ({
                ...res.data,
                birth_date: new Date(res.data.birth_date)
            }))
        );
    }

    deleteChild(id: string): Observable<void> {
        return this.http.delete<any>(`${this.apiUrl}?id=${id}`).pipe(
            map(() => undefined)
        );
=======
        return this.http.get<any>(this.apiUrl).pipe(
            map(response => {
                if (!response.success) return [];
                return response.data.map((item: any) => ({
                    id: item.id,
                    firstName: item.first_name,
                    lastName: item.last_name,
                    birthDate: item.birth_date,
                    gender: item.gender,
                    schoolYear: item.school_year,
                    schoolName: item.school_name,
                    address: item.address
                }));
            })
        );
    }

    getChild(id: string): Observable<Child | null> {
        return this.http.get<any>(`${this.apiUrl}?id=${id}`).pipe(
            map(response => {
                if (!response.success) return null;
                const item = response.data;
                return {
                    id: item.id,
                    firstName: item.first_name,
                    lastName: item.last_name,
                    birthDate: item.birth_date,
                    gender: item.gender,
                    schoolYear: item.school_year,
                    schoolName: item.school_name,
                    address: item.address
                };
            })
        );
    }

    addChild(child: Omit<Child, 'id'>): Observable<any> {
        return this.http.post<any>(this.apiUrl, child);
    }

    updateChild(child: Child): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}?id=${child.id}`, child);
    }

    deleteChild(id: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}?id=${id}`);
>>>>>>> 2615bcd57fe52ad60051ca3ce24a575aa79ae919
    }
}
