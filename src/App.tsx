import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import InstallsAnalysisPage from './pages/InstallsAnalysisPage';
import SizePerformancePage from './pages/SizePerformancePage';
import SearchComparePage from './pages/SearchComparePage';
import CategoriesPage from './pages/CategoriesPage';
import RatingsPage from './pages/RatingsPage';
import SentimentPage from './pages/SentimentPage';
import TrendsPage from './pages/TrendsPage';
import ContentRatingPage from './pages/ContentRatingPage';
import VersionExplorerPage from './pages/VersionExplorerPage';
import TopReviewsPage from './pages/TopReviewsPage';
import UpdateRecencyPage from './pages/UpdateRecencyPage';
import ComprehensiveReportPage from './pages/ComprehensiveReportPage';

function App() {
  return (
    <DataProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/ratings" element={<RatingsPage />} />
            <Route path="/sentiment" element={<SentimentPage />} />
            <Route path="/trends" element={<TrendsPage />} />
            <Route path="/installs" element={<InstallsAnalysisPage />} />
            <Route path="/size-performance" element={<SizePerformancePage />} />
            <Route path="/content-rating" element={<ContentRatingPage />} />
            <Route path="/version-explorer" element={<VersionExplorerPage />} />
            <Route path="/search-compare" element={<SearchComparePage />} />
            <Route path="/top-reviews" element={<TopReviewsPage />} />
            <Route path="/update-recency" element={<UpdateRecencyPage />} />
            <Route path="/report" element={<ComprehensiveReportPage />} />
          </Routes>
        </Layout>
      </Router>
    </DataProvider>
  );
}

export default App;