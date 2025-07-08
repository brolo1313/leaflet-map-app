import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-polylinedecorator';
import { RouteStorageService, RoutePoint } from './route-storage.service';
import { Subject, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit, OnInit {
  private map!: L.Map;
  private markers: L.Marker[] = [];
  private line!: L.Polyline;
  private decorator!: any;

  private readonly storage = inject(RouteStorageService);
  private readonly routeChanged$ = new Subject<RoutePoint[]>();

  points$ = new BehaviorSubject<RoutePoint[]>([]);
  pointCounter = 1;
  selectedPoint: RoutePoint | null = null;
  modalPosition: { left: number; top: number } | null = null;
  showFinalModal = false;
  isSent = false;

  ngAfterViewInit(): void {
    this.map = L.map('map').setView([50.45, 30.52], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.addPoint(e.latlng.lat, e.latlng.lng);
    });
  }

  ngOnInit(): void {
    const loaded = this.storage.load();
    this.points$.next(loaded);
    this.renumberPoints();
    if (loaded.length > 0) {
      setTimeout(() => this.renderRoute(), 0);
    }
    this.routeChanged$.subscribe(points => {
      this.renumberPoints();
      this.renderRoute();
      this.saveToLocalStorage();
      this.cancelEdit();
    });
  }

  private get points(): RoutePoint[] {
    return this.points$.getValue();
  }

  private set points(val: RoutePoint[]) {
    this.points$.next(val);
  }

  addPoint(lat: number, lng: number) {
    const newPoints = [...this.points, { number: this.pointCounter++, lat, lng }];
    this.points$.next(newPoints);
    this.routeChanged$.next(newPoints);
  }

  deletePoint(index: number) {
    const newPoints = this.points.filter((_, i) => i !== index);
    this.points$.next(newPoints);
    this.routeChanged$.next(newPoints);
  }

  renumberPoints() {
    const pts = this.points;
    pts.forEach((p, i) => p.number = i + 1);
    this.pointCounter = pts.length + 1;
    this.points$.next(pts);
  }

  renderRoute() {
    this.markers.forEach(m => m.remove());
    this.line?.remove();
    this.decorator?.remove();

    const coords = this.points.map(p => [p.lat, p.lng]) as L.LatLngExpression[];

    this.markers = this.points.map((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        draggable: true
      })
        .addTo(this.map)
        .bindTooltip(`${point.number}`, { permanent: true, direction: 'top' })
        .on('dragend', (event: any) => {
          const latlng = event.target.getLatLng();
          const updated = [...this.points];
          updated[index] = { ...updated[index], lat: latlng.lat, lng: latlng.lng };
          this.points$.next(updated);
          this.routeChanged$.next(updated);
        })
        .on('click', (event: any) => {
          this.selectedPoint = { ...this.points[index] };
          const containerPoint = this.map.latLngToContainerPoint([point.lat, point.lng]);
          this.modalPosition = {
            left: containerPoint.x,
            top: containerPoint.y
          };
        });
      return marker;
    });

    if (coords.length > 1) {
      this.line = L.polyline(coords, { color: 'blue' }).addTo(this.map);
      this.decorator = (L as any).polylineDecorator(this.line, {
        patterns: [
          {
            offset: 25,
            repeat: 50,
            symbol: (L as any).Symbol.arrowHead({
              pixelSize: 10,
              polygon: false,
              pathOptions: { stroke: true, color: 'red' }
            })
          }
        ]
      }).addTo(this.map);
    }
  }

  savePoint() {
    if (this.selectedPoint) {
      const index = this.points.findIndex(p => p.number === this.selectedPoint!.number);
      if (index > -1) {
        const updated = [...this.points];
        updated[index] = { ...this.selectedPoint };
        this.points$.next(updated);
        this.routeChanged$.next(updated);
      }
    }
  }

  cancelEdit() {
    this.selectedPoint = null;
    this.modalPosition = null;
  }

  openFinalModal() {
    this.showFinalModal = true;
    this.isSent = false;
  }

  closeFinalModal() {
    this.showFinalModal = false;
    this.isSent = false;
  }

  confirmSend() {
    const payload = this.points.map(p => ({
      number: p.number,
      lat: p.lat,
      lng: p.lng,
      altitude: p.altitude || 0
    }));
    console.log('Fake Send to server:', payload);
    this.isSent = true;
    this.points$.next([]);
    this.routeChanged$.next([]);
    this.storage.save([]);
    this.pointCounter = 1;
  }

  sendToServer() {
    this.openFinalModal();
  }

  private saveToLocalStorage() {
    this.storage.save(this.points);
  }
}