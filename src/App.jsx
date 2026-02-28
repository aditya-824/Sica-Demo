import sicaLogo from './assets/sica-logo.png';
import './App.css'

function App() {
  return (
    <main>
      <div id="control-panel">
        <img src={sicaLogo} alt="Sica Logo" id="sica-logo" />
        <div id="categories"></div>
      </div>
    </main>
  )
}

export default App
