import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { applyDocument } from '@/lib/store';

applyDocument();
createRoot(document.getElementById('root')!).render(<App />);
