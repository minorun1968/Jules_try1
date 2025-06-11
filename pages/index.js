import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { ScatterplotLayer } from '@deck.gl/layers';
import Head from 'next/head';

// --- 定数定義 ---
const MAP_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = 'DEMO_MAP_ID'; // Vector Map用のID

const INITIAL_VIEW_STATE = {
  latitude: 35.68,
  longitude: 139.76,
  zoom: 5,
};

// --- 地図とオーバーレイを描画するメインコンポーネント ---
function MapComponent() {
  const mapDivRef = useRef(null); // 地図を描画するdiv要素への参照
  const [map, setMap] = useState(null); // Google Mapインスタンスの状態
  const [overlay, setOverlay] = useState(null); // Deck.glオーバーレイインスタンスの状態
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  // データ取得ロジック
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

  // 初回マウント時にデータ取得
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Google Mapのインスタンスを一度だけ作成
  useEffect(() => {
    if (mapDivRef.current && !map) {
      const mapInstance = new window.google.maps.Map(mapDivRef.current, {
        center: { lat: INITIAL_VIEW_STATE.latitude, lng: INITIAL_VIEW_STATE.longitude },
        zoom: INITIAL_VIEW_STATE.zoom,
        mapId: MAP_ID, // mapIdを使用するため、stylesは不要
      });
      setMap(mapInstance);
      
      const overlayInstance = new GoogleMapsOverlay({ layers: [] });
      overlayInstance.setMap(mapInstance);
      setOverlay(overlayInstance);
    }
  }, [mapDivRef, map]);


  // Deck.glのレイヤー定義と更新
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
          radiusScale: 5000,
          radiusMinPixels: 2,
          getPosition: d => [d.Actor1Geo_Long, d.Actor1Geo_Lat],
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

      {/* UI Elements */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 1, background: 'rgba(255,255,255,0.8)', padding: '10px', borderRadius: '5px' }}>
        <button onClick={fetchData} disabled={loading}>
          {loading ? 'Loading Data...' : 'Reload Data'}
        </button>
        {error && <p style={{ color: 'red', margin: '5px 0 0' }}>{error}</p>}
      </div>

      {tooltip?.object && (
        <div style={{
          position: 'absolute',
          zIndex: 1,
          pointerEvents: 'none',
          left: tooltip.x,
          top: tooltip.y,
          background: 'black',
          color: 'white',
          padding: '5px',
          borderRadius: '3px',
          maxWidth: '300px',
        }}>
          {tooltip.object.SOURCEURL}
        </div>
      )}
    </div>
  );
}


// --- ページ全体 ---
export default function HomePage() {
  const render = (status) => {
    switch (status) {
      case Status.LOADING:
        return <div className="status-message">Loading Maps API...</div>;
      case Status.FAILURE:
        return <div className="status-message">Error loading Maps API.</div>;
      case Status.SUCCESS:
        return <MapComponent />;
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
