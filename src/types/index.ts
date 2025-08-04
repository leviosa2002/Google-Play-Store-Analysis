export interface PlayStoreApp {
  App: string;
  Category: string;
  Rating: number;
  Reviews: number;
  Size: string;
  Installs: string;
  Type: string;
  Price: string;
  'Content Rating': string;
  Genres: string;
  'Last Updated': string;
  'Current Ver': string;
  'Android Ver': string;
}

export interface UserReview {
  App: string;
  Translated_Review: string;
  Sentiment: string;
  Sentiment_Polarity: number;
  Sentiment_Subjectivity: number;
}

export interface FilterState {
  categories: string[];
  ratingRange: [number, number];
  sentiment: string[];
  appType: string[];
  installsRange: [number, number];
  contentRating: string[];
  recentlyUpdated: boolean;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}