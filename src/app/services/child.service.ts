import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Child {
    id: string;
    first_name: string;
    birth_date: Date;
    gender: 'boy' | 'girl';
}

@Injectable({
    providedIn: 'root'
})
export class ChildService {
    private apiUrl = environment.PHP_API_URL + '/children.php';

    constructor(private http: HttpClient) { }

    getChildren(): Observable<Child[]> {
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
    }
}
