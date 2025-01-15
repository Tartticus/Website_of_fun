from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import requests
import base64
from bs4 import BeautifulSoup
import duckdb
import matplotlib.pyplot as plt
from io import BytesIO
from wordcloud import WordCloud

class LyricsAnalyzer:
    def __init__(self):
        self.GENIUS_API_TOKEN = 'Your API Key'  # Replace with your Genius API token
        self.spotify_token = None
        self.setup_database()
    
    def setup_database(self):
        self.con = duckdb.connect(database='lyrics_cache1.db')
        self.con.execute('''
            CREATE TABLE IF NOT EXISTS counts (
                Artist TEXT,
                Album TEXT,
                Word TEXT,
                Count INTEGER,
                Album_Art TEXT,
                PRIMARY KEY (Artist, Album, Word)
            )
        ''')

    def get_spotify_token(self):
        CLIENT_ID = 'YOUR CLIENT ID'  # Replace with your Spotify Client ID
        CLIENT_SECRET = 'YOUR CLIENT SECRET'  # Replace with your Spotify Client Secret
        
        TOKEN_URL = 'https://accounts.spotify.com/api/token'
        auth_str = f"{CLIENT_ID}:{CLIENT_SECRET}"
        b64_auth_str = base64.b64encode(auth_str.encode()).decode()
        
        headers = {'Authorization': f'Basic {b64_auth_str}'}
        data = {'grant_type': 'client_credentials'}
        
        response = requests.post(TOKEN_URL, headers=headers, data=data)
        if response.status_code == 200:
            return response.json()['access_token']
        return None

    def get_spotify_artist_id(self, artist_name):
        if not self.spotify_token:
            self.spotify_token = self.get_spotify_token()
        
        headers = {'Authorization': f'Bearer {self.spotify_token}'}
        search_url = f"https://api.spotify.com/v1/search?q={artist_name}&type=artist"
        response = requests.get(search_url, headers=headers)
        
        if response.status_code == 200:
            artists = response.json()["artists"]["items"]
            if artists:
                return artists[0]["id"]
        return None

    def get_spotify_albums(self, artist_id):
        headers = {'Authorization': f'Bearer {self.spotify_token}'}
        albums_url = f"https://api.spotify.com/v1/artists/{artist_id}/albums"
        response = requests.get(albums_url, headers=headers)
        
        if response.status_code == 200:
            albums = response.json()["items"]
            return [{"name": album["name"], "id": album["id"], "image": album["images"][0]["url"] if album["images"] else None} for album in albums]
        return []

    def get_spotify_album_tracks(self, album_id):
        headers = {'Authorization': f'Bearer {self.spotify_token}'}
        tracks_url = f"https://api.spotify.com/v1/albums/{album_id}/tracks"
        response = requests.get(tracks_url, headers=headers)
        
        if response.status_code == 200:
            tracks = response.json()["items"]
            return [track["name"] for track in tracks]
        return []

    def get_song_lyrics(self, song_url):
        page = requests.get(song_url)
        soup = BeautifulSoup(page.text, 'html.parser')
        lyrics_div = soup.find('div', class_='lyrics') or soup.find('div', class_='Lyrics__Root-sc-1ynbvzw-0')
        return lyrics_div.get_text() if lyrics_div else ""

    def get_song_info_from_genius(self, song_name, artist_name):
        headers = {'Authorization': f'Bearer {self.GENIUS_API_TOKEN}'}
        search_url = f"https://api.genius.com/search?q={song_name} {artist_name}"
        response = requests.get(search_url, headers=headers)
        
        if response.status_code == 200:
            hits = response.json()["response"]["hits"]
            if hits:
                song_url = hits[0]["result"]["url"]
                return self.get_song_lyrics(song_url)
        return ""

    def count_word_occurrences(self, album_id, artist_name, word):
        tracks = self.get_spotify_album_tracks(album_id)
        if not tracks:
            return 0, None

        word_count = 0
        for track_name in tracks:
            lyrics = self.get_song_info_from_genius(track_name, artist_name)
            word_count += lyrics.lower().count(word.lower())
        
        return word_count

    def get_word_count(self, artist_name, album_name, word):
        # Check cache first
        result = self.con.execute(
            "SELECT Count, Album_Art FROM counts WHERE Artist = ? AND Album = ? AND Word = ?",
            [artist_name, album_name, word]
        ).fetchone()
        
        if result:
            return {"count": result[0], "album_art": result[1], "cached": True}
        
        # If not in cache, calculate
        artist_id = self.get_spotify_artist_id(artist_name)
        if not artist_id:
            return {"error": "Artist not found"}
            
        albums = self.get_spotify_albums(artist_id)
        album_id = None
        album_art = None
        
        for album in albums:
            if album["name"].lower() == album_name.lower():
                album_id = album["id"]
                album_art = album["image"]
                break
        
        if not album_id:
            return {"error": "Album not found"}
            
        count = self.count_word_occurrences(album_id, artist_name, word)
        
        # Store in cache
        self.con.execute(
            "INSERT INTO counts (Artist, Album, Word, Count, Album_Art) VALUES (?, ?, ?, ?, ?)",
            [artist_name, album_name, word, count, album_art]
        )
        
        return {"count": count, "album_art": album_art, "cached": False}

    def generate_word_cloud(self, artist_name, album_name):
        artist_id = self.get_spotify_artist_id(artist_name)
        if not artist_id:
            return {"error": "Artist not found"}
            
        albums = self.get_spotify_albums(artist_id)
        album_id = None
        
        for album in albums:
            if album["name"].lower() == album_name.lower():
                album_id = album["id"]
                break
        
        if not album_id:
            return {"error": "Album not found"}
            
        tracks = self.get_spotify_album_tracks(album_id)
        all_lyrics = ""
        
        for track_name in tracks:
            lyrics = self.get_song_info_from_genius(track_name, artist_name)
            all_lyrics += lyrics + " "
            
        wordcloud = WordCloud(width=800, height=400, background_color='white').generate(all_lyrics)
        
        img_data = BytesIO()
        plt.figure(figsize=(10, 5))
        plt.imshow(wordcloud, interpolation='bilinear')
        plt.axis('off')
        plt.savefig(img_data, format='png', bbox_inches='tight', pad_inches=0)
        plt.close()
        
        img_data.seek(0)
        return {"wordcloud": base64.b64encode(img_data.getvalue()).decode()}

class APIHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.analyzer = LyricsAnalyzer()
        super().__init__(*args, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path.startswith('/api/artist/'):
            artist_name = self.path.split('/api/artist/')[1]
            artist_id = self.analyzer.get_spotify_artist_id(artist_name)
            if artist_id:
                albums = self.analyzer.get_spotify_albums(artist_id)
                self.send_json_response({"albums": albums})
            else:
                self.send_json_response({"error": "Artist not found"}, 404)
        else:
            self.send_json_response({"error": "Invalid endpoint"}, 404)

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = json.loads(self.rfile.read(content_length))

        if self.path == '/api/analyze':
            result = self.analyzer.get_word_count(
                post_data.get('artist'),
                post_data.get('album'),
                post_data.get('word')
            )
            self.send_json_response(result)
        elif self.path == '/api/wordcloud':
            result = self.analyzer.generate_word_cloud(
                post_data.get('artist'),
                post_data.get('album')
            )
            self.send_json_response(result)
        else:
            self.send_json_response({"error": "Invalid endpoint"}, 404)

    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

def run_server():
    port = 8000
    server_address = ('', port)
    httpd = HTTPServer(server_address, APIHandler)
    print(f'Starting Python server on port {port}...')
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()