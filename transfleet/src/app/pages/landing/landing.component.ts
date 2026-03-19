import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, icons } from 'lucide-angular';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  version = '1.0.0';
  
  // Icônes Lucide
  icons: { [key: string]: any } = {
    car: icons.Car,
    mapPin: icons.MapPin,
    user: icons.User,
    fuel: icons.Fuel,
    wrench: icons.Wrench,
    barChart: icons.Activity,
    truck: icons.Truck,
    arrowRight: icons.ArrowRight,
    check: icons.Check,
    quote: icons.Quote
  };

  features = [
    {
      icon: 'car',
      title: 'Gestion de flotte',
      description: 'Gérez l\'ensemble de votre parc automobile depuis une interface centralisée. Suivi des véhicules, documents et statuts en temps réel.'
    },
    {
      icon: 'mapPin',
      title: 'Suivi GPS temps réel',
      description: 'Localisez vos véhicules à la seconde près. Historique des trajets, géofencing et alertes automatiques inclus.'
    },
    {
      icon: 'user',
      title: 'Gestion des conducteurs',
      description: 'Profils complets, licences, performances et disponibilité de vos chauffeurs en un seul endroit.'
    },
    {
      icon: 'fuel',
      title: 'Suivi carburant',
      description: 'Analysez la consommation, détectez les anomalies et optimisez vos coûts de carburant par véhicule.'
    },
    {
      icon: 'wrench',
      title: 'Maintenance préventive',
      description: 'Planifiez les entretiens, recevez des alertes proactives et gardez votre flotte en parfait état de marche.'
    },
    {
      icon: 'barChart',
      title: 'Rapports & Analytiques',
      description: 'Tableaux de bord clairs, rapports d\'utilisation, analyse des coûts et indicateurs de performance.'
    }
  ];

  stats = [
    { value: '500+', label: 'Entreprises clientes' },
    { value: '15 000+', label: 'Véhicules gérés' },
    { value: '98%', label: 'Satisfaction client' },
    { value: '40%', label: 'Réduction des coûts' }
  ];

  testimonials = [
    {
      name: 'Jean-Marc Ngono',
      role: 'Directeur logistique',
      company: 'Transport Express Cameroun',
      quote: 'TransFleet a transformé notre gestion de flotte. Nous économisons 35% sur le carburant et nos chauffeurs sont plus efficaces.'
    },
    {
      name: 'Aminata Diallo',
      role: 'Responsable opérations',
      company: 'Sahel Mobility',
      quote: 'Le suivi en temps réel et les alertes automatiques nous permettent d\'éviter les pannes avant qu\'elles ne surviennent.'
    },
    {
      name: 'Pierre Kouassi',
      role: 'CEO',
      company: 'ABIDJAN FLEET',
      quote: 'Interface intuitive, support réactif. TransFleet est l\'outil qu\'attendait notre secteur depuis des années.'
    }
  ];
}