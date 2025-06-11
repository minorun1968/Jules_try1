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

// Function to generate a title from a URL
const generateTitleFromUrl = (url) => {
  if (!url) return 'No title available';
  try {
    const path = new URL(url).pathname;
    // Get the last part of the path
    const lastSegment = path.substring(path.lastIndexOf('/') + 1);
    // Replace hyphens and underscores with spaces, then decode URI components
    const decodedSegment = decodeURIComponent(lastSegment.replace(/[-_]/g, ' '));
    // Basic capitalization (optional, but can make it look nicer)
    return decodedSegment.replace(/\b\w/g, char => char.toUpperCase());
  } catch (e) {
    console.error('Error generating title from URL:', e);
    // Fallback to a generic title or the segment before processing
    const parts = url.split('/');
    const fallback = parts.pop() || parts.pop(); // Handles trailing slash
    return fallback ? fallback.replace(/[-_]/g, ' ') : 'Untitled Event';
  }
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
      stroked: true, // Keep stroke for better visibility
      filled: true,
      radiusScale: 6, // Adjust as needed, works with getRadius in meters
      radiusMinPixels: 2, // Minimum size on screen
      radiusMaxPixels: 50, // Maximum size on screen
      lineWidthMinPixels: 1,
      getPosition: (d) => [d.Actor1Geo_Long, d.Actor1Geo_Lat],
      getRadius: d => Math.sqrt(d.NumMentions || 1) * 100, // Radius driven by NumMentions
      getFillColor: (d) => getColor(d.AvgTone), // Color by AvgTone
      getLineColor: [0, 0, 0, 150], // Slightly transparent black stroke
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
            left: tooltip.x + 10, // Adjusted offset
            top: tooltip.y + 10,  // Adjusted offset
            backgroundColor: 'rgba(30, 30, 30, 0.9)', // Darker background for better contrast
            color: '#fff',
            padding: '10px',
            borderRadius: '6px',
            fontSize: '14px', // Slightly larger font
            maxWidth: '350px',
            wordWrap: 'break-word',
            zIndex: 20,
            fontFamily: 'Arial, sans-serif', // More readable font
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)', // Subtle shadow
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '16px' }}>
              {tooltip.object.Actor1Geo_Fullname || 'Unknown Location'}
            </div>
            <div style={{ marginBottom: '3px', color: '#ccc' }}> {/* Lighter color for title */}
              {generateTitleFromUrl(tooltip.object.SOURCEURL)}
            </div>
            <div style={{ color: '#87CEFA', fontSize: '12px' }}> {/* Light blue for score */}
              Mention Score: {tooltip.object.NumMentions || 0}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default IndexPage;
