import React, { useState, useEffect, useRef } from 'react';

interface LogEntry {
  id: number;
  message: string;
  level: 'info' | 'warn' | 'error';
  timestamp: number;
}

const AdminConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);

  useEffect(() => {
    // Intercept console.log, console.warn, console.error
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args: any[]) => {
      originalLog.apply(console, args);
      addLog(args.join(' '), 'info');
    };

    console.warn = (...args: any[]) => {
      originalWarn.apply(console, args);
      addLog(args.join(' '), 'warn');
    };

    console.error = (...args: any[]) => {
      originalError.apply(console, args);
      addLog(args.join(' '), 'error');
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const addLog = (message: string, level: 'info' | 'warn' | 'error') => {
    setLogs(prev => {
      const newLogs = [
        ...prev,
        {
          id: logIdRef.current++,
          message,
          level,
          timestamp: Date.now(),
        },
      ];
      // Keep only last 1000 logs
      return newLogs.slice(-1000);
    });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'warn':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-700 dark:text-gray-300';
    }
  };

  const getLogBgColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'warn':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return '';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Application Console
          </h3>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              Auto-scroll
            </label>
            <button
              onClick={clearLogs}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All ({logs.length})
          </button>
          <button
            onClick={() => setFilter('info')}
            className={`px-3 py-1 text-sm rounded ${
              filter === 'info'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Info ({logs.filter(l => l.level === 'info').length})
          </button>
          <button
            onClick={() => setFilter('warn')}
            className={`px-3 py-1 text-sm rounded ${
              filter === 'warn'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Warn ({logs.filter(l => l.level === 'warn').length})
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-3 py-1 text-sm rounded ${
              filter === 'error'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Error ({logs.filter(l => l.level === 'error').length})
          </button>
        </div>

        {/* Log Display */}
        <div className="bg-gray-900 dark:bg-black rounded-lg p-4 font-mono text-sm h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-center py-8">
              No logs to display
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`mb-1 ${getLogBgColor(log.level)} ${
                  log.message.includes('[TMDB]') ? 'font-semibold' : ''
                }`}
              >
                <span className="text-gray-500 dark:text-gray-500 mr-2">
                  [{formatTime(log.timestamp)}]
                </span>
                <span className={`mr-2 ${log.level === 'error' ? 'text-red-500' : log.level === 'warn' ? 'text-yellow-500' : 'text-gray-400'}`}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className={getLogColor(log.level)}>
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Showing {filteredLogs.length} of {logs.length} logs. Logs are kept in memory and cleared on page refresh.
        </p>
      </div>
    </div>
  );
};

export default AdminConsole;




