// A simplified version of the Supabase service that only uses REST API calls
// This avoids any WebSocket dependencies that might cause bundling issues


import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://ydfdjhbxaoqzhangllsx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZmRqaGJ4YW9xemhhbmdsbHN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5OTA5NTMsImV4cCI6MjA2MjU2Njk1M30.XmgG9DfmCu6ijhmUkSNC4GGQgzNn12lTMylO7Z_cwaQ';

// Define database types
export interface Team {
  id?: string;
  name: string;
  division: string;
  coach: string;
  players_count?: number;
  created_at?: string;
}

export interface Player {
  id: string;
  name: string;
  team_id: string;
  position: string;
  jersey_number: number;
  stats: {
    goals: number;
    assists: number;
  };
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  teams: string[];
  type: string;
  status: string;
  created_at: string;
  registration_deadline: string;
  image?: string; // Optional since some events might not have images
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  read_by_ids: string[];
}

export interface Announcement {
  id: string;
  sender_id?: string;
  sender_name: string;
  message: string;
  created_at: string;
  likes: number;
  liked_by_ids: string[];
  replies?: Reply[];
}

export interface Reply {
  id: string;
  announcement_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

// Helper function to make API requests to Supabase
async function fetchFromSupabase(endpoint: string, options: RequestInit = {}) {
  const url = `${supabaseUrl}${endpoint}`;
  
  // Get the current session token
  const sessionStr = await AsyncStorage.getItem('supabase-session');
  const session = sessionStr ? JSON.parse(sessionStr) : null;
  const accessToken = session?.access_token;

  const headers = {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${accessToken || supabaseAnonKey}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Supabase API request failed:', error);
    throw error;
  }
}

// Team operations
export const teamService = {
  async getTeams(): Promise<Team[]> {
    try {
      console.log('Fetching teams from Supabase');
      // Try to fetch from Supabase first
      const response = await fetchFromSupabase('/rest/v1/teams?select=*&order=name');
      
      if (response && response.length > 0) {
        // Store the fetched teams locally for offline access
        await AsyncStorage.setItem('local_teams', JSON.stringify(response));
        return response;
      }
      
      // If no teams found in Supabase, try to get from local storage
      const localTeamsJson = await AsyncStorage.getItem('local_teams');
      if (localTeamsJson) {
        const localTeams = JSON.parse(localTeamsJson);
        console.log('Returning teams from local storage:', localTeams.length);
        return localTeams;
      }
      
      // If no local teams found either, return default mock data
      console.log('No teams found, returning default mock data');
      const defaultTeams = [
        {
          id: '1',
          name: 'Windhoek Warriors',
          division: 'Premier',
          coach: 'David Muller',
          players_count: 15,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Swakopmund Strikers',
          division: 'Premier',
          coach: 'Anna Shipanga',
          players_count: 12,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Walvis Bay Wolves',
          division: 'Division 1',
          coach: 'Thomas Shilongo',
          players_count: 14,
          created_at: new Date().toISOString()
        }
      ];
      
      // Store the default teams locally for future use
      await AsyncStorage.setItem('local_teams', JSON.stringify(defaultTeams));
      return defaultTeams;
    } catch (error) {
      console.error('Error fetching teams:', error);
      
      // Try to get from local storage as fallback
      try {
        const localTeamsJson = await AsyncStorage.getItem('local_teams');
        if (localTeamsJson) {
          const localTeams = JSON.parse(localTeamsJson);
          console.log('Error fetching from Supabase, returning local teams:', localTeams.length);
          return localTeams;
        }
      } catch (storageError) {
        console.error('Error accessing local storage:', storageError);
      }
      
      return [];
    }
  },
  
  async getTeamById(id: string): Promise<Team | null> {
    try {
      const response = await fetchFromSupabase(`/rest/v1/teams?id=eq.${id}&select=*`);
      return response && response.length > 0 ? response[0] : null;
    } catch (error) {
      console.error(`Error fetching team with id ${id}:`, error);
      return null;
    }
  },
  
  async createTeam(team: Team): Promise<Team | null> {
    try {
      console.log('Creating team in Supabase:', team);
      
      // Prepare the team data with required fields
      const teamData = {
        ...team,
        created_at: new Date().toISOString(),
        players_count: 0
      };
      
      // Store in Supabase
      const response = await fetchFromSupabase('/rest/v1/teams', {
        method: 'POST',
        body: JSON.stringify(teamData),
        headers: {
          'Prefer': 'return=representation',
        },
      });
      
      const createdTeam = response && response.length > 0 ? response[0] : null;
      
      // Also store locally for offline access
      if (createdTeam) {
        const existingTeamsJson = await AsyncStorage.getItem('local_teams');
        const existingTeams = existingTeamsJson ? JSON.parse(existingTeamsJson) : [];
        existingTeams.push(createdTeam);
        await AsyncStorage.setItem('local_teams', JSON.stringify(existingTeams));
      }
      
      return createdTeam;
    } catch (error) {
      console.error('Error creating team:', error);
      
      // Fallback to local storage if Supabase fails
      try {
        const localTeam = {
          ...team,
          id: Date.now().toString(),
          created_at: new Date().toISOString(),
          players_count: 0
        };
        
        const existingTeamsJson = await AsyncStorage.getItem('local_teams');
        const existingTeams = existingTeamsJson ? JSON.parse(existingTeamsJson) : [];
        existingTeams.push(localTeam);
        await AsyncStorage.setItem('local_teams', JSON.stringify(existingTeams));
        
        console.log('Stored team locally as fallback');
        return localTeam;
      } catch (storageError) {
        console.error('Error storing team locally:', storageError);
        return null;
      }
    }
  },
  
  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | null> {
    try {
      const response = await fetchFromSupabase(`/rest/v1/teams?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: {
          'Prefer': 'return=representation',
        },
      });
      return response && response.length > 0 ? response[0] : null;
    } catch (error) {
      console.error(`Error updating team with id ${id}:`, error);
      return null;
    }
  },
  
  async deleteTeam(id: string): Promise<boolean> {
    try {
      await fetchFromSupabase(`/rest/v1/teams?id=eq.${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error(`Error deleting team with id ${id}:`, error);
      return false;
    }
  }
};

// Player operations
export const playerService = {
  async getPlayers(): Promise<Player[]> {
    try {
      console.log('Fetching players from Supabase');
      // Try to fetch from Supabase first
      const response = await fetchFromSupabase('/rest/v1/players?select=*&order=name');
      
      if (response && response.length > 0) {
        // Store the fetched players locally for offline access
        await AsyncStorage.setItem('local_players', JSON.stringify(response));
        return response;
      }
      
      // If no players found in Supabase, try to get from local storage
      const localPlayersJson = await AsyncStorage.getItem('local_players');
      if (localPlayersJson) {
        const localPlayers = JSON.parse(localPlayersJson);
        console.log('Returning players from local storage:', localPlayers.length);
        return localPlayers;
      }
      
      // If no local players found either, return default mock data
      console.log('No players found, returning default mock data');
      const defaultPlayers = [
        {
          id: '1',
          name: 'John Smith',
          team_id: '1',
          position: 'Forward',
          jersey_number: 10,
          stats: { goals: 12, assists: 5 },
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Maria Nangolo',
          team_id: '1',
          position: 'Midfielder',
          jersey_number: 8,
          stats: { goals: 5, assists: 10 },
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'David Shikongo',
          team_id: '2',
          position: 'Defender',
          jersey_number: 4,
          stats: { goals: 1, assists: 3 },
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Sarah Hausiku',
          team_id: '3',
          position: 'Goalkeeper',
          jersey_number: 1,
          stats: { goals: 0, assists: 0 },
          created_at: new Date().toISOString()
        }
      ];
      
      // Store the default players locally for future use
      await AsyncStorage.setItem('local_players', JSON.stringify(defaultPlayers));
      return defaultPlayers;
    } catch (error) {
      console.error('Error fetching players:', error);
      
      // Try to get from local storage as fallback
      try {
        const localPlayersJson = await AsyncStorage.getItem('local_players');
        if (localPlayersJson) {
          const localPlayers = JSON.parse(localPlayersJson);
          console.log('Error fetching from Supabase, returning local players:', localPlayers.length);
          return localPlayers;
        }
      } catch (storageError) {
        console.error('Error accessing local storage:', storageError);
      }
      
      return [];
    }
  },
  
  async getPlayersByTeam(teamId: string): Promise<Player[]> {
    try {
      console.log(`Fetching players for team ${teamId}`);
      // Try to fetch from Supabase first
      const response = await fetchFromSupabase(`/rest/v1/players?team_id=eq.${teamId}&select=*`);
      
      if (response && response.length > 0) {
        return response;
      }
      
      // If no players found in Supabase or there was an error, try to get from local storage
      try {
        const localPlayersJson = await AsyncStorage.getItem('local_players');
        if (localPlayersJson) {
          const localPlayers = JSON.parse(localPlayersJson);
          // Filter to only include players for this team
          const teamPlayers = localPlayers.filter((p: Player) => p.team_id === teamId);
          console.log(`Returning ${teamPlayers.length} players for team ${teamId} from local storage`);
          return teamPlayers;
        }
      } catch (storageError) {
        console.error('Error accessing local storage:', storageError);
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching players for team ${teamId}:`, error);
      
      // Try to get from local storage as fallback
      try {
        const localPlayersJson = await AsyncStorage.getItem('local_players');
        if (localPlayersJson) {
          const localPlayers = JSON.parse(localPlayersJson);
          const teamPlayers = localPlayers.filter((p: Player) => p.team_id === teamId);
          console.log(`Error fetching from Supabase, returning ${teamPlayers.length} local players for team ${teamId}`);
          return teamPlayers;
        }
      } catch (storageError) {
        console.error('Error accessing local storage:', storageError);
      }
      
      return [];
    }
  },
  
  async getPlayerById(id: string): Promise<Player | null> {
    try {
      const response = await fetchFromSupabase(`/rest/v1/players?id=eq.${id}&select=*`);
      return response && response.length > 0 ? response[0] : null;
    } catch (error) {
      console.error(`Error fetching player with id ${id}:`, error);
      return null;
    }
  },
  
  async createPlayer(player: Player): Promise<Player | null> {
    try {
      console.log('Creating player in Supabase:', player);
      
      // Format player data to match database schema
      // Convert team_id from team name to actual team ID if it's a string name
      let teamId = player.team_id;
      if (typeof teamId === 'string' && !teamId.match(/^[0-9a-f-]+$/i)) {
        // This is likely a team name, not an ID. Let's find the actual team ID
        try {
          const teamsResponse = await fetchFromSupabase('/rest/v1/teams?select=id,name');
          if (teamsResponse && teamsResponse.length > 0) {
            const matchingTeam = teamsResponse.find((team: any) => team.name === teamId);
            if (matchingTeam) {
              teamId = matchingTeam.id;
            }
          }
        } catch (error) {
          console.error('Error looking up team id:', error);
        }
      }
      
      // Prepare the data to match database schema
      const playerData = {
        id: player.id,
        name: player.name,
        team_id: teamId,
        position: player.position,
        jersey_number: player.jersey_number,
        stats: player.stats,
        created_at: player.created_at || new Date().toISOString()
      };
      
      const response = await fetchFromSupabase('/rest/v1/players', {
        method: 'POST',
        body: JSON.stringify(playerData),
        headers: {
          'Prefer': 'return=representation',
        },
      });
      
      const createdPlayer = response && response.length > 0 ? response[0] : null;
      
      // Store locally for offline access
      if (createdPlayer) {
        try {
          const localPlayersJson = await AsyncStorage.getItem('local_players');
          const localPlayers = localPlayersJson ? JSON.parse(localPlayersJson) : [];
          localPlayers.push(createdPlayer);
          await AsyncStorage.setItem('local_players', JSON.stringify(localPlayers));
        } catch (storageError) {
          console.error('Error storing player locally:', storageError);
        }
      }
      
      return createdPlayer;
    } catch (error) {
      console.error('Error creating player:', error);
      
      // Fallback to local storage if Supabase fails
      try {
        const localPlayer = {
          ...player,
          id: player.id || Date.now().toString(),
          created_at: player.created_at || new Date().toISOString()
        };
        
        const localPlayersJson = await AsyncStorage.getItem('local_players');
        const localPlayers = localPlayersJson ? JSON.parse(localPlayersJson) : [];
        localPlayers.push(localPlayer);
        await AsyncStorage.setItem('local_players', JSON.stringify(localPlayers));
        
        console.log('Stored player locally as fallback');
        return localPlayer;
      } catch (storageError) {
        console.error('Error storing player locally:', storageError);
        return null;
      }
    }
  },
  
  // Helper method to increment a team's player count
  async incrementTeamPlayerCount(teamId: string): Promise<void> {
    try {
      // Get the team
      const teams = await teamService.getTeams();
      const team = teams.find(t => t.id === teamId);
      
      if (team) {
        const updatedCount = (team.players_count || 0) + 1;
        
        // Update in Supabase
        await fetchFromSupabase(`/rest/v1/teams?id=eq.${teamId}`, {
          method: 'PATCH',
          body: JSON.stringify({ players_count: updatedCount }),
        }).catch(err => console.error('Error updating team player count in Supabase:', err));
        
        // Update in local storage
        const localTeamsJson = await AsyncStorage.getItem('local_teams');
        if (localTeamsJson) {
          const localTeams = JSON.parse(localTeamsJson);
          const teamIndex = localTeams.findIndex((t: Team) => t.id === teamId);
          
          if (teamIndex >= 0) {
            localTeams[teamIndex].players_count = updatedCount;
            await AsyncStorage.setItem('local_teams', JSON.stringify(localTeams));
          }
        }
      }
    } catch (error) {
      console.error('Error incrementing team player count:', error);
    }
  },
  
  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | null> {
    try {
      const response = await fetchFromSupabase(`/rest/v1/players?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: {
          'Prefer': 'return=representation',
        },
      });
      return response && response.length > 0 ? response[0] : null;
    } catch (error) {
      console.error(`Error updating player with id ${id}:`, error);
      return null;
    }
  },
  
  async deletePlayer(id: string): Promise<boolean> {
    try {
      await fetchFromSupabase(`/rest/v1/players?id=eq.${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error(`Error deleting player with id ${id}:`, error);
      return false;
    }
  }
};

// Authentication operations
export const authService = {
  async signUp(email: string, password: string, displayName?: string): Promise<{ user: any; error: any }> {
    try {
      // Create the signup data with optional display name
      const signupData = { 
        email, 
        password,
        data: displayName ? { display_name: displayName } : undefined,
        // Add auto-confirm flag to bypass email confirmation
        auto_confirm: true
      };
      
      console.log('Signing up with auto_confirm enabled');
      
      const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData),
      });

      const data = await response.json();
      console.log('Signup response status:', response.status);

      if (!response.ok) {
        console.error('Signup failed:', data.error || 'Unknown error');
        return { user: null, error: data.error || 'Failed to sign up' };
      }

      console.log('Signup successful');
      
      // Store the session in AsyncStorage
      if (data.access_token) {
        await AsyncStorage.setItem('supabase.auth.token', data.access_token);
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { user: null, error: 'An unexpected error occurred' };
    }
  },

  async signIn(email: string, password: string): Promise<{ user: any; error: any }> {
    try {
      console.log('Attempting to sign in with:', { email });
      
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Sign in response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to sign in';
        if (data.error) {
          errorMessage = data.error;
        } else if (data.error_description) {
          errorMessage = data.error_description;
        } else if (data.msg) {
          errorMessage = data.msg;
        }
        
        // If the error is about email not being confirmed, try to auto-confirm it
        if (errorMessage === 'Email not confirmed') {
          console.log('Attempting to auto-confirm email...');
          try {
            // Try to auto-confirm the email
            const confirmResponse = await fetch(`${supabaseUrl}/auth/v1/verify`, {
              method: 'POST',
              headers: {
                'apikey': supabaseAnonKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, type: 'signup' }),
            });
            
            if (confirmResponse.ok) {
              console.log('Email auto-confirmed, trying to sign in again...');
              // Try signing in again
              return this.signIn(email, password);
            }
          } catch (confirmError) {
            console.error('Error auto-confirming email:', confirmError);
          }
        }
        
        console.error('Sign in failed:', errorMessage);
        return { user: null, error: errorMessage };
      }

      console.log('Sign in successful, processing response');
      
      // Create a user object with the session data
      const user = {
        id: data.user?.id || 'unknown',
        email: email,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        ...data.user
      };
      
      // Store the session and user data in AsyncStorage
      if (data.access_token) {
        await AsyncStorage.setItem('supabase.auth.token', data.access_token);
        if (data.refresh_token) {
          await AsyncStorage.setItem('supabase.auth.refresh', data.refresh_token);
        }
        
        // Store the user data as well
        if (user) {
          await AsyncStorage.setItem('supabase.auth.user', JSON.stringify(user));
        }
      }

      console.log('Returning user object:', { id: user.id, email: user.email });
      return { user, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { user: null, error: 'An unexpected error occurred' };
    }
  },

  async signOut(): Promise<{ error: any }> {
    try {
      console.log('Signing out user');
      const token = await AsyncStorage.getItem('supabase.auth.token');
      
      if (!token) {
        console.log('No token found, user already signed out');
        // Already signed out
        return { error: null };
      }

      const response = await fetch(`${supabaseUrl}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Clear all auth data from AsyncStorage regardless of the response
      console.log('Clearing auth data from AsyncStorage');
      await AsyncStorage.removeItem('supabase.auth.token');
      await AsyncStorage.removeItem('supabase.auth.refresh');
      await AsyncStorage.removeItem('supabase.auth.user');

      if (!response.ok) {
        const data = await response.json();
        console.error('Error from logout API:', data.error);
        return { error: data.error || 'Failed to sign out' };
      }

      console.log('User successfully signed out');
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      // Still try to clear local storage in case of API error
      try {
        await AsyncStorage.removeItem('supabase.auth.token');
        await AsyncStorage.removeItem('supabase.auth.refresh');
        await AsyncStorage.removeItem('supabase.auth.user');
      } catch (e) {
        console.error('Error clearing AsyncStorage:', e);
      }
      return { error: 'An unexpected error occurred' };
    }
  },

  async getCurrentUser(): Promise<{ user: any; error: any }> {
    try {
      console.log('Checking for existing user session');
      const token = await AsyncStorage.getItem('supabase.auth.token');
      
      if (!token) {
        console.log('No token found in AsyncStorage');
        return { user: null, error: 'Not authenticated' };
      }

      // First try to get the user from AsyncStorage for faster loading
      const cachedUserJson = await AsyncStorage.getItem('supabase.auth.user');
      if (cachedUserJson) {
        try {
          const cachedUser = JSON.parse(cachedUserJson);
          console.log('Retrieved user from AsyncStorage:', { id: cachedUser.id, email: cachedUser.email });
          return { user: cachedUser, error: null };
        } catch (e) {
          console.error('Error parsing cached user:', e);
          // Continue with API call if parsing fails
        }
      }

      // If no cached user, fetch from API
      console.log('Fetching user from Supabase API');
      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Failed to get user from API:', data.error);
        return { user: null, error: data.error || 'Failed to get user' };
      }

      // Cache the user data
      await AsyncStorage.setItem('supabase.auth.user', JSON.stringify(data));
      console.log('User data retrieved from API and cached');

      return { user: data, error: null };
    } catch (error) {
      console.error('Error getting current user:', error);
      return { user: null, error: 'An unexpected error occurred' };
    }
  },

  async resetPassword(email: string): Promise<{ error: any }> {
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/recover`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        return { error: data.error || 'Failed to send password reset email' };
      }

      return { error: null };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { error: 'An unexpected error occurred' };
    }
  },
};

// Event operations
export const eventService = {
  async getEvents(): Promise<Event[]> {
    try {
      console.log('Fetching events from Supabase');
      // Try to fetch from Supabase first
      const response = await fetchFromSupabase('/rest/v1/events?select=*&order=date');
      
      if (response && response.length > 0) {
        // Store the fetched events locally for offline access
        await AsyncStorage.setItem('local_events', JSON.stringify(response));
        return response;
      }
      
      // If no events found in Supabase, try to get from local storage
      const localEventsJson = await AsyncStorage.getItem('local_events');
      if (localEventsJson) {
        const localEvents = JSON.parse(localEventsJson);
        console.log('Returning events from local storage:', localEvents.length);
        return localEvents;
      }
      
      // If no local events found either, return default mock data
      console.log('No events found, returning default mock data');
      const defaultEvents = [
        {
          id: '1',
          title: 'National Championship Finals',
          description: 'The final match of the National Hockey Championship',
          location: 'Windhoek Stadium',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          time: '15:00',
          teams: ['Windhoek Warriors', 'Swakopmund Strikers'],
          type: 'match',
          status: 'upcoming',
          created_at: new Date().toISOString(),
          registration_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          image: 'https://example.com/national-championship-finals.jpg'
        },
        {
          id: '2',
          title: 'Junior Training Camp',
          description: 'Training camp for junior hockey players',
          location: 'Swakopmund Sports Center',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          time: '09:00',
          teams: [],
          type: 'training',
          status: 'upcoming',
          created_at: new Date().toISOString(),
          registration_deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          image: 'https://example.com/junior-training-camp.jpg'
        },
        {
          id: '3',
          title: 'Regional Tournament',
          description: 'Regional hockey tournament featuring teams from across Namibia',
          location: 'Walvis Bay Hockey Field',
          date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          time: '10:00',
          teams: ['Windhoek Warriors', 'Swakopmund Strikers', 'Walvis Bay Wolves'],
          type: 'tournament',
          status: 'upcoming',
          created_at: new Date().toISOString(),
          registration_deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          image: 'https://example.com/regional-tournament.jpg'
        }
      ];
      
      // Store the default events locally for future use
      await AsyncStorage.setItem('local_events', JSON.stringify(defaultEvents));
      return defaultEvents;
    } catch (error) {
      console.error('Error fetching events:', error);
      
      // Try to get from local storage as fallback
      try {
        const localEventsJson = await AsyncStorage.getItem('local_events');
        if (localEventsJson) {
          const localEvents = JSON.parse(localEventsJson);
          console.log('Error fetching from Supabase, returning local events:', localEvents.length);
          return localEvents;
        }
      } catch (storageError) {
        console.error('Error accessing local storage:', storageError);
      }
      
      return [];
    }
  },
  
  async getUpcomingEvents(): Promise<Event[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetchFromSupabase(`/rest/v1/events?date=gte.${today}&select=*&order=date`);
      return response || [];
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }
  },
  
  async getEventById(id: string): Promise<Event | null> {
    try {
      const response = await fetchFromSupabase(`/rest/v1/events?id=eq.${id}&select=*`);
      return response && response.length > 0 ? response[0] : null;
    } catch (error) {
      console.error(`Error fetching event with id ${id}:`, error);
      return null;
    }
  },
  
  async createEvent(event: Event): Promise<Event | null> {
    try {
      console.log('Creating event in Supabase:', event);
      
      // Prepare the event data with required fields
      const eventData = {
        ...event,
        id: event.id || Date.now().toString(),
        created_at: new Date().toISOString()
      };
      
      // Store in Supabase
      const response = await fetchFromSupabase('/rest/v1/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
        headers: {
          'Prefer': 'return=representation',
        },
      });
      
      const createdEvent = response && response.length > 0 ? response[0] : null;
      
      // Also store locally for offline access
      if (createdEvent) {
        const existingEventsJson = await AsyncStorage.getItem('local_events');
        const existingEvents = existingEventsJson ? JSON.parse(existingEventsJson) : [];
        existingEvents.push(createdEvent);
        await AsyncStorage.setItem('local_events', JSON.stringify(existingEvents));
      }
      
      return createdEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      
      // Fallback to local storage if Supabase fails
      try {
        const localEvent = {
          ...event,
          id: event.id || Date.now().toString(),
          created_at: new Date().toISOString()
        };
        
        const existingEventsJson = await AsyncStorage.getItem('local_events');
        const existingEvents = existingEventsJson ? JSON.parse(existingEventsJson) : [];
        existingEvents.push(localEvent);
        await AsyncStorage.setItem('local_events', JSON.stringify(existingEvents));
        
        console.log('Stored event locally as fallback');
        return localEvent;
      } catch (storageError) {
        console.error('Error storing event locally:', storageError);
        return null;
      }
    }
  },
  
  async updateEvent(id: string, updates: Partial<Event>): Promise<Event | null> {
    try {
      const response = await fetchFromSupabase(`/rest/v1/events?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        headers: {
          'Prefer': 'return=representation',
        },
      });
      return response && response.length > 0 ? response[0] : null;
    } catch (error) {
      console.error(`Error updating event with id ${id}:`, error);
      return null;
    }
  },
  
  async deleteEvent(id: string): Promise<boolean> {
    try {
      // Make the DELETE request with a custom fetch to handle empty responses
      const url = `${supabaseUrl}/rest/v1/events?id=eq.${id}`;
      const headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      };
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
      }
      
      // Also remove from local storage
      try {
        const localEventsJson = await AsyncStorage.getItem('local_events');
        if (localEventsJson) {
          const localEvents = JSON.parse(localEventsJson);
          const updatedEvents = localEvents.filter((event: Event) => event.id !== id);
          await AsyncStorage.setItem('local_events', JSON.stringify(updatedEvents));
          console.log('Removed event from local storage');
        }
      } catch (storageError) {
        console.error('Error updating local storage after deletion:', storageError);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting event with id ${id}:`, error);
      return false;
    }
  },
  
  async registerForEvent(eventId: string, userId: string): Promise<boolean> {
    try {
      await fetchFromSupabase('/rest/v1/event_registrations', {
        method: 'POST',
        body: JSON.stringify({ event_id: eventId, user_id: userId }),
      });
      return true;
    } catch (error) {
      console.error(`Error registering for event ${eventId}:`, error);
      return false;
    }
  }
};

export const announcementService = {
  async getAnnouncements(): Promise<Announcement[]> {
    try {
      console.log('Fetching announcements from Supabase');
      // Try to fetch from Supabase first
      const response = await fetchFromSupabase('/rest/v1/announcements?select=*&order=created_at.desc');
      
      if (response && response.length > 0) {
        // Get replies for each announcement
        const announcementsWithReplies = await Promise.all(
          response.map(async (announcement: Announcement) => {
            const replies = await this.getRepliesForAnnouncement(announcement.id);
            return { ...announcement, replies };
          })
        );
        
        // Store the fetched announcements locally for offline access
        await AsyncStorage.setItem('local_announcements', JSON.stringify(announcementsWithReplies));
        return announcementsWithReplies;
      }
      
      // If no announcements found in Supabase, try to get from local storage
      const localAnnouncementsJson = await AsyncStorage.getItem('local_announcements');
      if (localAnnouncementsJson) {
        const localAnnouncements = JSON.parse(localAnnouncementsJson);
        console.log('Returning announcements from local storage:', localAnnouncements.length);
        return localAnnouncements;
      }
      
      // If no local announcements found either, return default mock data
      console.log('No announcements found, returning default mock data');
      const defaultAnnouncements = [
        {
          id: '1',
          sender_name: 'Admin',
          message: 'Welcome to the Hockey Updates Channel! This is where you\'ll find important announcements about games, practices, and events.',
          is_admin: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
          likes: 5,
          liked_by_ids: [],
          replies: []
        },
        {
          id: '2',
          sender_name: 'Admin',
          message: 'Please do rate and leave a review on the app based on your current experience. We rely heavily on your feedback to make improvements!',
          is_admin: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          likes: 3,
          liked_by_ids: [],
          replies: []
        }
      ];
      
      // Store the default announcements locally for future use
      await AsyncStorage.setItem('local_announcements', JSON.stringify(defaultAnnouncements));
      return defaultAnnouncements;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      
      // Try to get from local storage as fallback
      try {
        const localAnnouncementsJson = await AsyncStorage.getItem('local_announcements');
        if (localAnnouncementsJson) {
          const localAnnouncements = JSON.parse(localAnnouncementsJson);
          console.log('Error fetching from Supabase, returning local announcements:', localAnnouncements.length);
          return localAnnouncements;
        }
      } catch (storageError) {
        console.error('Error accessing local storage:', storageError);
      }
      
      return [];
    }
  },
  
  async getAnnouncementById(id: string): Promise<Announcement | null> {
    try {
      const response = await fetchFromSupabase(`/rest/v1/announcements?id=eq.${id}&select=*`);
      
      if (response && response.length > 0) {
        const announcement = response[0];
        const replies = await this.getRepliesForAnnouncement(announcement.id);
        return { ...announcement, replies };
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching announcement with id ${id}:`, error);
      return null;
    }
  },
  
  async getRepliesForAnnouncement(announcementId: string): Promise<Reply[]> {
    try {
      const response = await fetchFromSupabase(
        `/rest/v1/announcement_replies?announcement_id=eq.${announcementId}&select=*&order=created_at.asc`
      );
      
      return response || [];
    } catch (error) {
      console.error(`Error fetching replies for announcement ${announcementId}:`, error);
      return [];
    }
  },
  
  async createAnnouncement(announcement: Partial<Announcement>): Promise<Announcement | null> {
    try {
      console.log('Creating announcement in Supabase:', announcement);
      
      // Prepare the announcement data with required fields
      const announcementData = {
        ...announcement,
        // Don't override id if provided, but ensure it's not set for new announcements
        // so Supabase will generate a proper UUID
        id: announcement.id?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) 
          ? announcement.id 
          : undefined,
        created_at: announcement.created_at || new Date().toISOString(),
        likes: announcement.likes || 0,
        liked_by_ids: announcement.liked_by_ids || []
      };
      
      // Store in Supabase
      const response = await fetchFromSupabase('/rest/v1/announcements', {
        method: 'POST',
        body: JSON.stringify(announcementData),
        headers: {
          'Prefer': 'return=representation',
        },
      });
      
      const createdAnnouncement = response && response.length > 0 ? { ...response[0], replies: [] } : null;
      
      // Also update local storage
      if (createdAnnouncement) {
        const existingAnnouncementsJson = await AsyncStorage.getItem('local_announcements');
        const existingAnnouncements = existingAnnouncementsJson ? JSON.parse(existingAnnouncementsJson) : [];
        
        // If the announcement already exists in local storage, replace it
        const updatedAnnouncements = existingAnnouncements.filter(
          (a: Announcement) => announcement.id ? a.id !== announcement.id : true
        );
        
        updatedAnnouncements.unshift(createdAnnouncement); // Add to beginning
        await AsyncStorage.setItem('local_announcements', JSON.stringify(updatedAnnouncements));
      }
      
      return createdAnnouncement;
    } catch (error) {
      console.error('Error creating announcement:', error);
      
      // Fallback to local storage if Supabase fails
      try {
        const localAnnouncement = {
          ...announcement,
          id: announcement.id || `local-${Date.now().toString()}`,
          created_at: announcement.created_at || new Date().toISOString(),
          likes: announcement.likes || 0,
          liked_by_ids: announcement.liked_by_ids || [],
          replies: announcement.replies || []
        };
        
        const existingAnnouncementsJson = await AsyncStorage.getItem('local_announcements');
        const existingAnnouncements = existingAnnouncementsJson ? JSON.parse(existingAnnouncementsJson) : [];
        
        // If the announcement already exists in local storage, replace it
        const updatedAnnouncements = existingAnnouncements.filter(
          (a: Announcement) => announcement.id ? a.id !== announcement.id : true
        );
        
        updatedAnnouncements.unshift(localAnnouncement); // Add to beginning
        await AsyncStorage.setItem('local_announcements', JSON.stringify(updatedAnnouncements));
        
        console.log('Stored announcement locally as fallback');
        return localAnnouncement as Announcement;
      } catch (storageError) {
        console.error('Error storing announcement locally:', storageError);
        return null;
      }
    }
  },
  
  async addReply(reply: Partial<Reply>): Promise<Reply | null> {
    try {
      console.log('Adding reply in Supabase:', reply);
      
      // Prepare the reply data with required fields
      const replyData = {
        ...reply,
        created_at: new Date().toISOString()
      };
      
      // Store in Supabase
      const response = await fetchFromSupabase('/rest/v1/announcement_replies', {
        method: 'POST',
        body: JSON.stringify(replyData),
        headers: {
          'Prefer': 'return=representation',
        },
      });
      
      const createdReply = response && response.length > 0 ? response[0] : null;
      
      // Also update local storage
      if (createdReply && reply.announcement_id) {
        const existingAnnouncementsJson = await AsyncStorage.getItem('local_announcements');
        if (existingAnnouncementsJson) {
          const existingAnnouncements = JSON.parse(existingAnnouncementsJson);
          const updatedAnnouncements = existingAnnouncements.map((announcement: Announcement) => {
            if (announcement.id === reply.announcement_id) {
              return {
                ...announcement,
                replies: [...(announcement.replies || []), createdReply]
              };
            }
            return announcement;
          });
          await AsyncStorage.setItem('local_announcements', JSON.stringify(updatedAnnouncements));
        }
      }
      
      return createdReply;
    } catch (error) {
      console.error('Error adding reply:', error);
      
      // Fallback to local storage if Supabase fails
      try {
        if (reply.announcement_id) {
          const localReply = {
            ...reply,
            id: Date.now().toString(),
            created_at: new Date().toISOString()
          };
          
          const existingAnnouncementsJson = await AsyncStorage.getItem('local_announcements');
          if (existingAnnouncementsJson) {
            const existingAnnouncements = JSON.parse(existingAnnouncementsJson);
            const updatedAnnouncements = existingAnnouncements.map((announcement: Announcement) => {
              if (announcement.id === reply.announcement_id) {
                return {
                  ...announcement,
                  replies: [...(announcement.replies || []), localReply]
                };
              }
              return announcement;
            });
            await AsyncStorage.setItem('local_announcements', JSON.stringify(updatedAnnouncements));
          }
          
          console.log('Stored reply locally as fallback');
          return localReply as Reply;
        }
      } catch (storageError) {
        console.error('Error storing reply locally:', storageError);
      }
      
      return null;
    }
  },
  
  async likeAnnouncement(announcementId: string, userId: string): Promise<boolean> {
    try {
      // First try to get the announcement from Supabase
      const response = await fetchFromSupabase(`/rest/v1/announcements?id=eq.${announcementId}&select=*`);
      
      // Check if the announcement exists in Supabase
      if (response && response.length > 0) {
        const announcement = response[0];
        const likedByIds = announcement.liked_by_ids || [];
        const isLiked = likedByIds.includes(userId);
        
        // Toggle like status
        let updatedLikedByIds;
        let updatedLikes;
        
        if (isLiked) {
          // Remove like
          updatedLikedByIds = likedByIds.filter((id: string) => id !== userId);
          updatedLikes = Math.max(0, announcement.likes - 1);
        } else {
          // Add like
          updatedLikedByIds = [...likedByIds, userId];
          updatedLikes = (announcement.likes || 0) + 1;
        }
        
        // Update in Supabase
        await fetchFromSupabase(`/rest/v1/announcements?id=eq.${announcementId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            likes: updatedLikes,
            liked_by_ids: updatedLikedByIds
          }),
        });
      } else {
        // Announcement doesn't exist in Supabase, but might exist locally
        // Get from local storage and check
        const localAnnouncementsJson = await AsyncStorage.getItem('local_announcements');
        if (!localAnnouncementsJson) {
          console.log('No local announcements found');
          return false;
        }

        const localAnnouncements = JSON.parse(localAnnouncementsJson);
        const localAnnouncement = localAnnouncements.find((a: Announcement) => a.id === announcementId);
        
        if (!localAnnouncement) {
          console.log(`Announcement with id ${announcementId} not found locally either`);
          return false;
        }
        
        console.log('Announcement found in local storage but not in Supabase');
        
        // Try to create the announcement in Supabase first
        try {
          await this.createAnnouncement({
            id: localAnnouncement.id,
            sender_name: localAnnouncement.sender_name,
            message: localAnnouncement.message,
            created_at: localAnnouncement.created_at,
            likes: localAnnouncement.likes,
            liked_by_ids: localAnnouncement.liked_by_ids || []
          });
          
          // Now try liking again recursively since the announcement should exist in Supabase
          return this.likeAnnouncement(announcementId, userId);
        } catch (createError) {
          console.error('Error creating announcement in Supabase:', createError);
          // Continue with local storage operation
        }
      }
      
      // Update in local storage for both cases
      try {
        const existingAnnouncementsJson = await AsyncStorage.getItem('local_announcements');
        if (existingAnnouncementsJson) {
          const existingAnnouncements = JSON.parse(existingAnnouncementsJson);
          const updatedAnnouncements = existingAnnouncements.map((a: Announcement) => {
            if (a.id === announcementId) {
              const isLiked = (a.liked_by_ids || []).includes(userId);
              return {
                ...a,
                likes: isLiked ? Math.max(0, a.likes - 1) : (a.likes || 0) + 1,
                liked_by_ids: isLiked 
                  ? (a.liked_by_ids || []).filter((id: string) => id !== userId) 
                  : [...(a.liked_by_ids || []), userId],
                liked_by_user: !isLiked
              };
            }
            return a;
          });
          await AsyncStorage.setItem('local_announcements', JSON.stringify(updatedAnnouncements));
        }
      } catch (storageError) {
        console.error('Error updating local storage:', storageError);
      }
      
      return true;
    } catch (error) {
      console.error(`Error liking announcement ${announcementId}:`, error);
      
      // Fall back to updating only local storage
      try {
        const existingAnnouncementsJson = await AsyncStorage.getItem('local_announcements');
        if (existingAnnouncementsJson) {
          const existingAnnouncements = JSON.parse(existingAnnouncementsJson);
          const updatedAnnouncements = existingAnnouncements.map((a: Announcement) => {
            if (a.id === announcementId) {
              const isLiked = (a.liked_by_ids || []).includes(userId);
              return {
                ...a,
                likes: isLiked ? Math.max(0, a.likes - 1) : (a.likes || 0) + 1,
                liked_by_ids: isLiked 
                  ? (a.liked_by_ids || []).filter((id: string) => id !== userId) 
                  : [...(a.liked_by_ids || []), userId],
                liked_by_user: !isLiked
              };
            }
            return a;
          });
          await AsyncStorage.setItem('local_announcements', JSON.stringify(updatedAnnouncements));
          return true;
        }
      } catch (storageError) {
        console.error('Error updating local storage:', storageError);
      }
      
      return false;
    }
  },
  
  async deleteAnnouncement(id: string): Promise<boolean> {
    try {
      await fetchFromSupabase(`/rest/v1/announcements?id=eq.${id}`, {
        method: 'DELETE',
      });
      
      // Also remove from local storage
      try {
        const existingAnnouncementsJson = await AsyncStorage.getItem('local_announcements');
        if (existingAnnouncementsJson) {
          const existingAnnouncements = JSON.parse(existingAnnouncementsJson);
          const updatedAnnouncements = existingAnnouncements.filter((a: Announcement) => a.id !== id);
          await AsyncStorage.setItem('local_announcements', JSON.stringify(updatedAnnouncements));
        }
      } catch (storageError) {
        console.error('Error updating local storage:', storageError);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting announcement with id ${id}:`, error);
      return false;
    }
  }
};
