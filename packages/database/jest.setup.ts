// Global mock for Supabase clients — prevents real DB calls in unit tests
jest.mock('./src/client', () => ({
  createBrowserClient: jest.fn(),
  createServerClient: jest.fn(),
}))
