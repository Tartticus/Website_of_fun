import React, { useState } from 'react';
import { DrawingCanvas } from './components/DrawingCanvas';
import { Palette, Music, Twitter, Phone, Home } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [twitterUsername, setTwitterUsername] = useState('');

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'pass', label: 'N Word Pass', icon: Palette },
    { id: 'song', label: 'Song Classifier', icon: Music },
    { id: 'tweet', label: 'Troll Tweet', icon: Twitter },
    { id: 'text', label: 'Text Me', icon: Phone },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors duration-200
                    ${activeTab === tab.id 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === 'home' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col items-center gap-6">
              <img 
                src="https://i.imgur.com/4lpsqSr.jpeg" 
                alt="Profile" 
                className="w-48 h-48 rounded-full object-cover shadow-lg"
              />
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to My Page</h1>
                <p className="text-gray-600 mb-4">Feel free to explore all the features!</p>
                <a 
                  href="https://Twitter.com/JohnBummit" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                  Follow me on Twitter, nigga
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pass' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-gray-800">Draw Your Pass</h1>
            </div>
            
            <div className="mb-6">
              <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-2">
                Your Twitter Username
              </label>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  @
                </span>
                <input
                  type="text"
                  id="twitter"
                  value={twitterUsername}
                  onChange={(e) => setTwitterUsername(e.target.value)}
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="username"
                />
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Express yourself by drawing on the canvas below, nigga
            </p>

            <DrawingCanvas twitterUsername={twitterUsername} />
          </div>
        )}

        {activeTab === 'song' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Song Classifier</h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        )}

        {activeTab === 'tweet' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Troll Tweet Generator</h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Text Me</h2>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;