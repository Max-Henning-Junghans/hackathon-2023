import React from 'react';
import ReactDOM from 'react-dom/client';
import Main from './components/main';
import 'bootstrap/dist/css/bootstrap.min.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Main/>
    </React.StrictMode>
);