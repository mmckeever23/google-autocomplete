import {
  Component,
  Inject,
  ElementRef,
  ViewChild,
  NgZone,
} from '@angular/core';
import * as turf from '@turf/turf';

import { ApiService, Maps } from './api.service';
import { geolib } from './geolib';

const colors = [
];
let colorIndex = 0;

const place = null as google.maps.places.PlaceResult;
type Components = typeof place.address_components;

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  @ViewChild('search')
  public searchElementRef: ElementRef;

  @ViewChild('map')
  public mapElementRef: ElementRef;

  public entries = [];

  public place: google.maps.places.PlaceResult;

  private map: google.maps.Map;

  constructor(apiService: ApiService, private ngZone: NgZone) {
    apiService.api.then((maps) => {
      this.initAutocomplete(maps);
      this.initMap(maps);
    });
  }

  initAutocomplete(maps: Maps) {
    let autocomplete = new maps.places.Autocomplete(
      this.searchElementRef.nativeElement
    );
    autocomplete.addListener('place_changed', () => {
      this.ngZone.run(() => {
        this.onPlaceChange(autocomplete.getPlace());
      });
    });
  }

  initMap(maps: Maps) {
    this.map = new maps.Map(this.mapElementRef.nativeElement, {
      zoom: 5,
      center: { lat: 38, lng: -96 },
      streetViewControl: false,
      fullscreenControl: false,
    });
    this.map.addListener('click', (event) => {
      var line = turf.helpers.lineString(
      );

      const pointLatLng = event.latLng as google.maps.LatLng;
      var point = turf.helpers.point([pointLatLng.lng(), pointLatLng.lat()]);
    });
  }

  onPlaceChange(place: google.maps.places.PlaceResult) {
    this.map.setCenter(place.geometry.location);

    const color = colors[colorIndex++ % colors.length];
    const pin = this.pin(color);

    const marker = new google.maps.Marker({
      position: place.geometry.location,
      animation: google.maps.Animation.DROP,
      map: this.map,
      icon: "https://img.icons8.com/tiny-color/32/null/map-pin.png",
      draggable: true
    });

    const location = this.locationFromPlace(place);

    this.entries.unshift({
      place,
      marker,
      color,
      location,
    });
  }

  remove(entry) {
    entry.marker.setMap(null);
    entry.rectangle.setMap(null);
    entry.expandedRectangle.setMap(null);
    entry.ellipse.setMap(null);
    this.entries = this.entries.filter((e) => e !== entry);
  }

  pin(color) {
    return {
      fillOpacity: 1,
      strokeColor: '#000',
      strokeWeight: 2,
      scale: 1,
    };
  }

  public locationFromPlace(place: google.maps.places.PlaceResult) {
    const components = place.address_components;
    if (components === undefined) {
      return null;
    }

    const areaLevel3 = getShort(components, 'administrative_area_level_3');
    const locality = getLong(components, 'locality');
    const cityName = locality || areaLevel3;
    const name = place.name !== cityName ? place.name : null;

    const coordinates = {
      latitude: place.geometry.location.lat(),
      longitude: place.geometry.location.lng(),
    };

    const bounds = place.geometry.viewport.toJSON();

    return {
      name,
      cityName,
      bounds,
      coordinates,
    };
  }
}

function getComponent(components: Components, name: string) {
  return components.filter((component) => component.types[0] === name)[0];
}

function getLong(components: Components, name: string) {
  const component = getComponent(components, name);
  return component && component.long_name;
}

function getShort(components: Components, name: string) {
  const component = getComponent(components, name);
  return component && component.short_name;
}
