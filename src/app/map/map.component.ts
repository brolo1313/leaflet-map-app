import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-polylinedecorator';
import { Observable, Subscriber } from 'rxjs';

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
  private map?: L.Map;

  ngAfterViewInit(): void {
    this.map = L.map('map', {
      center: [48.3794, 31.1656],
      zoom: 6,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);
  }
}