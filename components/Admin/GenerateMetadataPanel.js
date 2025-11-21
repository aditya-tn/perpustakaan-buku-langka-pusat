// components/Admin/GenerateMetadataPanel.js
import { useState } from 'react';

const GenerateMetadataPanel = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generateAllMetadata = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/playlists/generate-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generateAll: true })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fillMissingMetadata = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/playlists/generate-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fillMissing: true })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '1rem', 
      border: '1px solid #e2e8f0', 
      borderRadius: '8px',
      backgroundColor: '#f7fafc',
      margin: '1rem 0'
    }}>
      <h3>🔄 Generate Playlist Metadata</h3>
      
      <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
        <button 
          onClick={generateAllMetadata}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#4299e1',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Generating...' : 'Generate All Metadata'}
        </button>

        <button 
          onClick={fillMissingMetadata}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#48bb78',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Filling...' : 'Fill Missing Metadata Only'}
        </button>
      </div>

      {result && (
        <div style={{
          padding: '1rem',
          backgroundColor: result.success ? '#f0fff4' : '#fed7d7',
          border: `1px solid ${result.success ? '#9ae6b4' : '#feb2b2'}`,
          borderRadius: '4px'
        }}>
          <strong>{result.success ? '✅ Success' : '❌ Error'}:</strong> {result.message}
          {result.data && (
            <pre style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default GenerateMetadataPanel;