import { Component, AfterViewInit, OnInit } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-polylinedecorator';

interface RoutePoint {
  number: number;
  lat: number;
  lng: number;
  altitude?: number;
}

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

  points: RoutePoint[] = [];
  pointCounter = 1;
  selectedPoint: RoutePoint | null = null;
  modalPosition: { left: number; top: number } | null = null;

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
    const saved = localStorage.getItem('route-points');
    if (saved) {
      try {
        this.points = JSON.parse(saved);
        this.renumberPoints();
      } catch (e) {
        this.points = [];
      }
    }

    if (this.points.length > 0) {
      setTimeout(() => this.renderRoute(), 0);
    }
  }

  private saveToLocalStorage() {
    localStorage.setItem('route-points', JSON.stringify(this.points));
  }

  addPoint(lat: number, lng: number) {
    this.points.push({ number: this.pointCounter++, lat, lng });
    this.renumberPoints();
    this.renderRoute();
    this.saveToLocalStorage();
    this.cancelEdit();
  }

  deletePoint(index: number) {
    this.points.splice(index, 1);
    this.renumberPoints();
    this.renderRoute();
    this.saveToLocalStorage();
    this.cancelEdit();
  }

  renumberPoints() {
    this.points.forEach((p, i) => p.number = i + 1);
    this.pointCounter = this.points.length + 1;
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
          this.points[index].lat = latlng.lat;
          this.points[index].lng = latlng.lng;
          this.renderRoute();
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
        this.points[index] = { ...this.selectedPoint };
        this.renderRoute();
        this.cancelEdit();
        this.saveToLocalStorage();
      }
    }
  }

  cancelEdit() {
    this.selectedPoint = null;
    this.modalPosition = null;
  }

  sendToServer() {
    const payload = this.points.map(p => ({
      number: p.number,
      lat: p.lat,
      lng: p.lng,
      altitude: p.altitude || 0
    }));
    console.log('Faik Send to server:', payload);
   
  }
}