import axios from 'axios';
import { Path } from 'react-router-dom';
import { ReceptionQR, TotemQR } from '../types/types';

export const fetchTotems = async (campus: string): Promise<TotemQR[]> => {
  const response = await axios.get(`http://localhost:8000/api/totems/?campus=${campus}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  return response.data;
};

export const fetchReceptions = async (campus: string): Promise<ReceptionQR[]> => {
  const response = await axios.get(`http://localhost:8000/api/recepciones/?campus=${campus}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  return response.data;
};

export const fetchPaths = async (campus: string): Promise<Path[]> => {
  const response = await axios.get(`http://localhost:8000/api/caminos/?campus=${campus}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  return response.data;
};