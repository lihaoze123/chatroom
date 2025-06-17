import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import './index.css';
import App from './App';
import { StagewiseToolbar } from '@stagewise/toolbar-react';
import reportWebVitals from './reportWebVitals';

// Render the main app
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize toolbar separately
const toolbarConfig = {
  plugins: [], // Add your custom plugins here
};

document.addEventListener('DOMContentLoaded', () => {
  const toolbarRoot = document.createElement('div');
  toolbarRoot.id = 'stagewise-toolbar-root'; // Ensure a unique ID
  document.body.appendChild(toolbarRoot);

  ReactDOM.createRoot(toolbarRoot).render(
    <React.StrictMode>
      <StagewiseToolbar config={toolbarConfig} />
    </React.StrictMode>
  );
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
