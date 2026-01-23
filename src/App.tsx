import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { StreamPage } from '@/pages/StreamPage';
import { HelpPage } from '@/pages/HelpPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { AdminLiveSessionPage } from '@/pages/AdminLiveSessionPage';
import { PreviewPage } from '@/pages/PreviewPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/s/:uuid" element={<StreamPage />} />
        <Route path="/help" element={<HelpPage />} />
        {/* Preview route for testing */}
        <Route path="/preview/:sessionId" element={<PreviewPage />} />
        {/* Admin routes */}
        <Route path="/a/:id" element={<AdminLiveSessionPage />} />
        <Route path="/a/:id/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/events/:id/analytics" element={<AnalyticsPage />} />
        {/* 404 fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-xl text-neutral-400 mb-8">Page not found</p>
        <a
          href="/"
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to Home
        </a>
      </div>
    </div>
  );
}

export default App;