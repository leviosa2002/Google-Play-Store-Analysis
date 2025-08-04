import { PlayStoreApp, UserReview, ChartData } from '../types';

export const parseInstalls = (installs: string): number => {
  if (!installs) return 0;
  const cleaned = installs.replace(/[+,]/g, '');
  return parseInt(cleaned) || 0;
};

export const parseSize = (size: string): number => {
  if (!size || size === 'Varies with device') return 0;
  
  const sizeNum = parseFloat(size);
  if (size.includes('M')) return sizeNum;
  if (size.includes('k')) return sizeNum / 1000;
  if (size.includes('G')) return sizeNum * 1000;
  
  return sizeNum;
};

export const formatInstalls = (installs: number): string => {
  if (installs >= 1000000000) return `${(installs / 1000000000).toFixed(1)}B`;
  if (installs >= 1000000) return `${(installs / 1000000).toFixed(1)}M`;
  if (installs >= 1000) return `${(installs / 1000).toFixed(1)}K`;
  return installs.toString();
};

export const formatSize = (size: number): string => {
  if (size >= 1000) return `${(size / 1000).toFixed(1)}GB`;
  return `${size.toFixed(1)}MB`;
};

export const getCategoryDistribution = (apps: PlayStoreApp[]): ChartData[] => {
  const categoryCount = apps.reduce((acc, app) => {
    acc[app.Category] = (acc[app.Category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(categoryCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const getRatingDistribution = (apps: PlayStoreApp[]): ChartData[] => {
  const ratingBins = [
    { range: '1.0-1.5', min: 1.0, max: 1.5 },
    { range: '1.5-2.0', min: 1.5, max: 2.0 },
    { range: '2.0-2.5', min: 2.0, max: 2.5 },
    { range: '2.5-3.0', min: 2.5, max: 3.0 },
    { range: '3.0-3.5', min: 3.0, max: 3.5 },
    { range: '3.5-4.0', min: 3.5, max: 4.0 },
    { range: '4.0-4.5', min: 4.0, max: 4.5 },
    { range: '4.5-5.0', min: 4.5, max: 5.0 },
  ];

  return ratingBins.map(bin => ({
    name: bin.range,
    value: apps.filter(app => app.Rating >= bin.min && app.Rating < bin.max).length
  }));
};

export const getInstallsDistribution = (apps: PlayStoreApp[]): ChartData[] => {
  const installsBins = [
    { range: '0-1K', min: 0, max: 1000 },
    { range: '1K-10K', min: 1000, max: 10000 },
    { range: '10K-100K', min: 10000, max: 100000 },
    { range: '100K-1M', min: 100000, max: 1000000 },
    { range: '1M-10M', min: 1000000, max: 10000000 },
    { range: '10M-100M', min: 10000000, max: 100000000 },
    { range: '100M+', min: 100000000, max: Infinity },
  ];

  return installsBins.map(bin => ({
    name: bin.range,
    value: apps.filter(app => {
      const installs = parseInstalls(app.Installs);
      return installs >= bin.min && installs < bin.max;
    }).length
  }));
};

export const getSentimentDistribution = (reviews: UserReview[]): ChartData[] => {
  const sentimentCount = reviews.reduce((acc, review) => {
    acc[review.Sentiment] = (acc[review.Sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(sentimentCount)
    .map(([name, value]) => ({ name, value }));
};

export const getTopApps = (apps: PlayStoreApp[], sortBy: keyof PlayStoreApp, limit: number = 20): PlayStoreApp[] => {
  return [...apps]
    .filter(app => app[sortBy] !== undefined && app[sortBy] !== null)
    .sort((a, b) => {
      if (sortBy === 'Installs') {
        return parseInstalls(b.Installs) - parseInstalls(a.Installs);
      }
      if (typeof a[sortBy] === 'number' && typeof b[sortBy] === 'number') {
        return (b[sortBy] as number) - (a[sortBy] as number);
      }
      return 0;
    })
    .slice(0, limit);
};

export const getContentRatingDistribution = (apps: PlayStoreApp[]): ChartData[] => {
  const contentRatingCount = apps.reduce((acc, app) => {
    const rating = app['Content Rating'] || 'Unknown';
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(contentRatingCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const getAndroidVersionDistribution = (apps: PlayStoreApp[]): ChartData[] => {
  const versionCount = apps.reduce((acc, app) => {
    const version = app['Android Ver'] || 'Unknown';
    acc[version] = (acc[version] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(versionCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15); // Top 15 versions
};