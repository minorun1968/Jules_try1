import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Wrapper } from '@googlemaps/react-wrapper';
import { GoogleMapsOverlay } from '@vis.gl/google-maps';
import { ScatterplotLayer } from '@deck.gl/layers';
import Head from 'next/head';

const MAP_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = 'REALTIME_WORLD_DASHBOARD'; // Optional: For custom map styling

// Map default settings
const INITIAL_VIEW_STATE = {
  latitude: 35.68,
  longitude: 139.76,
  zoom: 5,
  pitch: 0,
  bearing: 0,
};

// Function to determine color based on AvgTone
const getColor = (avgTone) => {
  if (avgTone >= 2) {
    return [0, 255, 0]; // Green
  }
  if (avgTone <= -2) {
    return [255, 0, 0]; // Red
  }
  return [0, 0, 255]; // Blue
};

const IndexPage = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  // Ref for Google Map instance
  const mapRef = useRef(null);
  // Ref for Deck.gl overlay instance
  const deckRef = useRef(null);


  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const layers = [
    new ScatterplotLayer({
      id: 'scatterplot-layer',
      data: events,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 6,
      radiusMinPixels: 5, // Adjusted for better visibility at different zoom levels
      radiusMaxPixels: 100,
      lineWidthMinPixels: 1,
      getPosition: (d) => [d.Actor1Geo_Long, d.Actor1Geo_Lat],
      getRadius: 5000, // Radius in meters
      getFillColor: (d) => getColor(d.AvgTone),
      getLineColor: [0, 0, 0],
      onHover: (info) => {
        if (info.object) {
          setTooltip({
            x: info.x,
            y: info.y,
            object: info.object,
          });
        } else {
          setTooltip(null);
        }
      },
      onClick: (info) => {
        if (info.object && info.object.SOURCEURL) {
          window.open(info.object.SOURCEURL, '_blank');
        }
      },
    }),
  ];

  const MapComponent = () => {
    useEffect(() => {
      if (mapRef.current) {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: INITIAL_VIEW_STATE.latitude, lng: INITIAL_VIEW_STATE.longitude },
          zoom: INITIAL_VIEW_STATE.zoom,
          mapId: MAP_ID, // Required for vector maps, can be a custom ID or 'DEMO_MAP_ID'
           // Enforce dark mode style via map options
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
            {
              featureType: 'administrative.locality',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#d59563' }],
            },
            {
              featureType: 'poi',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#d59563' }],
            },
            {
              featureType: 'poi.park',
              elementType: 'geometry',
              stylers: [{ color: '#263c3f' }],
            },
            {
              featureType: 'poi.park',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#6b9a76' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#38414e' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#212a37' }],
            },
            {
              featureType: 'road',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#9ca5b3' }],
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry',
              stylers: [{ color: '#746855' }],
            },
            {
              featureType: 'road.highway',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#1f2835' }],
            },
            {
              featureType: 'road.highway',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#f3d19c' }],
            },
            {
              featureType: 'transit',
              elementType: 'geometry',
              stylers: [{ color: '#2f3948' }],
            },
            {
              featureType: 'transit.station',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#d59563' }],
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#17263c' }],
            },
            {
              featureType: 'water',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#515c6d' }],
            },
            {
              featureType: 'water',
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#17263c' }],
            },
          ],
        });
        deckRef.current = new GoogleMapsOverlay({ layers });
        deckRef.current.setMap(map);
      }
    }, []);

    useEffect(() => {
      if (deckRef.current) {
        deckRef.current.setProps({ layers });
      }
    }, [layers]);


    return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
  };


  return (
    <>
      <Head>
        <title>Real-time World Dashboard</title>
        <meta name="description" content="GDELT Event Data Visualization" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        {isLoading && !error && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            color: 'white', fontSize: '2em', zIndex: 10, background: 'rgba(0,0,0,0.7)', padding: '20px', borderRadius: '10px'
          }}>
            Loading...
          </div>
        )}
        {error && (
          <div style={{
            position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
            color: 'red', background: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '5px', zIndex: 10, border: '1px solid red'
          }}>
            Error: {error}
          </div>
        )}
        <button
          onClick={fetchData}
          disabled={isLoading}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 10,
            padding: '10px 15px',
            fontSize: '1em',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            backgroundColor: isLoading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
          }}
        >
          {isLoading ? 'Loading...' : 'Reload Data'}
        </button>

        <Wrapper apiKey={MAP_API_KEY} render={MapComponent} version="beta">
          <MapComponent />
        </Wrapper>

        {tooltip && tooltip.object && (
          <div style={{
            position: 'absolute',
            left: tooltip.x + 5, // offset from cursor
            top: tooltip.y + 5,  // offset from cursor
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '0.9em',
            maxWidth: '300px',
            wordWrap: 'break-word',
            zIndex: 20, // Ensure tooltip is above map
          }}>
            {tooltip.object.SOURCEURL}
          </div>
        )}
      </div>
    </>
  );
};

export default IndexPage;
