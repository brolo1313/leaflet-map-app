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
export class MapComponent {

}