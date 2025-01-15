import React, { useState } from 'react';
import axios from 'axios';
import { Search, AlertCircle, Music2 } from 'lucide-react';

interface Album {
  name: string;
  id: string;
  image: string;
}

interface WordCount {
  count: number;
  album_art?: string;
  cached: boolean;
}

interface WordCloudData {
  wordcloud: string;
}

export function SongClassifier() {
  const [artist, setArtist] = useState('');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState('');
  const [word, setWord] = useState('');
  const [result, setResult] = useState<WordCount | null>(null);
  const [wordcloud, setWordcloud] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAlbums = async () => {
    if (!artist) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`http://localhost:8000/api/artist/${encodeURIComponent(artist)}`);
      if (response.data.error) {
        setError(response.data.error);
        return;
      }
      setAlbums(response.data.albums || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch albums');
    } finally {
      setLoading(false);
    }
  };

  const analyzeWord = async () => {
    if (!artist || !selectedAlbum || !word) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.post('http://localhost:8000/api/analyze', {
        artist,
        album: selectedAlbum,
        word
      });
      if (response.data.error) {
        setError(response.data.error);
        return;
      }
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const generateWordCloud = async () => {
    if (!artist || !selectedAlbum) {
      setError('Please select an artist and album');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.post<WordCloudData>('http://localhost:8000/api/wordcloud', {
        artist,
        album: selectedAlbum
      });
      if (response.data.error) {
        setError(response.data.error);
        return;
      }
      if (response.data.wordcloud) {
        setWordcloud(response.data.wordcloud);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate word cloud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Music2 className="w-8 h-8 text-blue-500" />
        <h1 className="text-3xl font-bold text-gray-800">Lyrics Analyzer</h1>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Artist
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter artist name"
            />
            <button
              onClick={fetchAlbums}
              disabled={!artist || loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Loading...' : 'Get Albums'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Album
          </label>
          <select
            value={selectedAlbum}
            onChange={(e) => setSelectedAlbum(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            disabled={albums.length === 0}
          >
            <option value="">Select an album</option>
            {albums.map((album) => (
              <option key={album.id} value={album.name}>
                {album.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Word to Count
          </label>
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Enter word to count"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={analyzeWord}
            disabled={!artist || !selectedAlbum || !word || loading}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Analyze Word'}
          </button>

          <button
            onClick={generateWordCloud}
            disabled={!artist || !selectedAlbum || loading}
            className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating...' : 'Generate Word Cloud'}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-md">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {result && !error && (
          <div className="p-4 bg-gray-50 rounded-md">
            <h2 className="text-lg font-semibold mb-2">Results</h2>
            <p>Word count: {result.count}</p>
            {result.cached && (
              <p className="text-sm text-gray-500">(Retrieved from cache)</p>
            )}
            {result.album_art && (
              <img
                src={result.album_art}
                alt="Album artwork"
                className="mt-2 w-32 h-32 object-cover rounded-md"
              />
            )}
          </div>
        )}

        {wordcloud && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Word Cloud</h2>
            <img
              src={`data:image/png;base64,${wordcloud}`}
              alt="Word cloud"
              className="w-full rounded-md"
            />
          </div>
        )}
      </div>
    </div>
  );
}

