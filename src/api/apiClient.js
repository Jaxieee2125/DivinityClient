// src/api/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // !!! CHỈNH SỬA NẾU CẦN !!!
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getSongs = () => apiClient.get('/songs/');
export const getArtists = () => apiClient.get('/artists/');
export const getAlbums = () => apiClient.get('/albums/');
// ...

export default apiClient;