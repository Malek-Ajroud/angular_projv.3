import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LibraryEntry {
    id: string;
    date: Date;
    homeworkTitle: string;
    files: [
  { nom: string; fileId: number }
];
    childProfile?: any;
}

@Injectable({
    providedIn: 'root'
})
export class LibraryService {
    private readonly STORAGE_KEY = 'rafi9ni_parent_library';
    private librarySubject = new BehaviorSubject<LibraryEntry[]>([]);
    public library$ = this.librarySubject.asObservable();
    private isBrowser: boolean;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        this.isBrowser = isPlatformBrowser(this.platformId);
        console.log('LibraryService: Instance créée. isBrowser =', this.isBrowser);
        if (this.isBrowser) {
            this.loadLibrary();
        }
    }

    /**
     * Add a new entry to the library and persist it
     */
    addEntry(entry: Omit<LibraryEntry, 'id' | 'date'>): void {
        console.log('LibraryService: addEntry appelé avec:', entry);

        // Prevent duplicates based on homework title
        if (this.hasEntry(entry.homeworkTitle)) {
            console.log('LibraryService: Document déjà présent:', entry.homeworkTitle);
            return;
        }

        const newEntry: LibraryEntry = {
            ...entry,
            id: this.isBrowser ? crypto.randomUUID() : Math.random().toString(36).substring(2),
            date: new Date()
        };

        const currentLibrary = this.librarySubject.value;
        const updatedLibrary = [newEntry, ...currentLibrary];

        this.saveLibrary(updatedLibrary);
    }

    /**
     * Check if an entry with the same title already exists
     */
    hasEntry(title: string): boolean {
        return this.librarySubject.value.some(e => e.homeworkTitle === title);
    }

    /**
     * Clear all entries from the library
     */
    clearLibrary(): void {
        this.saveLibrary([]);
    }

    /**
     * Delete an entry from the library
     */
    deleteEntry(id: string): void {
        const updatedLibrary = this.librarySubject.value.filter(e => e.id !== id);
        this.saveLibrary(updatedLibrary);
    }

    private loadLibrary(): void {
        if (!this.isBrowser) return;

        const data = localStorage.getItem(this.STORAGE_KEY);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                // Convert date strings back to Date objects
                const library = parsed.map((e: any) => ({
                    ...e,
                    date: new Date(e.date)
                }));
                this.librarySubject.next(library);
            } catch (e) {
                console.error('Error parsing library data', e);
                this.librarySubject.next([]);
            }
        }
    }

    private saveLibrary(library: LibraryEntry[]): void {
        if (this.isBrowser) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(library));
        }
        this.librarySubject.next(library);
    }

    getEntries(): LibraryEntry[] {
        return this.librarySubject.value;
    }
}
