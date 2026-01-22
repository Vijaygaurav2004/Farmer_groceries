import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';

const USER_KEY = '@farmer_groceries_user';
const ROLE_KEY = '@farmer_groceries_role';

export const storageService = {
  // User storage
  async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async getUser(): Promise<User | null> {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
    await AsyncStorage.removeItem(ROLE_KEY);
  },

  // Role storage
  async saveRole(role: UserRole | null): Promise<void> {
    if (role === null || role === undefined) {
      await AsyncStorage.removeItem(ROLE_KEY);
    } else {
      await AsyncStorage.setItem(ROLE_KEY, role);
    }
  },

  async getRole(): Promise<UserRole | null> {
    return (await AsyncStorage.getItem(ROLE_KEY)) as UserRole | null;
  },
};

