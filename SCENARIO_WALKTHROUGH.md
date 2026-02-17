## Try a Promo Event Scenario

This walkthrough demonstrates ForecastLab's defining feature: counterfactual scenario modeling.

### Scenario: Holiday Promotion Impact

**Goal**: Model a 25% sales increase during a 2-week holiday promotion and compare against baseline forecast.

### Step-by-Step (UI)

1. **Start services**: `docker compose up --build`
2. **Open browser**: `http://localhost:3000`
3. **Upload dataset**: Use the sample `sales_data.csv` from earlier
4. **Run baseline forecast**:
   - Model: Seasonal Naive or SARIMAX
   - Horizon: 30 days
   - Click "Run Baseline Forecast"
5. **Create scenario**:
   - Scroll to "Counterfactual Scenarios" section
   - Enter scenario name: "Holiday Promo"
   - Click "Create New Scenario"
6. **Add promotion event**:
   - Event name: "Black Friday Sale"
   - Start date: 2024-02-01
   - End date: 2024-02-14
   - Effect type: Multiplicative (%)
   - Effect value: 25 (for +25%)
   - Click "Add Event"
7. **Run scenario analysis**:
   - Click "🚀 Run Scenario Analysis"
   - View comparison chart showing:
     - Blue line: Historical data
     - Green dashed line: Baseline forecast
     - Orange line: Scenario forecast (with promo)
     - Shaded area: Confidence intervals
8. **Review impact summary**:
   - Average Uplift: Average daily increase
   - Total Uplift: Cumulative increase over horizon
   - Uplift %: Percentage increase vs baseline
   - Max Change Date: Day with largest impact

### Using curl

```bash
# 1. Upload dataset
RESPONSE=$(curl -s -X POST http://localhost:8000/api/datasets/upload \
  -F "file=@sales_data.csv")
DATASET_ID=$(echo $RESPONSE | grep -o '"dataset_id":"[^"]*' | cut -d'"' -f4)

# 2. Create scenario
SCENARIO_RESPONSE=$(curl -s -X POST http://localhost:8000/api/scenarios/create \
  -H "Content-Type: application/json" \
  -d "{\"dataset_id\": \"$DATASET_ID\", \"name\": \"Holiday Promo\"}")
SCENARIO_ID=$(echo $SCENARIO_RESPONSE | grep -o '"scenario_id":"[^"]*' | cut -d'"' -f4)

# 3. Add event
curl -X POST http://localhost:8000/api/scenarios/$SCENARIO_ID/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Black Friday Sale",
    "start_date": "2024-02-01",
    "end_date": "2024-02-14",
    "effect_type": "multiplicative",
    "effect_value": 25,
    "apply_to": "y"
  }'

# 4. Run scenario
curl -X POST http://localhost:8000/api/scenarios/$SCENARIO_ID/run \
  -H "Content-Type: application/json" \
  -d '{
    "model_type": "seasonal_naive",
    "horizon": 30,
    "interval_levels": [80, 95]
  }' | jq
```

### Example Use Cases

- **Retail**: Model Black Friday, holiday sales, clearance events
- **Marketing**: Estimate campaign impact, promo effectiveness
- **Operations**: Plan for capacity during peak periods
- **Finance**: Budget scenarios, revenue forecasting with events
- **Supply Chain**: Demand planning with known future events

