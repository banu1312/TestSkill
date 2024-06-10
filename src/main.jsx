/* eslint-disable import/no-extraneous-dependencies */
import { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import 'react-date-range/dist/styles.css';
import { BrowserRouter } from 'react-router-dom';
import 'react-date-range/dist/theme/default.css';
import { HelmetProvider } from 'react-helmet-async';

import App from './app';

// ----------------------------------------------------------------------

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <HelmetProvider>
    <BrowserRouter>
      <Suspense>
        <App />
      </Suspense>
    </BrowserRouter>
  </HelmetProvider>
);
