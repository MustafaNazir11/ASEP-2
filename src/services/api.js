import axios from 'axios';

export const sendAlert = async (alert) => {
  await axios.post('http://localhost:5000/api/proctor/alert', { alert });
};