# App Store Data Analysis Dashboard

## Table of Contents

-   [About the Project](#about-the-project)
-   [Features](#features)
-   [Technologies Used](#technologies-used)
-   [Getting Started](#getting-started)
    -   [Prerequisites](#prerequisites)
    -   [Installation](#installation)
    -   [Running the Application](#running-the-application)
-   [Data Source](#data-source)
-   [Project Structure](#project-structure)
-   [Contributing](#contributing)
-   [License](#license)

## About the Project

This project is a dynamic and interactive dashboard designed for analyzing app store data. It provides a comprehensive view of various metrics, trends, and insights related to mobile applications, allowing users to filter, visualize, and explore data efficiently. From understanding app update patterns to categorizing app performance and identifying stale but popular apps, this dashboard serves as a powerful tool for market research, competitive analysis, and strategic decision-making.

## Features

The dashboard offers a rich set of features for data exploration and visualization:

* **Interactive Dashboard Overview:**
    * **Key Statistics:** At-a-glance stats like total apps with update data, recent update activity percentage, peak update year, and total updates in that year.
    * **Dynamic Data Filtering:** A robust sidebar filter system to narrow down data based on:
        * **Rating Range:** Filter apps by their average user rating.
        * **App Type:** Distinguish between 'Free' and 'Paid' applications.
        * **Sentiment:** Analyze apps based on 'Positive', 'Neutral', or 'Negative' sentiment (derived from reviews/data).
        * **Recently Updated:** Focus on apps updated within the last 6 months.
        * **Categories:** Select one or more app categories for focused analysis.
        * **Content Rating:** Filter by content appropriateness (e.g., 'Everyone', 'Teen').
        * **Installs Range:** Filter by total installation count.
    * **Scrollable Filter Sections:** Both the "Categories" and "Content Rating" filter lists automatically scroll when they contain many options, preventing the sidebar from becoming excessively long.
    * **Overall Sidebar Scroll:** The entire filter sidebar itself is height-constrained and becomes scrollable if its total content exceeds the screen height, ensuring the main dashboard content remains visible.
    * **Clear Filters:** A convenient button to reset all applied filters.

* **Advanced Data Visualizations:**
    * **App Updates by Year (Bar Chart):** Visualizes the number of app updates occurring each year, identifying development activity trends.
    * **Monthly Update Trends (Bar Chart):** Focuses on recent update patterns over the last 24 months, highlighting short-term development activity.
    * **Average Rating Trends Over Time (Scatter Plot):** Tracks how average app ratings have evolved across different years, revealing shifts in user satisfaction or quality over time.
    * **Category Performance (Bar Chart):** Displays the average engagement rate for the top 10 categories, offering insights into user interaction across different app types.
    * **Category Distribution (Pie Chart):** Provides a proportional breakdown of apps across different categories.
    * **Content Rating Distribution (Pie Chart):** Shows the distribution of apps by their content rating.

* **Detailed Data Tables:**
    * **High-Rated Apps Not Updated Recently:** A dedicated table highlighting apps with a 4.0+ rating that haven't been updated in over 2 years, indicating potential areas for re-engagement or acquisition. Includes rich app details and a rank column.
    * **Top Apps in Category:** A dynamically sortable and filterable table displaying leading apps within a selected category. Features include:
        * **Rank Column:** Visual representation of an app's rank within the sorted list.
        * **Rich App Details:** Enhanced rendering for "App Name" (with icon and genre), "Rating" (color-coded), "Installs", "Reviews", "Price", "Size", and "Content Rating".
        * **Sorting Controls:** Buttons to sort by Installs, Rating, Reviews, or Engagement.

* **Insights & Recommendations:**
    * Dedicated cards providing concise, actionable insights derived from the data, such as recent update activity, peak update years, and opportunities for improvement.

## Technologies Used

This project is built using modern web development technologies:

* **React.js:** A JavaScript library for building user interfaces.
* **TypeScript:** A superset of JavaScript that adds static typing.
* **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
* **Recharts:** A composable charting library built on React components.
* **Lucide-React:** A collection of beautiful and customizable open-source icons.
* **React Context API:** For efficient global state management across components (e.g., filters, app data).

## Getting Started

Follow these steps to get the App Store Data Analysis Dashboard up and running on your local machine.

### Prerequisites

Make sure you have the following installed:

* [Node.js](https://nodejs.org/en/) (LTS version recommended)
* [npm](https://www.npmjs.com/) (comes with Node.js) or [Yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/leviosa2002/Google-Play-Store-Analysis
    cd app-store-dashboard
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

### Running the Application

1.  **Place your data file:**
    Ensure your `googleplaystore.csv` file (or whatever your main data source CSV is named) is located in the `public` folder of your project. The application expects to fetch this CSV from that location.

2.  **Start the development server:**
    ```bash
    npm start
    # or
    yarn start
    ```

    This will start the application in development mode. Open your browser and navigate to `http://localhost:3000` (or whatever address is shown in your console). The page will reload if you make edits.

## Data Source

The dashboard relies on a CSV file containing app store data.
* The application expects a CSV file named `googleplaystore.csv` (based on typical datasets for this type of analysis).
* This file should be placed in the `public/` directory of the project, as the data context fetches it directly from there.

Ensure your CSV has columns that align with the data processing logic (e.g., 'App', 'Category', 'Rating', 'Installs', 'Reviews', 'Last Updated', 'Price', 'Size', 'Content Rating', 'Genres').

## Project Structure

A high-level overview of the project's key directories and files:

.
├── public/                 # Static assets, including your data.csv
│   └── googleplaystore.csv # Your main app data file
├── src/
│   ├── assets/             # Images, fonts, etc.
│   ├── components/
│   │   ├── charts/         # Reusable chart components (BarChart, PieChart, ScatterPlot)
│   │   └──                 # Other reusable UI components (DataTable, StatsCard, InsightsCard, etc.)
│   ├── context/
│   │   └── DataContext.tsx # React Context for global app data and filters
│   ├── hooks/              # Custom React hooks (if any)
│   ├── pages/
│   │   ├── DashboardPage.tsx # Main dashboard view
│   │   ├── TrendsPage.tsx    # Dedicated trends analysis view
│   │   └── ...
│   ├── utils/              # Utility functions (e.g., data transformers, formatters)
│   ├── App.tsx             # Main application component
│   ├── index.tsx           # Entry point
│   ├── types.ts            # TypeScript type definitions
│   └── ...
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Project dependencies and scripts
└── README.md               # This file


## Contributing

Contributions are welcome! If you have suggestions for improvements, bug fixes, or new features, please open an issue or submit a pull request.

## License

[MIT License](https://opensource.org/licenses/MIT) (or choose your preferred license)