import { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { FaDirections, FaHospital, FaPhone } from 'react-icons/fa';
import './HospitalFinder.css';

const libraries = ['places'];
const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const HospitalFinder = ({ isOpen, onClose }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [directions, setDirections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          setLoading(false);
        },
        (error) => {
          setError('Error getting your location. Please enable location services.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
    }
  }, []);

  const searchNearbyHospitals = (map, maps) => {
    if (currentLocation && maps) {
      console.log('Searching for hospitals near:', currentLocation);
      
      const service = new maps.places.PlacesService(map);
      const request = {
        location: new maps.LatLng(currentLocation.lat, currentLocation.lng),
        radius: 5000,
        type: ['hospital'],
        keyword: 'hospital'
      };

      service.nearbySearch(request, (results, status) => {
        console.log('Places API response:', { status, resultsCount: results?.length });
        
        if (status === maps.places.PlacesServiceStatus.OK && results) {
          console.log('Found hospitals:', results);
          
          const hospitalsWithDetails = results.map(hospital => {
            const location = {
              lat: hospital.geometry.location.lat(),
              lng: hospital.geometry.location.lng()
            };
            
            const distance = maps.geometry.spherical.computeDistanceBetween(
              new maps.LatLng(currentLocation.lat, currentLocation.lng),
              new maps.LatLng(location.lat, location.lng)
            );

            return {
              ...hospital,
              distance: (distance / 1000).toFixed(1),
              location
            };
          });

          // Sort hospitals by distance
          hospitalsWithDetails.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
          console.log('Processed hospitals:', hospitalsWithDetails);
          setHospitals(hospitalsWithDetails);
        } else {
          console.error('Places API error:', status);
          setError(`Error finding hospitals: ${status}`);
          setHospitals([]);
        }
      });
    } else {
      console.error('Missing required data:', { currentLocation, mapsLoaded: !!maps });
      setError('Unable to search for hospitals. Please try again.');
    }
  };

  const onMapLoad = (map) => {
    console.log('Map loaded, initializing Places Service');
    if (window.google && window.google.maps) {
      searchNearbyHospitals(map, window.google.maps);
    } else {
      console.error('Google Maps not properly loaded');
      setError('Google Maps failed to load properly. Please refresh the page.');
    }
  };

  const getDirections = (hospital) => {
    if (!currentLocation) return;

    const directionsService = new window.google.maps.DirectionsService();
    
    const request = {
      origin: currentLocation,
      destination: hospital.location,
      travelMode: 'DRIVING'
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        setDirections(result);
        setSelectedHospital(hospital);
      } else {
        setError('Error getting directions.');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="hospital-finder-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2><FaHospital /> Nearby Hospitals</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="modal-body">
            <div className="map-container">
              <LoadScript 
                googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                libraries={libraries}
              >
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={currentLocation}
                  zoom={13}
                  onLoad={onMapLoad}
                >
                  {currentLocation && (
                    <Marker
                      position={currentLocation}
                      icon={{
                        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                      }}
                    />
                  )}

                  {hospitals.map((hospital) => (
                    <Marker
                      key={hospital.place_id}
                      position={hospital.location}
                      onClick={() => setSelectedHospital(hospital)}
                    />
                  ))}

                  {selectedHospital && !directions && (
                    <InfoWindow
                      position={selectedHospital.location}
                      onCloseClick={() => setSelectedHospital(null)}
                    >
                      <div className="info-window">
                        <h3>{selectedHospital.name}</h3>
                        <p>{selectedHospital.vicinity}</p>
                        <p>Distance: {selectedHospital.distance} km</p>
                      </div>
                    </InfoWindow>
                  )}

                  {directions && <DirectionsRenderer directions={directions} />}
                </GoogleMap>
              </LoadScript>
            </div>

            <div className="hospitals-list">
              <h3>Available Hospitals</h3>
              {hospitals.map((hospital) => (
                <div 
                  key={hospital.place_id} 
                  className={`hospital-item ${selectedHospital?.place_id === hospital.place_id ? 'selected' : ''}`}
                  onClick={() => setSelectedHospital(hospital)}
                >
                  <div className="hospital-info">
                    <h4>{hospital.name}</h4>
                    <p className="hospital-address">{hospital.vicinity}</p>
                    <p className="hospital-distance">{hospital.distance} km away</p>
                  </div>
                  <div className="hospital-actions">
                    <button 
                      className="direction-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        getDirections(hospital);
                      }}
                    >
                      <FaDirections /> Get Directions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalFinder;
