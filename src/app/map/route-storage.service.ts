import { Injectable } from '@angular/core';

export interface RoutePoint {
  number: number;
  lat: number;
  lng: number;
  altitude?: number;
}

@Injectable({ providedIn: 'root' })
export class RouteStorageService {
  private readonly storageKey = 'route-points';

  save(points: RoutePoint[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(points));
  }

  load(): RoutePoint[] {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return [];
    try {
      return JSON.parse(saved) as RoutePoint[];
    } catch {
      return [];
    }
  }
} 