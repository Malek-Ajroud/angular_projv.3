import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Child } from '../models/app.models';

@Injectable({
    providedIn: 'root'
})
export class ChildService {
    private apiUrl = `${environment.PHP_API_URL}/children.php`;

    constructor(private http: HttpClient) { }

    getChildren(): Observable<Child[]> {
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
    }
}
