import { useEffect, useState } from 'react';
import { Button, SafeAreaView, Text, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function PassengerHome() {
  const [pickup, setPickup] = useState('Av. Paulista, 1000');
  const [destination, setDestination] = useState('Rua Augusta, 200');
  const [html, setHtml] = useState('');
  const [routeMeta, setRouteMeta] = useState('');

  async function loadRoute() {
    const response = await fetch(`${API_URL}/maps/directions?pickupLat=-23.5614&pickupLng=-46.6559&destinationLat=-23.5558&destinationLng=-46.6621`);
    const data = await response.json();
    const geometry = data.geometry?.coordinates ?? [[-46.6559, -23.5614], [-46.6621, -23.5558]];
    setRouteMeta(`${data.provider} · ${data.distanceKm} km · ${data.durationMin} min`);
    setHtml(`<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" /><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>body,html,#map{margin:0;height:100%;background:#0f172a}.leaflet-container{background:#0f172a}</style></head><body><div id="map"></div><script>const coordinates=${JSON.stringify(geometry)}; const latLngs=coordinates.map(([lng,lat])=>[lat,lng]); const map=L.map('map',{zoomControl:true}).setView(latLngs[0] || [-23.559,-46.659], 13); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19, attribution:'&copy; OpenStreetMap contributors'}).addTo(map); const polyline=L.polyline(latLngs,{color:'#2563eb',weight:5}).addTo(map); if(latLngs[0]) L.marker(latLngs[0]).addTo(map); if(latLngs[latLngs.length-1]) L.marker(latLngs[latLngs.length-1]).addTo(map); if(latLngs.length>1){ map.fitBounds(polyline.getBounds(), {padding:[24,24]}); }</script></body></html>`);
  }

  useEffect(() => { loadRoute().catch(() => null); }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#030712', padding: 16, gap: 12 }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>NaRotta Passageiro</Text>
      <TextInput value={pickup} onChangeText={setPickup} placeholder="Origem" placeholderTextColor="#94a3b8" style={{ backgroundColor: '#111827', color: '#fff', padding: 14, borderRadius: 12 }} />
      <TextInput value={destination} onChangeText={setDestination} placeholder="Destino" placeholderTextColor="#94a3b8" style={{ backgroundColor: '#111827', color: '#fff', padding: 14, borderRadius: 12 }} />
      <View style={{ height: 320, overflow: 'hidden', borderRadius: 16 }}>
        <WebView originWhitelist={["*"]} source={{ html }} />
      </View>
      <Button title="Atualizar rota" onPress={() => { loadRoute().catch(() => null); }} />
      <Text style={{ color: '#94a3b8' }}>{routeMeta || 'Mapa pronto para rota real.'}</Text>
    </SafeAreaView>
  );
}
