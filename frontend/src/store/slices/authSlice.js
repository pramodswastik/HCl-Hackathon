import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '@services/authService';

// Get user from storage (check both localStorage and sessionStorage)
const getStoredAuth = () => {
  const localUser = localStorage.getItem('user');
  const localToken = localStorage.getItem('token');
  const sessionUser = sessionStorage.getItem('user');
  const sessionToken = sessionStorage.getItem('token');
  
  // Prefer localStorage (remember me enabled) over sessionStorage
  if (localToken && localUser) {
    return {
      user: JSON.parse(localUser),
      token: localToken,
      rememberMe: true,
    };
  }
  
  if (sessionToken && sessionUser) {
    return {
      user: JSON.parse(sessionUser),
      token: sessionToken,
      rememberMe: false,
    };
  }
  
  return { user: null, token: null, rememberMe: false };
};

const storedAuth = getStoredAuth();

const initialState = {
  user: storedAuth.user,
  token: storedAuth.token,
  rememberMe: storedAuth.rememberMe,
  isAuthenticated: !!storedAuth.token,
  isLoading: false,
  error: null,
};

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (userData, thunkAPI) => {
    try {
      // Default to remember me for registration
      return await authService.register(userData, true);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, thunkAPI) => {
    try {
      const { rememberMe = false, ...loginData } = credentials;
      const response = await authService.login(loginData, rememberMe);
      return { ...response, rememberMe };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Logout user
export const logout = createAsyncThunk('auth/logout', async () => {
  authService.logout();
});

// Get current user profile
export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, thunkAPI) => {
    try {
      return await authService.getProfile();
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Refresh token
export const refreshAuthToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const rememberMe = state.auth.rememberMe;
      return await authService.refreshToken(rememberMe);
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.rememberMe = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.rememberMe = action.payload.rememberMe;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.rememberMe = false;
      })
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Refresh Token
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
      })
      .addCase(refreshAuthToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.rememberMe = false;
      });
  },
});

export const { reset, clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
