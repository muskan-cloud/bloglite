// store.js

const store = new Vuex.Store({
  state: {
    currentUser: null,
    currentUserId: null,
    currentUserEmail: null,
    currentUsername: null,
    followingEmails: [],
    followerEmails: [],
   
  },
  mutations: {
    setCurrentUser(state, user) {
      state.currentUser = user;
      state.currentUserId = user.id;
      state.currentUserEmail = user.email;
      state.currentUsername = user.username;
    },
    setFollowingEmails(state, followingEmails) {
      state.followingEmails = followingEmails;
    },
    setFollowerEmails(state, followerEmails) {
      state.followerEmails = followerEmails;
    }
  }
});

export default store;
