import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { ScatterplotLayer } from '@deck.gl/layers';
import Head from 'next/head';

const MAP_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = 'DEMO_MAP_ID';

const INITIAL_VIEW_STATE = {
  latitude: 35.68,
  longitude: 139.76,
  zoom: 5,
};

const getTitleFromUrl = (url) => {
  try {
    const path = new URL(url).pathname;
    const slug = path.split('/').filter(Boolean).pop() || '';
    const decodedSlug = decodeURIComponent(slug.replace(/[-_]/g, ' '));
    return decodedSlug.length > 100 ? decodedSlug.substring(0, 100) + '...' : decodedSlug;
  } catch (e) {
    return '（タイトル取得不可）';
  }
};

function MapComponent() {
  const mapDivRef = useRef(null);
  const [map, setMap] = useState(null);
  const [overlay, setOverlay] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (mapDivRef.current && !map) {
      const mapInstance = new window.google.maps.Map(mapDivRef.current, {
        center: { lat: INITIAL_VIEW_STATE.latitude, lng: INITIAL_VIEW_STATE.longitude },
        zoom: INITIAL_VIEW_STATE.zoom,
        mapId: MAP_ID,
      });
      setMap(mapInstance);
      const overlayInstance = new GoogleMapsOverlay({ layers: [] });
      overlayInstance.setMap(mapInstance);
      setOverlay(overlayInstance);
    }
  }, [mapDivRef, map]);

  useEffect(() => {
    if (overlay) {
      const layers = [
        new ScatterplotLayer({
          id: 'events-layer',
          data,
          pickable: true,
          opacity: 0.7,
          stroked: true,
          filled: true,
          getRadius: d => Math.sqrt(d.NumMentions || 1) * 1000,
          radiusMinPixels: 3,
          radiusMaxPixels: 50,
          getPosition: d => [d.ActionGeo_Long, d.ActionGeo_Lat],
          getFillColor: d => {
            if (d.AvgTone >= 2) return [0, 255, 0, 150];
            if (d.AvgTone <= -2) return [255, 0, 0, 150];
            return [0, 0, 255, 150];
          },
          getLineColor: [0, 0, 0],
          onHover: info => setTooltip(info),
          onClick: info => {
            if (info.object) window.open(info.object.SOURCEURL, '_blank');
          }
        }),
      ];
      overlay.setProps({ layers });
    }
  }, [data, overlay]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1, background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '5px' }}>
        <button onClick={fetchData} disabled={loading}>
          {loading ? 'Loading Data...' : 'Reload Data'}
        </button>
        {error && <p style={{ color: 'red', margin: '5px 0 0' }}>{error}</p>}
      </div>
      {tooltip?.object && (
        <div style={{
          position: 'absolute', zIndex: 1, pointerEvents: 'none',
          left: tooltip.x, top: tooltip.y,
          background: 'rgba(0,0,0,0.8)', color: 'white', padding: '10px',
          borderRadius: '5px', maxWidth: '350px', fontSize: '14px', lineHeight: '1.5',
        }}>
          <strong style={{color: '#a5c9ff'}}>
            {tooltip.object.ActionGeo_Fullname || '不明な場所'}
          </strong>
          <p style={{margin: '5px 0 0', color: '#ccc', fontSize: '12px'}}>
            {getTitleFromUrl(tooltip.object.SOURCEURL)}
          </p>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const render = (status) => {
    switch (status) {
      case Status.LOADING: return <div className="status-message">Loading Maps API...</div>;
      case Status.FAILURE: return <div className="status-message">Error loading Maps API.</div>;
      case Status.SUCCESS: return <MapComponent />;
    }
  };
  if (!MAP_API_KEY) {
    return <div className="status-message">Error: Google Maps API key is missing.</div>;
  }
  return (
    <>
      <Head>
        <title>Real-time World Affairs Dashboard</title>
        <meta name="description" content="Visualizing global events from GDELT." />
        <link rel="icon" href="/favicon.ico" />
        <style>{`.status-message { display: flex; justify-content: center; align-items: center; height: 100vh; }`}</style>
      </Head>
      <Wrapper apiKey={MAP_API_KEY} render={render} />
    </>
  );
}
