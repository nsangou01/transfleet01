import { Component, inject, signal, OnInit, OnDestroy, AfterViewInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ApiService } from "../../core/services/api.service";
import * as L from 'leaflet';

@Component({
  selector: "app-tracking", 
  standalone: true, 
  imports: [CommonModule],
  templateUrl: './tracking.component.html',
  styleUrl: './tracking.component.scss',
})
export class TrackingComponent implements OnInit, OnDestroy, AfterViewInit {
  private api = inject(ApiService);
  
  data = signal<any[]>([]);
  loading = signal(false);
  lastUpdate = signal("—");
  
  private map!: L.Map;
  private markers: L.Marker[] = [];
  private updateTimer: any;

  // Correction des icônes Leaflet pour Angular
  private defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });

  ngOnInit() { 
    this.load(); 
    // On stocke le timer pour pouvoir le détruire proprement
    this.updateTimer = setInterval(() => this.load(), 15000); 
  }

  ngAfterViewInit() { 
    this.initMap(); 
  }

  ngOnDestroy() { 
    if (this.updateTimer) clearInterval(this.updateTimer);
    if (this.map) this.map.remove(); 
  }

  private initMap(): void {
    // Centre sur Douala
    this.map = L.map('map').setView([4.0511, 9.7179], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
  }

  load(): void {
    this.loading.set(true);
    this.api.getTracking().subscribe({
      next: (r: any) => {
        const cleanData = r?.data || [];
        this.data.set(cleanData);
        this.lastUpdate.set(new Date().toLocaleTimeString("fr-FR"));
        this.updateMarkers();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private updateMarkers(): void {
    if (!this.map) return;

    // 1. Supprimer les anciens marqueurs
    this.markers.forEach(m => this.map.removeLayer(m));
    this.markers = [];

    const bounds: L.LatLngExpression[] = [];

    // 2. Ajouter les nouveaux marqueurs
    this.data().forEach(item => {
      // Le backend envoie lastPosition sous forme de tableau [pos]
      if (item.lastPosition && item.lastPosition.length > 0) {
        const pos = item.lastPosition[0];
        const lat = parseFloat(pos.latitude);
        const lng = parseFloat(pos.longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
          const marker = L.marker([lat, lng], { icon: this.defaultIcon })
            .addTo(this.map)
            .bindTooltip(item.vehicle.plate, { 
              permanent: true, 
              direction: 'right', 
              offset: [15, -15],
              className: 'vehicle-badge' 
            })
            .bindPopup(`
              <b>${item.vehicle.brand} ${item.vehicle.model}</b><br>
              Plaque: ${item.vehicle.plate}<br>
              Vitesse: ${pos.speed || 0} km/h
            `);

          this.markers.push(marker);
          bounds.push([lat, lng]);
        }
      }
    });

    // 3. Ajuster la vue si on a plusieurs véhicules
    if (bounds.length > 0 && this.markers.length > 1) {
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
    }
  }

  statusLabel(s: string): string { 
    return s === 'in_progress' ? 'En route' : 'Arrêté'; 
  }

  focusVehicle(item: any) { 
    if (item.lastPosition && item.lastPosition.length > 0) {
      const pos = item.lastPosition[0];
      this.map.flyTo([pos.latitude, pos.longitude], 16);
      
      // Optionnel : ouvrir le popup du marqueur correspondant
      const marker = this.markers.find(m => 
        m.getLatLng().lat === parseFloat(pos.latitude) && 
        m.getLatLng().lng === parseFloat(pos.longitude)
      );
      if (marker) marker.openPopup();
    }
  }
}