import { useEffect, useState, useCallback } from 'react';
import type { Route } from "./+types/dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "User Login Statistics Dashboard" },
    { name: "description", content: "Real-time user login analytics and statistics" },
  ];
}

interface DeviceStat {
  device_type: string;
  count: number;
}

interface RegionStat {
  region: string;
  count: number;
}

interface BrowserStat {
  browser: string;
  count: number;
}

interface LoginTrend {
  date: string;
  loginCount: number;
}

interface PeakHour {
  hour: number;
  loginCount: number;
}

interface StatsData {
  totalSessions: number;
  totalUsers: number;
  averageSessionDuration: number;
  deviceStats: DeviceStat[];
  regionStats: RegionStat[];
  browserStats: BrowserStat[];
  loginTrends?: LoginTrend[];
  peakHours?: PeakHour[];
}

interface StatsUpdateMessage {
  type: 'stats_update';
  payload: StatsData;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export default function Dashboard() {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Fallback to HTTP API if WebSocket fails
  const fetchStatsHTTP = useCallback(async () => {
    try {
      console.log('Fetching stats via HTTP...');
      const response = await fetch('http://localhost:37001/logins/stats');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched stats via HTTP:', data);
        setStatsData(data);
        setLastUpdated(new Date());
      } else {
        console.error('HTTP fetch failed with status:', response.status);
      }
    } catch (error) {
      console.error('HTTP fetch error:', error);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setConnectionStatus('connecting');
    
    // In production, this would be the actual server URL
    const wsUrl = 'ws://localhost:37002/ws';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
      setSocket(ws);
      
      // Request initial data
      ws.send(JSON.stringify({ type: 'request_initial_data' }));
    };

    ws.onmessage = (event) => {
      try {
        const message: StatsUpdateMessage = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        if (message.type === 'stats_update') {
          setStatsData(message.payload);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus('disconnected');
      setSocket(null);
      
      // Only fallback to HTTP if we haven't received data yet
      if (!statsData) {
        fetchStatsHTTP().catch(console.error);
      }
      
      // Attempt to reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
      
      // Only fallback to HTTP if we haven't received data yet
      if (!statsData) {
        fetchStatsHTTP().catch(console.error);
      }
    };
  }, [socket, fetchStatsHTTP]);

  useEffect(() => {
    console.log('Dashboard component mounted');
    
    // Try WebSocket first
    connectWebSocket();

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, []); // Empty dependency array to run only once on mount

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Login Statistics</h1>
              <p className="text-gray-600 mt-1">Real-time analytics dashboard</p>
            </div>
            <div className="text-right">
              <div className={`font-semibold ${getConnectionStatusColor()}`}>
                {getConnectionStatusText()}
              </div>
              {lastUpdated && (
                <div className="text-sm text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {!statsData ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-500">
              {connectionStatus === 'connected' ? 'Loading data...' : 'Waiting for connection...'}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {statsData?.totalSessions?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Total Sessions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {statsData?.totalUsers?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-700">
                    {formatDuration(statsData?.averageSessionDuration || 0)}
                  </div>
                  <div className="text-sm text-gray-600">Average Duration</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-700">
                    {connectionStatus === 'connected' ? 'Live' : 'Offline'}
                  </div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
              </div>
            </div>

            {/* Device Types */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Device Types</h2>
              <div className="space-y-3">
                {statsData?.deviceStats?.map((stat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-700 capitalize">{stat.device_type}</span>
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        {stat.count.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-gray-500 text-sm">No device data available</div>
                )}
              </div>
            </div>

            {/* Top Regions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Regions</h2>
              <div className="space-y-3">
                {statsData?.regionStats?.slice(0, 8).map((stat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-700">{stat.region}</span>
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                      {stat.count.toLocaleString()}
                    </div>
                  </div>
                )) || (
                  <div className="text-gray-500 text-sm">No region data available</div>
                )}
              </div>
            </div>

            {/* Browser Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Browser Usage</h2>
              <div className="space-y-3">
                {statsData?.browserStats?.slice(0, 8).map((stat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-700">{stat.browser}</span>
                    <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium">
                      {stat.count.toLocaleString()}
                    </div>
                  </div>
                )) || (
                  <div className="text-gray-500 text-sm">No browser data available</div>
                )}
              </div>
            </div>

            {/* Peak Hours */}
            {statsData.peakHours && statsData.peakHours.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Peak Login Hours (24h format)</h2>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                  {statsData.peakHours.map((peak, index) => (
                    <div key={index} className="text-center">
                      <div className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium mb-1">
                        {peak.loginCount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">{peak.hour}:00</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Login Trends */}
            {statsData.loginTrends && statsData.loginTrends.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Login Trends</h2>
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-7 gap-2 min-w-full">
                    {statsData.loginTrends.slice(-14).map((trend, index) => (
                      <div key={index} className="text-center">
                        <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm font-medium mb-1">
                          {trend.loginCount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">
                          {new Date(trend.date).toLocaleDateString(undefined, { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manual Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={connectWebSocket}
            disabled={connectionStatus === 'connecting'}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
          >
            {connectionStatus === 'connecting' ? 'Connecting...' : 'Refresh Connection'}
          </button>
        </div>
      </div>
    </div>
  );
}
