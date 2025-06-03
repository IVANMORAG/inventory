
import { supabaseUrl, supabaseKey } from '../config/supabaseConfig.js';
import { showNotification } from './ui.js';

let supabase = null;
let isAuthenticated = false;

export async function initSupabase() {
  if (supabase) return; // Evitar reinicialización
  if (!window.supabase) {
    console.error('Librería de Supabase no cargada');
    showNotification('Error: Supabase no está disponible', 'error');
    return false;
  }
  try {
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log('Supabase inicializado correctamente');
    return true;
  } catch (error) {
    console.error('Error al inicializar Supabase:', error);
    showNotification('Error al conectar con Supabase', 'error');
    return false;
  }
}

export function checkAuth() {
  isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
  if (isAuthenticated) {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
  }
}

export async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  console.log('Intentando login con:', { username, password });

  if (!supabase) {
    const initialized = await initSupabase();
    if (!initialized) return false;
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password);

    if (error) {
      console.error('Error en la consulta a Supabase:', error);
      throw new Error(error.message || 'Error al consultar la base de datos');
    }

    if (!data || data.length === 0) {
      throw new Error('Usuario o contraseña incorrectos');
    }

    if (data.length > 1) {
      console.warn('Múltiples usuarios encontrados con las mismas credenciales');
      throw new Error('Error: Múltiples usuarios encontrados');
    }

    const user = data[0];
    console.log('Usuario encontrado:', user);

    isAuthenticated = true;
    sessionStorage.setItem('isAuthenticated', 'true');
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('login-error').classList.add('hidden');
    
    showNotification('¡Bienvenido al sistema!');
    return true;
  } catch (error) {
    console.error('Error de login:', error);
    document.getElementById('login-error').classList.remove('hidden');
    showNotification(error.message, 'error');
    return false;
  }
}

export function logout() {
  isAuthenticated = false;
  sessionStorage.removeItem('isAuthenticated');
  document.getElementById('login-section').classList.remove('hidden');
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('login-error').classList.add('hidden');
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
}

export async function getSupabase() {
  if (!supabase) {
    await initSupabase();
  }
  return supabase;
}
