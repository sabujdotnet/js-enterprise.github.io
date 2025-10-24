// Authentication and User Management Module
class AuthManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.loadCurrentUser();
    this.checkAuthentication();
  }

  // Load current user from localStorage
  loadCurrentUser() {
    try {
      const userData = localStorage.getItem('shutteringProCurrentUser');
      if (userData) {
        this.currentUser = JSON.parse(userData);
        
        // Check if session is still valid (24 hours max for non-remembered sessions)
        if (!this.currentUser.rememberMe) {
          const loginTime = new Date(this.currentUser.loginTime);
          const now = new Date();
          const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
          
          if (hoursDiff > 24) {
            this.logout();
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error loading user session:', error);
      this.logout();
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Get current user data
  getCurrentUser() {
    return this.currentUser;
  }

  // Update user profile
  updateUserProfile(updates) {
    if (!this.isAuthenticated()) return false;

    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.id === this.currentUser.userId);
      
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        this.saveUsers(users);
        
        // Update current session
        this.currentUser = { ...this.currentUser, ...updates };
        localStorage.setItem('shutteringProCurrentUser', JSON.stringify(this.currentUser));
        
        return true;
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
    
    return false;
  }

  // Change password
  changePassword(currentPassword, newPassword) {
    if (!this.isAuthenticated()) return false;

    try {
      const users = this.getUsers();
      const user = users.find(u => u.id === this.currentUser.userId);
      
      if (user && user.password === currentPassword) {
        user.password = newPassword;
        this.saveUsers(users);
        return true;
      }
    } catch (error) {
      console.error('Error changing password:', error);
    }
    
    return false;
  }

  // Logout user
  logout() {
    this.currentUser = null;
    localStorage.removeItem('shutteringProCurrentUser');
    window.location.href = 'login.html';
  }

  // Get all users (admin function)
  getUsers() {
    return JSON.parse(localStorage.getItem('shutteringProUsers') || '[]');
  }

  // Save users to localStorage
  saveUsers(users) {
    localStorage.setItem('shutteringProUsers', JSON.stringify(users));
  }

  // Check authentication and redirect if needed
  checkAuthentication() {
    if (!this.isAuthenticated() && !window.location.href.includes('login.html')) {
      window.location.href = 'login.html';
    }
  }

  // Get user statistics
  getUserStats() {
    if (!this.isAuthenticated()) return null;

    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const userInvoices = invoices.filter(inv => 
      inv.userId === this.currentUser.userId
    );

    return {
      totalInvoices: userInvoices.length,
      totalRevenue: userInvoices.reduce((sum, inv) => {
        const total = parseFloat(inv.total.replace(/[^\d.]/g, '') || 0);
        return sum + total;
      }, 0),
      pendingInvoices: userInvoices.filter(inv => inv.status === 'pending').length,
      paidInvoices: userInvoices.filter(inv => inv.status === 'paid').length
    };
  }
}

// Create global auth instance
window.authManager = new AuthManager();