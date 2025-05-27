import * as Location from 'expo-location';
import { Alert } from 'react-native';
import NotificationService from './NotificationService';

export interface Venue {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
}

// Mock data for hockey venues in Namibia
const hockeyVenues: Venue[] = [
  {
    id: '1',
    name: 'Windhoek Stadium',
    latitude: -22.5609,
    longitude: 17.0658,
    radius: 500,
  },
  {
    id: '2',
    name: 'Swakopmund Sports Complex',
    latitude: -22.6784,
    longitude: 14.5258,
    radius: 500,
  },
  {
    id: '3',
    name: 'Walvis Bay Sports Ground',
    latitude: -22.9576,
    longitude: 14.5053,
    radius: 500,
  },
  {
    id: '4',
    name: 'Otjiwarongo Training Center',
    latitude: -20.4637,
    longitude: 16.6477,
    radius: 500,
  },
];

class LocationService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private isTracking = false;
  private lastNotifiedVenueId: string | null = null;

  // Request location permissions
  async requestLocationPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required for venue alerts. Please enable it in your device settings.'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  // Start tracking user location for venue alerts
  async startLocationTracking() {
    if (this.isTracking) return;

    const hasPermission = await this.requestLocationPermissions();
    if (!hasPermission) return;

    try {
      // Set up location tracking
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 100, // Update every 100 meters
          timeInterval: 60000, // Or every 1 minute
        },
        (location) => {
          this.checkNearbyVenues(location);
        }
      );

      this.isTracking = true;
      console.log('Location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  }

  // Stop tracking user location
  stopLocationTracking() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
      this.isTracking = false;
      console.log('Location tracking stopped');
    }
  }

  // Check if user is near any hockey venues
  private async checkNearbyVenues(location: Location.LocationObject) {
    const { latitude, longitude } = location.coords;

    for (const venue of hockeyVenues) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        venue.latitude,
        venue.longitude
      );

      // If user is within the venue radius and hasn't been notified about this venue recently
      if (distance <= venue.radius && this.lastNotifiedVenueId !== venue.id) {
        this.lastNotifiedVenueId = venue.id;
        
        // Send notification about nearby venue
        await NotificationService.sendImmediateNotification({
          title: 'Hockey Venue Nearby',
          body: `You're near ${venue.name}. Check if there are any matches happening!`,
          data: { type: 'venue_alert', venueId: venue.id, venueName: venue.name },
        });

        // Reset the last notified venue after 2 hours
        setTimeout(() => {
          if (this.lastNotifiedVenueId === venue.id) {
            this.lastNotifiedVenueId = null;
          }
        }, 2 * 60 * 60 * 1000);
      }
    }
  }

  // Calculate distance between two coordinates in meters using the Haversine formula
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  // Get all hockey venues
  getVenues(): Venue[] {
    return [...hockeyVenues];
  }

  // Get current location
  async getCurrentLocation() {
    const hasPermission = await this.requestLocationPermissions();
    if (!hasPermission) return null;

    try {
      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }
}

export default new LocationService();
