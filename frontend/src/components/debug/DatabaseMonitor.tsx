"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Database,
  Search,
  Download,
  RefreshCw,
  Play,
  Square,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { debugDB } from '@/lib/indexedDBDebugger';

export function DatabaseMonitor() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [exportData, setExportData] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState('pesanan');
  const [tableData, setTableData] = useState<any>(null);

  // Load initial stats
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await debugDB.getDatabaseStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const startMonitoring = () => {
    debugDB.startMonitoring(3000); // Update every 3 seconds
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    debugDB.stopMonitoring();
    setIsMonitoring(false);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const results = await debugDB.searchData(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await debugDB.exportAllData();
      setExportData(data);

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `warung-db-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    setLoading(true);
    try {
      const data = await debugDB.getTableData(tableName as any, 20);
      setTableData(data);
    } catch (error) {
      console.error('Error loading table data:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearTable = async (tableName: string) => {
    if (!confirm(`⚠️ Apakah Anda yakin ingin menghapus semua data di tabel "${tableName}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await debugDB.clearTable(tableName as any);
      await loadStats();
      await loadTableData(tableName);
    } catch (error) {
      console.error('Error clearing table:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!stats) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading database stats...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            IndexedDB Monitor - Warung POS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Control Panel */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button onClick={loadStats} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              variant={isMonitoring ? "destructive" : "default"}
            >
              {isMonitoring ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Monitoring
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Monitoring
                </>
              )}
            </Button>
            <Button onClick={handleExport} variant="outline" disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Export All Data
            </Button>
          </div>

          {/* Database Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.stats.pesanan}</div>
              <div className="text-sm text-gray-600">Pesanan</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.stats.menu}</div>
              <div className="text-sm text-gray-600">Menu</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.stats.inventory}</div>
              <div className="text-sm text-gray-600">Inventory</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.stats.dailyReport}</div>
              <div className="text-sm text-gray-600">Daily Reports</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.stats.syncQueue}</div>
              <div className="text-sm text-gray-600">Sync Queue</div>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.pendingSync}</div>
              <div className="text-sm text-gray-600">Pending Sync</div>
            </Card>
          </div>

          {/* Last Sync Info */}
          {stats.lastSyncAt && (
            <div className="bg-blue-50 p-3 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Last Sync: {new Date(stats.lastSyncAt).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Monitoring Status */}
          <div className="flex items-center gap-2 mb-6">
            <Badge variant={isMonitoring ? "default" : "secondary"}>
              {isMonitoring ? "🟢 Monitoring Active" : "⚪ Monitoring Inactive"}
            </Badge>
            {stats.pendingSync > 0 && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {stats.pendingSync} items pending sync
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="search">Search Data</TabsTrigger>
          <TabsTrigger value="tables">Table Data</TabsTrigger>
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search IndexedDB
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for any data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {searchResults && (
                <div className="space-y-4">
                  {Object.entries(searchResults).map(([table, data]) => (
                    <Card key={table}>
                      <CardHeader>
                        <CardTitle className="text-lg capitalize">{table}</CardTitle>
                        <div className="text-sm text-gray-600">
                          Found {Array.isArray(data) ? data.length : 0} results
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48">
                          <pre className="text-xs">
                            {JSON.stringify(data, null, 2)}
                          </pre>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Table Data Viewer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 items-center">
                <select
                  value={selectedTable}
                  onChange={(e) => {
                    setSelectedTable(e.target.value);
                    loadTableData(e.target.value);
                  }}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="pesanan">Pesanan</option>
                  <option value="menu">Menu</option>
                  <option value="inventory">Inventory</option>
                  <option value="dailyReport">Daily Reports</option>
                  <option value="syncQueue">Sync Queue</option>
                  <option value="settings">Settings</option>
                </select>
                <Button onClick={() => loadTableData(selectedTable)} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload
                </Button>
                <Button
                  onClick={() => clearTable(selectedTable)}
                  variant="destructive"
                  className="ml-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Table
                </Button>
              </div>

              {tableData && (
                <ScrollArea className="h-96">
                  <pre className="text-xs">
                    {JSON.stringify(tableData, null, 2)}
                  </pre>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Queue Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  Check console for detailed sync information.<br/>
                  Use: <code className="bg-gray-100 px-2 py-1 rounded">debugDB.pending()</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">
                  Click "Export All Data" button above to download complete database backup
                </p>
                <Button onClick={handleExport} disabled={loading}>
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}