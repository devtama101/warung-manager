import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  GitBranch,
  Smartphone,
  Calendar
} from 'lucide-react';

interface ConflictLog {
  id: number;
  entityType: string;
  entityId: number;
  conflictType: string;
  clientData: any;
  serverData: any;
  resolvedData?: any;
  resolution: string;
  resolvedBy: string;
  timestamp: string;
  resolvedAt?: string;
  notes: string;
  deviceId: string;
}

interface ConflictResolutionProps {
  userId: number;
}

export const ConflictResolution: React.FC<ConflictResolutionProps> = ({ userId }) => {
  const [conflicts, setConflicts] = useState<ConflictLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConflict, setSelectedConflict] = useState<ConflictLog | null>(null);

  useEffect(() => {
    fetchConflicts();
  }, [userId]);

  const fetchConflicts = async () => {
    try {
      const response = await fetch(`/api/admin/conflicts?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setConflicts(data.conflicts || []);
      }
    } catch (error) {
      console.error('Failed to fetch conflicts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResolutionColor = (resolution: string) => {
    switch (resolution) {
      case 'SERVER_WINS':
        return 'bg-blue-100 text-blue-800';
      case 'CLIENT_WINS':
        return 'bg-green-100 text-green-800';
      case 'MANUAL_MERGE':
        return 'bg-purple-100 text-purple-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConflictTypeIcon = (type: string) => {
    switch (type) {
      case 'VERSION_MISMATCH':
        return <GitBranch className="h-4 w-4" />;
      case 'DATA_CONFLICT':
        return <AlertTriangle className="h-4 w-4" />;
      case 'DELETE_CONFLICT':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  const renderDataComparison = (clientData: any, serverData: any, resolvedData?: any) => {
    const allKeys = new Set([
      ...Object.keys(clientData || {}),
      ...Object.keys(serverData || {}),
      ...(resolvedData ? Object.keys(resolvedData) : [])
    ]);

    return (
      <div className="space-y-2">
        {Array.from(allKeys).map((key) => {
          const clientValue = clientData?.[key];
          const serverValue = serverData?.[key];
          const resolvedValue = resolvedData?.[key];

          const hasConflict = clientValue !== serverValue;

          return (
            <div key={key} className="grid grid-cols-3 gap-2 p-2 border rounded">
              <div className="text-sm font-medium">{key}:</div>
              <div className={`text-sm ${hasConflict ? 'text-red-600 font-medium' : ''}`}>
                Client: {JSON.stringify(clientValue)}
              </div>
              <div className={`text-sm ${hasConflict ? 'text-blue-600 font-medium' : ''}`}>
                Server: {JSON.stringify(serverValue)}
              </div>
              {resolvedValue !== undefined && (
                <div className="col-span-3 text-sm text-green-600 mt-1">
                  Resolved: {JSON.stringify(resolvedValue)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingConflicts = conflicts.filter(c => c.resolution === 'PENDING');
  const resolvedConflicts = conflicts.filter(c => c.resolution !== 'PENDING');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Conflict Resolution</h2>
        <Button onClick={fetchConflicts} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {pendingConflicts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {pendingConflicts.length} pending conflict{pendingConflicts.length > 1 ? 's' : ''} that need resolution.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingConflicts.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedConflicts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingConflicts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Pending Conflicts</h3>
                  <p className="text-gray-500">All conflicts have been resolved.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingConflicts.map((conflict) => (
                <Card key={conflict.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getConflictTypeIcon(conflict.conflictType)}
                        <CardTitle className="text-lg">
                          {conflict.entityType} #{conflict.entityId}
                        </CardTitle>
                        <Badge variant="outline">{conflict.conflictType}</Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Smartphone className="h-4 w-4" />
                        <span>{conflict.deviceId}</span>
                        <Calendar className="h-4 w-4 ml-2" />
                        <span>{formatDate(conflict.timestamp)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Conflict Details:</h4>
                        <p className="text-sm text-gray-600">{conflict.notes}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Data Comparison:</h4>
                        <ScrollArea className="h-48 w-full border rounded-md p-2">
                          {renderDataComparison(conflict.clientData, conflict.serverData)}
                        </ScrollArea>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleResolveConflict(conflict.id, 'SERVER_WINS')}
                        >
                          Use Server Data
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolveConflict(conflict.id, 'CLIENT_WINS')}
                        >
                          Use Client Data
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedConflict(conflict)}
                        >
                          Manual Merge
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedConflicts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Resolved Conflicts</h3>
                  <p className="text-gray-500">No conflicts have been resolved yet.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {resolvedConflicts.map((conflict) => (
                <Card key={conflict.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getConflictTypeIcon(conflict.conflictType)}
                        <CardTitle className="text-lg">
                          {conflict.entityType} #{conflict.entityId}
                        </CardTitle>
                        <Badge className={getResolutionColor(conflict.resolution)}>
                          {conflict.resolution}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Smartphone className="h-4 w-4" />
                        <span>{conflict.deviceId}</span>
                        <Calendar className="h-4 w-4 ml-2" />
                        <span>{formatDate(conflict.timestamp)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Resolved by:</strong> {conflict.resolvedBy}</p>
                      {conflict.resolvedAt && (
                        <p className="text-sm"><strong>Resolved at:</strong> {formatDate(conflict.resolvedAt)}</p>
                      )}
                      <p className="text-sm text-gray-600">{conflict.notes}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Manual Merge Dialog - Simplified version */}
      {selectedConflict && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader>
              <CardTitle>Manual Merge - {selectedConflict.entityType} #{selectedConflict.entityId}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {renderDataComparison(
                  selectedConflict.clientData,
                  selectedConflict.serverData,
                  selectedConflict.resolvedData
                )}
              </ScrollArea>
              <div className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setSelectedConflict(null)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Implement manual merge logic here
                  console.log('Manual merge for conflict:', selectedConflict.id);
                  setSelectedConflict(null);
                }}>
                  Save Merge
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  async function handleResolveConflict(conflictId: number, resolution: string) {
    try {
      const response = await fetch(`/api/admin/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resolution }),
      });

      if (response.ok) {
        await fetchConflicts(); // Refresh the list
      } else {
        console.error('Failed to resolve conflict');
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
    }
  }
};