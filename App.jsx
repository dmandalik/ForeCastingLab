import { useState } from 'react'
import {
    LineChart,
    Line,
    Area,
    ComposedChart,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts'
import './App.css'

function App() {
    const [response, setResponse] = useState('')
    const [loading, setLoading] = useState(false)
    const [uploadResult, setUploadResult] = useState(null)
    const [summary, setSummary] = useState(null)

    // Forecast state
    const [currentDatasetId, setCurrentDatasetId] = useState(null)
    const [modelType, setModelType] = useState('seasonal_naive')
    const [horizon, setHorizon] = useState(30)
    const [forecastResult, setForecastResult] = useState(null)
    const [backtestResult, setBacktestResult] = useState(null)

    // Scenario state
    const [currentScenarioId, setCurrentScenarioId] = useState(null)
    const [scenarioName, setScenarioName] = useState('')
    const [events, setEvents] = useState([])
    const [scenarioResult, setScenarioResult] = useState(null)

    // Diagnostics state
    const [diagnostics, setDiagnostics] = useState(null)
    const [activeTab, setActiveTab] = useState('forecast') // 'forecast' or 'diagnostics'

    // Event form state
    const [eventName, setEventName] = useState('')
    const [eventStartDate, setEventStartDate] = useState('')
    const [eventEndDate, setEventEndDate] = useState('')
    const [eventType, setEventType] = useState('multiplicative')
    const [eventValue, setEventValue] = useState(20)

    const handleFileUpload = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        setLoading(true)
        setUploadResult(null)
        setSummary(null)
        setForecastResult(null)
        setBacktestResult(null)
        setScenarioResult(null)
        setDiagnostics(null)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('http://localhost:8000/api/datasets/upload', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.detail || 'Upload failed')
            }

            const data = await res.json()
            setUploadResult(data)
            setCurrentDatasetId(data.dataset_id)

            const summaryRes = await fetch(`http://localhost:8000/api/datasets/${data.dataset_id}/summary`)
            const summaryData = await summaryRes.json()
            setSummary(summaryData)
        } catch (error) {
            setResponse(`Upload Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const runForecast = async () => {
        if (!currentDatasetId) {
            setResponse('Please upload a dataset first')
            return
        }

        setLoading(true)
        setForecastResult(null)

        try {
            const res = await fetch('http://localhost:8000/api/forecast/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dataset_id: currentDatasetId,
                    model_type: modelType,
                    horizon: parseInt(horizon),
                    interval_levels: [80, 95]
                })
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.detail || 'Forecast failed')
            }

            const data = await res.json()
            setForecastResult(data)
        } catch (error) {
            setResponse(`Forecast Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const runBacktest = async () => {
        if (!currentDatasetId) {
            setResponse('Please upload a dataset first')
            return
        }

        setLoading(true)
        setBacktestResult(null)

        try {
            const res = await fetch('http://localhost:8000/api/forecast/backtest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dataset_id: currentDatasetId,
                    model_type: modelType,
                    horizon: parseInt(horizon),
                    n_splits: 5
                })
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.detail || 'Backtest failed')
            }

            const data = await res.json()
            setBacktestResult(data)
        } catch (error) {
            setResponse(`Backtest Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const loadDiagnostics = async () => {
        if (!currentDatasetId) {
            setResponse('Please upload a dataset first')
            return
        }

        setLoading(true)
        setDiagnostics(null)

        try {
            const res = await fetch(
                `http://localhost:8000/api/datasets/${currentDatasetId}/diagnostics?model_type=${modelType}`
            )

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.detail || 'Diagnostics failed')
            }

            const data = await res.json()
            setDiagnostics(data)
            setActiveTab('diagnostics')
        } catch (error) {
            setResponse(`Diagnostics Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const createScenario = async () => {
        if (!currentDatasetId) {
            setResponse('Please upload a dataset first')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('http://localhost:8000/api/scenarios/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dataset_id: currentDatasetId,
                    name: scenarioName || 'My Scenario'
                })
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.detail || 'Scenario creation failed')
            }

            const data = await res.json()
            setCurrentScenarioId(data.scenario_id)
            setEvents([])
            setResponse(`Scenario created: ${data.scenario_id}`)
        } catch (error) {
            setResponse(`Scenario Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const addEvent = async () => {
        if (!currentScenarioId) {
            setResponse('Please create a scenario first')
            return
        }

        if (!eventName || !eventStartDate || !eventEndDate) {
            setResponse('Please fill in all event fields')
            return
        }

        setLoading(true)

        try {
            const res = await fetch(`http://localhost:8000/api/scenarios/${currentScenarioId}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: eventName,
                    start_date: eventStartDate,
                    end_date: eventEndDate,
                    effect_type: eventType,
                    effect_value: parseFloat(eventValue),
                    apply_to: 'y'
                })
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.detail || 'Add event failed')
            }

            const data = await res.json()
            setEvents(data.events)

            setEventName('')
            setEventStartDate('')
            setEventEndDate('')
            setEventValue(20)
        } catch (error) {
            setResponse(`Event Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const removeEvent = async (eventName) => {
        setLoading(true)

        try {
            const res = await fetch(`http://localhost:8000/api/scenarios/${currentScenarioId}/events/${eventName}`, {
                method: 'DELETE'
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.detail || 'Remove event failed')
            }

            const data = await res.json()
            setEvents(data.events)
        } catch (error) {
            setResponse(`Event Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const runScenario = async () => {
        if (!currentScenarioId) {
            setResponse('Please create a scenario first')
            return
        }

        setLoading(true)
        setScenarioResult(null)

        try {
            const res = await fetch(`http://localhost:8000/api/scenarios/${currentScenarioId}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_type: modelType,
                    horizon: parseInt(horizon),
                    interval_levels: [80, 95]
                })
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.detail || 'Scenario run failed')
            }

            const data = await res.json()
            setScenarioResult(data)
        } catch (error) {
            setResponse(`Scenario Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const getChartData = () => {
        if (!forecastResult) return []

        const historical = forecastResult.historical.map(d => ({
            timestamp: new Date(d.timestamp).getTime(),
            actual: d.y,
            type: 'historical'
        }))

        const forecast = forecastResult.forecast.map((d, idx) => ({
            timestamp: new Date(d.timestamp).getTime(),
            forecast: d.forecast,
            lower_80: forecastResult.intervals[idx].lower_80,
            upper_80: forecastResult.intervals[idx].upper_80,
            lower_95: forecastResult.intervals[idx].lower_95,
            upper_95: forecastResult.intervals[idx].upper_95,
            type: 'forecast'
        }))

        return [...historical, ...forecast]
    }

    const getScenarioChartData = () => {
        if (!scenarioResult) return []

        const historical = scenarioResult.historical.map(d => ({
            timestamp: new Date(d.timestamp).getTime(),
            actual: d.y
        }))

        const combined = scenarioResult.baseline_forecast.map((d, idx) => ({
            timestamp: new Date(d.timestamp).getTime(),
            baseline: d.forecast,
            scenario: scenarioResult.scenario_forecast[idx].forecast,
            lower_80: scenarioResult.intervals[idx].lower_80,
            upper_80: scenarioResult.intervals[idx].upper_80
        }))

        return [...historical, ...combined]
    }

    const getHistoricalWithChangepoints = () => {
        if (!diagnostics || !forecastResult) return []

        return forecastResult.historical.map(d => {
            const cp = diagnostics.changepoints.find(
                c => c.timestamp === d.timestamp
            )
            return {
                timestamp: new Date(d.timestamp).getTime(),
                value: d.y,
                isChangepoint: !!cp
            }
        })
    }

    const chartData = getChartData()
    const scenarioChartData = getScenarioChartData()
    const historicalWithCp = getHistoricalWithChangepoints()

    return (
        <div className="App">
            <h1>🔮 ForecastLab</h1>

            <div className="card">
                <h2>Upload Dataset</h2>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={loading}
                />

                {uploadResult && (
                    <div className="upload-result">
                        <h3>✓ Upload Successful</h3>
                        <p><strong>Dataset ID:</strong> {uploadResult.dataset_id}</p>
                        <p><strong>Rows:</strong> {uploadResult.rows}</p>
                        <p><strong>Frequency:</strong> {uploadResult.inferred_frequency}</p>
                    </div>
                )}

                {summary && (
                    <div className="summary">
                        <h3>Dataset Summary</h3>
                        <p><strong>Total Rows:</strong> {summary.row_count}</p>
                        <p><strong>Date Range:</strong> {summary.date_range.start.split('T')[0]} to {summary.date_range.end.split('T')[0]}</p>
                    </div>
                )}
            </div>

            {currentDatasetId && (
                <>
                    <div className="card">
                        <h2>Forecast Configuration</h2>
                        <div className="forecast-controls">
                            <div className="control-group">
                                <label>Model:</label>
                                <select
                                    value={modelType}
                                    onChange={(e) => setModelType(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="seasonal_naive">Seasonal Naive</option>
                                    <option value="sarimax">SARIMAX</option>
                                </select>
                            </div>

                            <div className="control-group">
                                <label>Horizon:</label>
                                <input
                                    type="number"
                                    value={horizon}
                                    onChange={(e) => setHorizon(e.target.value)}
                                    min="1"
                                    max="365"
                                    disabled={loading}
                                />
                            </div>

                            <div className="button-group">
                                <button onClick={runForecast} disabled={loading}>
                                    Run Baseline Forecast
                                </button>
                                <button onClick={runBacktest} disabled={loading}>
                                    Run Backtest
                                </button>
                                <button onClick={loadDiagnostics} disabled={loading}>
                                    📊 View Diagnostics
                                </button>
                            </div>
                        </div>
                    </div>

                    {activeTab === 'forecast' && forecastResult && (
                        <>
                            <div className="card">
                                <h2>Baseline Forecast</h2>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height={400}>
                                        <ComposedChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="timestamp"
                                                type="number"
                                                domain={['dataMin', 'dataMax']}
                                                tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                labelFormatter={(ts) => new Date(ts).toLocaleDateString()}
                                                formatter={(value) => value?.toFixed(2)}
                                            />
                                            <Legend />

                                            <Area type="monotone" dataKey="upper_80" stroke="none" fill="#646cff" fillOpacity={0.2} />
                                            <Area type="monotone" dataKey="lower_80" stroke="none" fill="#ffffff" fillOpacity={1} />

                                            <Line type="monotone" dataKey="actual" stroke="#8884d8" strokeWidth={2} dot={false} name="Historical" />
                                            <Line type="monotone" dataKey="forecast" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Forecast" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {backtestResult && (
                                <div className="card">
                                    <h2>Backtest Results</h2>
                                    <table className="metrics-table">
                                        <thead>
                                            <tr>
                                                <th>Metric</th>
                                                <th>Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>MAE</td>
                                                <td>{backtestResult.mae?.toFixed(4) || 'N/A'}</td>
                                            </tr>
                                            <tr>
                                                <td>RMSE</td>
                                                <td>{backtestResult.rmse?.toFixed(4) || 'N/A'}</td>
                                            </tr>
                                            <tr>
                                                <td>MAPE (%)</td>
                                                <td>{backtestResult.mape?.toFixed(2) || 'N/A'}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'diagnostics' && diagnostics && (
                        <>
                            <div className="card">
                                <div className="tab-header">
                                    <h2>📊 Model Diagnostics</h2>
                                    <button onClick={() => setActiveTab('forecast')} className="tab-switch-btn">
                                        ← Back to Forecast
                                    </button>
                                </div>

                                <div className="diagnostics-summary">
                                    <div className="diag-stat">
                                        <span className="stat-label">Residual Mean:</span>
                                        <span className="stat-value">{diagnostics.residuals.mean.toFixed(4)}</span>
                                    </div>
                                    <div className="diag-stat">
                                        <span className="stat-label">Residual Std:</span>
                                        <span className="stat-value">{diagnostics.residuals.std.toFixed(4)}</span>
                                    </div>
                                    <div className="diag-stat">
                                        <span className="stat-label">Changepoints:</span>
                                        <span className="stat-value">{diagnostics.changepoints.length}</span>
                                    </div>
                                </div>

                                <h3>Residual Plot</h3>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={diagnostics.residuals.series}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="timestamp"
                                                tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                labelFormatter={(ts) => new Date(ts).toLocaleDateString()}
                                                formatter={(value) => value?.toFixed(4)}
                                            />
                                            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                                            <Line type="monotone" dataKey="residual" stroke="#ff7c43" strokeWidth={2} dot={false} name="Residuals" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                <h3>Autocorrelation Function (ACF)</h3>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={diagnostics.residuals.acf}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="lag" />
                                            <YAxis domain={[-1, 1]} />
                                            <Tooltip formatter={(value) => value?.toFixed(3)} />
                                            <ReferenceLine y={0} stroke="#666" />
                                            <Bar dataKey="value" fill="#646cff" name="ACF" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {diagnostics.changepoints.length > 0 && (
                                    <>
                                        <h3>Detected Changepoints</h3>
                                        <div className="chart-container">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={historicalWithCp}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis
                                                        dataKey="timestamp"
                                                        type="number"
                                                        domain={['dataMin', 'dataMax']}
                                                        tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
                                                    />
                                                    <YAxis />
                                                    <Tooltip
                                                        labelFormatter={(ts) => new Date(ts).toLocaleDateString()}
                                                        formatter={(value) => value?.toFixed(2)}
                                                    />
                                                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={(props) => {
                                                        const { cx, cy, payload } = props
                                                        if (payload.isChangepoint) {
                                                            return <circle cx={cx} cy={cy} r={6} fill="#ff4444" stroke="#fff" strokeWidth={2} />
                                                        }
                                                        return null
                                                    }} name="Historical" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <div className="changepoints-list">
                                            <h4>Changepoint Details</h4>
                                            {diagnostics.changepoints.map((cp, idx) => (
                                                <div key={idx} className="changepoint-item">
                                                    <span><strong>Date:</strong> {cp.timestamp.split('T')[0]}</span>
                                                    <span><strong>Magnitude:</strong> {cp.magnitude.toFixed(2)}</span>
                                                    <span><strong>Value:</strong> {cp.value.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    <div className="card scenario-card">
                        <h2>🎯 Counterfactual Scenarios</h2>

                        {!currentScenarioId ? (
                            <div className="scenario-create">
                                <input
                                    type="text"
                                    placeholder="Scenario name (optional)"
                                    value={scenarioName}
                                    onChange={(e) => setScenarioName(e.target.value)}
                                    disabled={loading}
                                />
                                <button onClick={createScenario} disabled={loading}>
                                    Create New Scenario
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="event-form">
                                    <h3>Add Event</h3>
                                    <div className="form-grid">
                                        <input
                                            type="text"
                                            placeholder="Event name (e.g., 'Holiday Promo')"
                                            value={eventName}
                                            onChange={(e) => setEventName(e.target.value)}
                                            disabled={loading}
                                        />
                                        <input
                                            type="date"
                                            value={eventStartDate}
                                            onChange={(e) => setEventStartDate(e.target.value)}
                                            disabled={loading}
                                        />
                                        <input
                                            type="date"
                                            value={eventEndDate}
                                            onChange={(e) => setEventEndDate(e.target.value)}
                                            disabled={loading}
                                        />
                                        <select
                                            value={eventType}
                                            onChange={(e) => setEventType(e.target.value)}
                                            disabled={loading}
                                        >
                                            <option value="multiplicative">Multiplicative (%)</option>
                                            <option value="additive">Additive (units)</option>
                                        </select>
                                        <input
                                            type="number"
                                            placeholder={eventType === 'multiplicative' ? '% change' : 'Unit change'}
                                            value={eventValue}
                                            onChange={(e) => setEventValue(e.target.value)}
                                            disabled={loading}
                                        />
                                        <button onClick={addEvent} disabled={loading}>Add Event</button>
                                    </div>
                                </div>

                                {events.length > 0 && (
                                    <div className="events-list">
                                        <h3>Events ({events.length})</h3>
                                        {events.map((event, idx) => (
                                            <div key={idx} className="event-item">
                                                <div className="event-info">
                                                    <strong>{event.name}</strong>
                                                    <span>{event.start_date.split('T')[0]} to {event.end_date.split('T')[0]}</span>
                                                    <span>{event.effect_type === 'multiplicative' ? `${event.effect_value > 0 ? '+' : ''}${event.effect_value}%` : `${event.effect_value > 0 ? '+' : ''}${event.effect_value} units`}</span>
                                                </div>
                                                <button onClick={() => removeEvent(event.name)} className="delete-btn">×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button onClick={runScenario} disabled={loading} className="run-scenario-btn">
                                    🚀 Run Scenario Analysis
                                </button>
                            </>
                        )}
                    </div>

                    {scenarioResult && (
                        <>
                            <div className="card">
                                <h2>Scenario Comparison</h2>
                                <div className="chart-container">
                                    <ResponsiveContainer width="100%" height={400}>
                                        <ComposedChart data={scenarioChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="timestamp"
                                                type="number"
                                                domain={['dataMin', 'dataMax']}
                                                tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                labelFormatter={(ts) => new Date(ts).toLocaleDateString()}
                                                formatter={(value) => value?.toFixed(2)}
                                            />
                                            <Legend />

                                            <Area type="monotone" dataKey="upper_80" stroke="none" fill="#646cff" fillOpacity={0.1} />
                                            <Area type="monotone" dataKey="lower_80" stroke="none" fill="#ffffff" fillOpacity={1} />

                                            <Line type="monotone" dataKey="actual" stroke="#8884d8" strokeWidth={2} dot={false} name="Historical" />
                                            <Line type="monotone" dataKey="baseline" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Baseline" />
                                            <Line type="monotone" dataKey="scenario" stroke="#ff7c43" strokeWidth={2} dot={false} name="Scenario" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="card">
                                <h2>Impact Summary</h2>
                                <div className="delta-summary">
                                    <div className="delta-item">
                                        <span className="delta-label">Average Uplift:</span>
                                        <span className="delta-value">{scenarioResult.delta_summary.average_uplift.toFixed(2)}</span>
                                    </div>
                                    <div className="delta-item">
                                        <span className="delta-label">Total Uplift:</span>
                                        <span className="delta-value">{scenarioResult.delta_summary.total_uplift.toFixed(2)}</span>
                                    </div>
                                    <div className="delta-item">
                                        <span className="delta-label">Uplift %:</span>
                                        <span className="delta-value">{scenarioResult.delta_summary.uplift_percentage.toFixed(2)}%</span>
                                    </div>
                                    <div className="delta-item">
                                        <span className="delta-label">Max Change Date:</span>
                                        <span className="delta-value">{scenarioResult.delta_summary.max_change.date.split('T')[0]}</span>
                                    </div>
                                    <div className="delta-item">
                                        <span className="delta-label">Max Change Value:</span>
                                        <span className="delta-value">{scenarioResult.delta_summary.max_change.value.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {response && (
                <div className="card">
                    <pre className="response">{response}</pre>
                </div>
            )}
        </div>
    )
}

export default App
