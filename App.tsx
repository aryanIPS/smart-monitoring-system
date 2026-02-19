
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, Droplets, Zap, AlertTriangle, Lightbulb, RefreshCw, Radio } from 'lucide-react';
import { UsageChart } from './components/UsageChart';
import { Metrics } from './components/Metrics';
import { Alerts } from './components/Alerts';
import { getSustainabilityAdvice } from './services/geminiService';
import { SensorData, AnomalyType } from './types';

const App: React.FC = () => {
  const [dataHistory, setDataHistory] = useState<SensorData[]>([]);
  const [latestData, setLatestData] = useState<SensorData | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [simulationMode, setSimulationMode] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);

  const handleNewData = useCallback((newData: SensorData) => {
    setLatestData(newData);
    setDataHistory(prev => [...prev.slice(-20), newData]);

    // Trigger AI Advice ONLY on anomaly
    if (newData.anomaly !== 'Normal') {
      fetchAiAdvice(newData);
    } else {
      setAiAdvice(null);
    }
  }, []);

  const fetchAiAdvice = async (data: SensorData) => {
    setIsAdviceLoading(true);
    try {
      const advice = await getSustainabilityAdvice(data);
      setAiAdvice(advice);
    } catch (error) {
      console.error("AI Advice fetch failed:", error);
    } finally {
      setIsAdviceLoading(false);
    }
  };

  // WebSocket Connection
  useEffect(() => {
    if (simulationMode) return;

    const connectWs = () => {
      setWsStatus('connecting');
      const ws = new WebSocket('ws://localhost:8000/ws');
      wsRef.current = ws;

      ws.onopen = () => setWsStatus('connected');
      ws.onclose = () => {
        setWsStatus('disconnected');
        // Simple retry logic
        setTimeout(connectWs, 3000);
      };
      ws.onmessage = (event) => {
        const data: SensorData = JSON.parse(event.data);
        handleNewData(data);
      };
    };

    connectWs();
    return () => wsRef.current?.close();
  }, [simulationMode, handleNewData]);

  // Simulation Logic (Fallback if Backend not running)
  useEffect(() => {
    if (!simulationMode) return;

    const interval = setInterval(() => {
      const electricity = Math.random() * 25;
      const water = Math.random() * 350;
      let anomaly: AnomalyType = 'Normal';
      if (electricity > 20) anomaly = 'Electricity Spike Detected';
      else if (water > 250) anomaly = 'Water Leakage Detected';

      handleNewData({
        timestamp: new Date().toISOString(),
        electricity,
        water,
        anomaly
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [simulationMode, handleNewData]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <Activity className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">EcoStream</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className={`w-2 h-2 rounded-full ${wsStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="hidden sm:inline">{wsStatus === 'connected' ? 'Backend Connected' : 'Disconnected'}</span>
            </div>
            <button 
              onClick={() => setSimulationMode(!simulationMode)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 ${
                simulationMode 
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Radio className="w-3 h-3" />
              {simulationMode ? 'Stop Sim' : 'Start Sim'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Real-time Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Metrics 
            title="Electricity Usage" 
            value={latestData?.electricity.toFixed(2) || '0.00'} 
            unit="kWh" 
            icon={<Zap className="w-5 h-5 text-amber-500" />}
            color="amber"
          />
          <Metrics 
            title="Water Usage" 
            value={latestData?.water.toFixed(2) || '0.00'} 
            unit="Liters" 
            icon={<Droplets className="w-5 h-5 text-blue-500" />}
            color="blue"
          />
          <div className={`col-span-1 md:col-span-2 p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
            latestData?.anomaly !== 'Normal' 
            ? 'bg-rose-50 border-rose-200 shadow-lg shadow-rose-100' 
            : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${latestData?.anomaly !== 'Normal' ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">System Status</h3>
                  <p className={`text-lg font-bold ${latestData?.anomaly !== 'Normal' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {latestData?.anomaly || 'Monitoring...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Consumption Trends
                </h3>
              </div>
              <UsageChart data={dataHistory} />
            </div>

            {/* AI Suggestion Panel */}
            <div className={`p-6 rounded-2xl border-2 border-dashed transition-all ${
              aiAdvice ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-emerald-100 p-2 rounded-full">
                  <Lightbulb className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-800">Smart Sustainability Advice</h3>
                {isAdviceLoading && <RefreshCw className="w-4 h-4 animate-spin text-emerald-500 ml-auto" />}
              </div>
              
              <div className="min-h-[60px] flex items-center">
                {aiAdvice ? (
                  <p className="text-slate-700 italic leading-relaxed">
                    "{aiAdvice}"
                  </p>
                ) : (
                  <p className="text-slate-500 text-sm">
                    Waiting for anomalies to provide smart mitigation strategies...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Alerts */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden sticky top-24">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Alert History</h3>
                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 font-bold uppercase">Real-time</span>
              </div>
              <Alerts data={dataHistory.filter(d => d.anomaly !== 'Normal').reverse()} />
            </div>
          </div>
        </div>
      </main>

      {/* Persistent Call to Action */}
      <footer className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
          className="bg-slate-900 text-white p-3 rounded-full shadow-2xl hover:bg-slate-800 transition-transform hover:scale-110 active:scale-95"
        >
          <Activity className="w-6 h-6" />
        </button>
      </footer>
    </div>
  );
};

export default App;
