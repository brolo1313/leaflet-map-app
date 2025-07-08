import { Component, AfterViewInit } from '@angular/core';
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
export class MapComponent implements AfterViewInit {
  private map!: L.Map;
  private markers: L.Marker[] = [];
  private line!: L.Polyline;
  private decorator!: any;

  points: RoutePoint[] = [];
  pointCounter = 1;
  selectedPoint: RoutePoint | null = null;

  ngAfterViewInit(): void {
    this.map = L.map('map').setView([50.45, 30.52], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.addPoint(e.latlng.lat, e.latlng.lng);
    });
  }

  addPoint(lat: number, lng: number) {
    this.points.push({ number: this.pointCounter++, lat, lng });
    this.renderRoute();
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
        .on('click', () => {
          this.selectedPoint = { ...this.points[index] };
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