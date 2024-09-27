const baseUrl = process.env.NODE_ENV === 'production'
  ? 'https://juxtaj.com/barbershopbooking'
  : 'https://localhost:7260';

export default baseUrl;
