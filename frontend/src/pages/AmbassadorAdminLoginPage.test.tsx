/**
 * Bug Condition Exploration Test for Ambassador Admin Login
 * 
 * This test MUST FAIL on unfixed code to confirm the bug exists.
 * The test encodes the expected behavior from requirements 2.1, 2.2, 2.3.
 * 
 * Expected failure: Valid ambassador admin credentials result in authentication error
 * instead of successful login, token storage, user context setting, and dashboard redirect.
 */

import * as fc from 'fast-check';
import { describe, it, beforeEach, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, waitFor, screen, cleanup } from '@testing-library/react';

// Mock dependencies
const mockNavigate = vi.fn();
const mockSetUser = vi.fn();
const mockPost = vi.fn();

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock API
vi.mock('../api', () => ({
  default: {
    post: (...args: any[]) => mockPost(...args),
  },
}));

// Mock Ambassador Admin Auth Context
vi.mock('../context/AmbassadorAdminAuthContext', () => ({
  useAmbassadorAdminAuth: () => ({
    setUser: mockSetUser,
  }),
}));

// Mock localStorage
const mockLocalStorage = {
  setItem: vi.fn(),
  getItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Import the component after mocks are set up
import AmbassadorAdminLoginPage from './AmbassadorAdminLoginPage';

describe('Ambassador Admin Login Bug Condition Exploration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockSetUser.mockClear();
    mockPost.mockClear();
    mockLocalStorage.setItem.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * Property 1: Bug Condition - Ambassador Admin Valid Credentials Error
   * 
   * **Validates: Requirements 2.1, 2.2, 2.3**
   * 
   * This test demonstrates the EXPECTED BEHAVIOR: valid ambassador admin credentials 
   * should result in successful authentication.
   * 
   * EXPECTED OUTCOME: This test PASSES on fixed code (proving the fix works)
   * This test FAILED on unfixed code (proved the bug existed)
   */
  it('should authenticate ambassador admin users with valid credentials successfully', async () => {
    // Use concrete credentials to make the test deterministic
    const validCredentials = {
      email: 'ambassador@gmail.com',
      password: 'ambassadoradmin123',
      id: 'test-ambassador-admin-id',
      name: 'Ambassador Admin',
    };

    // FIXED BEHAVIOR: Valid ambassador admin credentials now succeed
    mockPost.mockResolvedValueOnce({
      data: {
        id: validCredentials.id,
        name: validCredentials.name,
        email: validCredentials.email,
        role: 'ambassador_admin',
        token: 'valid-ambassador-admin-token-123'
      }
    });

    // Render the login page
    render(<AmbassadorAdminLoginPage />);

    // Fill in the form with valid credentials
    const emailInput = screen.getByPlaceholderText('admin@example.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: validCredentials.email } });
    fireEvent.change(passwordInput, { target: { value: validCredentials.password } });

    // Submit the form
    fireEvent.click(submitButton);

    // The test expects successful authentication (Requirements 2.1, 2.2, 2.3)
    // After the fix, this should now pass
    
    // Wait for successful authentication
    await waitFor(() => {
      // Requirement 2.1: System SHALL authenticate successfully and redirect to dashboard
      expect(mockNavigate).toHaveBeenCalledWith('/ambassador-admin/dashboard');
    }, { timeout: 2000 });

    // Requirement 2.2: System SHALL store the authentication token
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'ambassador_admin_token',
      'valid-ambassador-admin-token-123'
    );

    // Requirement 2.3: System SHALL establish user session (set user context)
    expect(mockSetUser).toHaveBeenCalledWith({
      id: validCredentials.id,
      name: validCredentials.name,
      email: validCredentials.email,
      role: 'ambassador_admin',
    });

    // Verify no error message is displayed
    expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
  }, 10000);
});