# ForecastLab 🔮

A modern web application for time series forecasting with **counterfactual scenario modeling**. Upload your data, run forecasts, model "what-if" events, and evaluate model performance—all through an intuitive interface.

Built with FastAPI, React, and Docker Compose.

[![CI](https://github.com/yourusername/forecastlab/workflows/CI/badge.svg)](https://github.com/yourusername/forecastlab/actions)

##Features

- **Time Series Forecasting**: Seasonal Naive and SARIMAX models with prediction intervals
- **Counterfactual Scenarios**: Model promotional events, price changes, and other interventions
- **Model Diagnostics**: Residual analysis, ACF, and automatic changepoint detection
- **Backtesting**: Rolling window validation with MAE, RMSE, MAPE metrics
- **Dataset Management**: Upload CSV files or load sample data instantly
- **Interactive Visualization**: Beautiful charts with Recharts

## Quickstart

```bash
# Clone the repository
git clone https://github.com/yourusername/forecastlab.git
cd forecastlab

# Start with Docker Compose
docker compose up --build

# Open in browser
open http://localhost:3000
```

The app will be run with sample data preloaded.

## Demo Walkthrough

### 1. Load Sample Data
- Click **"Load Sample Data"** button
- View dataset summary (365 days of sales data with trend and seasonality)

### 2. Run Baseline Forecast
- Select model: **Seasonal Naive** or **SARIMAX**
- Set horizon: **30 days**
- Click **"Run Baseline Forecast"**
- View forecast with 80% and 95% confidence intervals

### 3. Add Promotional Scenario
- Scroll to **"Counterfactual Scenarios"**
- Click **"Create New Scenario"**
- Add event:
  - Name: "Black Friday Sale"
  - Dates: 2024-02-01 to 2024-02-14
  - Type: Multiplicative
  - Value: 25 (for +25% uplift)
- Click **"Run Scenario Analysis"**
- Compare baseline vs scenario forecasts
- Review impact metrics

### 4. View Diagnostics
- Click **"📊 View Diagnostics"**
- Examine:
  - Residual plot (should center around 0)
  - ACF chart (autocorrelation decay)
  - Detected changepoints (structural breaks)

## Architecture

```
forecastlab/
├── backend/              # FastAPI service
│   ├── app/
│   │   ├── main.py              # API endpoints
│   │   ├── forecasting.py       # Models (Seasonal Naive, SARIMAX)
│   │   ├── scenario_manager.py  # Counterfactual scenarios
│   │   ├── diagnostics.py       # Residual analysis, ACF, changepoints
│   │   └── dataset_manager.py   # CSV validation & storage
│   ├── scripts/
│   │   └── generate_sample_data.py  # Sample data generator
│   └── tests/
│       └── test_api.py          # API tests
├── frontend/             # React + Vite
│   └── src/
│       ├── App.jsx              # Main UI component
│       └── App.css              # Styling
└── docker-compose.yml    # Orchestration
```

## Testing

### Backend Tests
```bash
cd backend
pip install -r requirements.txt -r requirements-test.txt
python scripts/generate_sample_data.py
pytest tests/ -v
```

### Frontend Build
```bash
cd frontend
npm install
npm run build
```

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/datasets/upload` | POST | Upload CSV dataset |
| `/api/datasets/load-sample` | POST | Load pre-generated sample data |
| `/api/datasets/{id}/summary` | GET | Get dataset statistics |
| `/api/datasets/{id}/diagnostics` | GET | Get model diagnostics |
| `/api/forecast/run` | POST | Generate forecast |
| `/api/forecast/backtest` | POST | Validate model accuracy |
| `/api/scenarios/create` | POST | Create scenario |
| `/api/scenarios/{id}/events` | POST | Add event to scenario |
| `/api/scenarios/{id}/run` | POST | Run scenario comparison |

## Tech Stack

- **Backend**: FastAPI, Pandas, Statsmodels, NumPy, scikit-learn
- **Frontend**: React, Vite, Recharts
- **Forecasting**: SARIMAX, Seasonal Naive baseline
- **Infrastructure**: Docker, Docker Compose
- **Testing**: pytest, GitHub Actions CI

## CSV Format

Upload CSVs with these columns:

```csv
timestamp,y
2024-01-01,100
2024-01-02,105
2024-01-03,110
```

- **timestamp**: ISO date or common formats
- **y**: Numeric target values

Optional columns like `x_promo` are supported for future enhancements.

## Use Cases

- **Retail**: Model Black Friday, holiday sales, clearance events
- **Marketing**: Estimate campaign ROI, promotional effectiveness
- **Finance**: Budget scenarios, revenue forecasting
- **Operations**: Capacity planning for peak periods
- **Supply Chain**: Demand forecasting with known events

Feel free to contribute.

