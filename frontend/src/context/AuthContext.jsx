import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('aiInterviewToken') || '');
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('aiInterviewUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = (newToken, profile) => {
    setToken(newToken);
    setUser(profile);
    localStorage.setItem('aiInterviewToken', newToken);
    localStorage.setItem('aiInterviewUser', JSON.stringify(profile));
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('aiInterviewToken');
    localStorage.removeItem('aiInterviewUser');
  };

  const updateUser = (profile) => {
    setUser(profile);
    localStorage.setItem('aiInterviewUser', JSON.stringify(profile));
  };

  const value = useMemo(() => ({ token, user, login, logout, updateUser }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
// eslint-disable-next-line react-refresh/only-export-components, react/only-export-components
export const useAuth = () => useContext(AuthContext);
