
import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || 'putyoursadface';

export const encryptData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
  } catch (e) {
    console.error("Error al encriptar los datos:", e);
    return null;
  }
};

export const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const jsonString = bytes.toString(CryptoJS.enc.Utf8);

    if (!jsonString) {
      throw new Error("No se pudo desencriptar los datos. ¿La clave secreta es correcta?");
    }
    
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Error al desencriptar los datos:", e);
    return null;
  }
};

export const getAuthHeader = () => {
  const encryptedSession = localStorage.getItem('user');
  
  if (encryptedSession) {
    const session = decryptData(encryptedSession);
    const token = session?.token;

    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }

  return {};
};