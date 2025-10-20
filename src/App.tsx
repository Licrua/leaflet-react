import MapView from './components/MapView';

export default function App() {
  return (
    <div style={{height: '100vh', display: 'flex', flexDirection: 'column'}}>
      <header style={{padding: '8px', background: '#0d47a1', color: '#fff'}}>WMS WFS Demo</header>
      <main style={{flex: 1}}>
        <MapView />
      </main>
    </div>
  );
}
