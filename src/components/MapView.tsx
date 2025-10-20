import React, { useEffect, useRef } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { fromLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Stroke, Fill } from 'ol/style';
import GeoJSON from 'ol/format/GeoJSON';
import { getWFSData } from '../utils/wfs';

const WMS_URL = import.meta.env.VITE_WMS_URL;
const WFS_URL = import.meta.env.VITE_WFS_URL;
const LAYER_NAME = import.meta.env.VITE_WFS_TYPENAME;
const WMS_LAYERS = import.meta.env.VITE_WMS_LAYERS;

const MapView: React.FC = () => {
  const mapDiv = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapDiv.current) return;

    const wmsLayer = new TileLayer({
      source: new TileWMS({
        url: WMS_URL!,
        params: { LAYERS: WMS_LAYERS, TILED: true },
        crossOrigin: 'anonymous'
      })
    });

    const highlightSrc = new VectorSource();
    const highlightLayer = new VectorLayer({
      source: highlightSrc,
      style: new Style({
        stroke: new Stroke({ color: '#ff0000', width: 2 }),
        fill: new Fill({ color: 'rgba(255,0,0,0.15)' })
      })
    });

    const popupEl = document.createElement('div');
    popupEl.className = 'popup';
    popupRef.current = popupEl;

    const overlay = new Overlay({
      element: popupEl,
      offset: [0, -10],
      positioning: 'bottom-center'
    });

    const map = new Map({
      target: mapDiv.current,
      layers: [wmsLayer, highlightLayer],
      overlays: [overlay],
      view: new View({
        center: fromLonLat([37.6173, 55.7558]), 
        zoom: 12
      })
    });

    map.on('singleclick', async (evt) => {
      const coord = evt.coordinate;
      popupEl.innerHTML = 'Загрузка...';
      overlay.setPosition(coord);

      try {
        const res = map.getView().getResolution() ?? 1;
        const delta = res * 5;
        const [x, y] = coord;
        const bbox = [x - delta, y - delta, x + delta, y + delta];

        const data = await getWFSData({
          url: WFS_URL!,
          typeName: LAYER_NAME!,
          bbox
        });

        highlightSrc.clear();

        if (data.features?.length) {
          const format = new GeoJSON();
          const feats = format.readFeatures(data, {
            featureProjection: 'EPSG:3857'
          });

          highlightSrc.addFeatures(feats);

          const props = feats[0].getProperties();
          delete props.geometry;

          popupEl.innerHTML = `
            <b>Атрибуты:</b>
            <pre style="font-size:12px">${JSON.stringify(props, null, 2)}</pre>
          `;
        } else {
          popupEl.innerHTML = 'Ничего не найдено';
        }
      } catch (e) {
        console.log('Ошибка запроса WFS:', e);
        popupEl.innerHTML = 'Ошибка загрузки данных';
      }
    });

    return () => map.setTarget(undefined);
  }, []);

  return <div ref={mapDiv} style={{ width: '100%', height: '100%' }} />;
};

export default MapView;
