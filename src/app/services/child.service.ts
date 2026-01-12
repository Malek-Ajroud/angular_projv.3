import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Child {
    id: string;
    firstName: string;
    birthDate: Date;
    gender: 'boy' | 'girl';
}

@Injectable({
    providedIn: 'root'
})
export class ChildService {
    private children: Child[] = [
        {
            id: '1',
            firstName: 'Léo',
            birthDate: new Date('2018-05-15'),
            gender: 'boy'
        },
        {
            id: '2',
            firstName: 'Emma',
            birthDate: new Date('2020-08-22'),
            gender: 'girl'
        }
    ];

    getChildren(): Observable<Child[]> {
        // Return a copy to mimic API separation
        return of([...this.children]).pipe(delay(500));
    }

    getChild(id: string): Observable<Child> {
        return new Observable(observer => {
            setTimeout(() => {
                const child = this.children.find(c => c.id === id);
                if (child) {
                    observer.next({ ...child });
                    observer.complete();
                } else {
                    observer.error('Enfant non trouvé');
                }
            }, 300);
        });
    }

    addChild(child: Omit<Child, 'id'>): Observable<Child> {
        return new Observable(observer => {
            setTimeout(() => {
                const newChild: Child = {
                    ...child,
                    id: Date.now().toString(),
                    birthDate: new Date(child.birthDate)
                };
                this.children.push(newChild);
                observer.next(newChild);
                observer.complete();
            }, 600);
        });
    }

    updateChild(child: Child): Observable<Child> {
        return new Observable(observer => {
            setTimeout(() => {
                const index = this.children.findIndex(c => c.id === child.id);
                if (index !== -1) {
                    const updatedChild = {
                        ...child,
                        birthDate: new Date(child.birthDate)
                    };
                    this.children[index] = updatedChild;
                    observer.next(updatedChild);
                    observer.complete();
                } else {
                    observer.error('Enfant non trouvé');
                }
            }, 600);
        });
    }

    deleteChild(id: string): Observable<void> {
        return new Observable(observer => {
            setTimeout(() => {
                const index = this.children.findIndex(c => c.id === id);
                if (index !== -1) {
                    this.children.splice(index, 1);
                    observer.next();
                    observer.complete();
                } else {
                    observer.error('Enfant non trouvé');
                }
            }, 400);
        });
    }
}
