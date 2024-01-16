const search = {
  template:
  `<div>
    <h1>Search Users</h1>
    <form @submit.prevent="searchUsers">
      <input type="text" v-model="searchQuery" placeholder="Search by username">
      <button type="submit">Search</button>
    </form>
    <ul v-if="users.length">
      <li v-for="user in users" :key="user.id">
        <router-link v-if="user.email !== currentUserEmail" :to="'/users/' + user.email">{{ user.username }}</router-link>
        <span v-else><router-link :to="'/users/' + user.email">{{ user.username }}</router-link></span>
        <button v-if="user.email !== currentUserEmail && followStatus[user.email] !== null" @click="followUnfollow(user)">{{ followStatus[user.email] ? 'Unfollow' : 'Follow' }}</button>
      </li>
    </ul>
    <p v-else-if="searched">No users found.</p>
    <footer style="position: fixed; bottom: 0; right: 0;">
      <h3>Back to <router-link :to="'/feed/' + currentUserEmail">your feed</router-link></h3>
    </footer>
  </div>`,

  data() {
    return {
      searchQuery: '',
      users: [],
      searched: false,
      followStatus: {}, // Store follow status for each user as a boolean value
    }
  },
  computed: {
    currentUserEmail() {
      return this.$store.state.currentUserEmail;
    }
  },
  methods: {
    async isFollowing(user) {
      const res = await fetch(`/api/users/${user.email}/followers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth-token'),
        }
      });
      const data = await res.json();
      console.log(data)
      if (res.ok) {
        for (let i = 0; i < data.length; i++) {
          if (data[i].user.email == this.currentUserEmail) {
            this.followStatus[user.email] = true; // Set followStatus to true if current user is following
            return true;
          }
        }
        this.followStatus[user.email] = false; // Set followStatus to false if current user is not following
        return false;
      } else if (res.status == 401) {
        this.$router.push('/');
        store.commit('setAuthToken', null);
      } else {
        console.error(data.message);
      }
    },

    async followUnfollow(user) {
      if (this.followStatus[user.email]) {
        await this.unfollow(user);
        user.is_following = false;
      } else {
        await this.follow(user);
        user.is_following = true;
      }
    }
,    
 async follow(user) {
      const res = await fetch(`/api/users/${user.email}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth-token'),
        },
      });
    
      if (res.ok) {
        // Update the follow status of the user
        this.$set(this.followStatus, user.email, true);
    
        // Update the users array to reflect the new follow relationship
        const index = this.users.findIndex(u => u.email == user.email);
        this.users[index].is_following = true;
      } else if (res.status == 401) {
        this.$router.push('/');
        store.commit('setAuthToken', null);
      } else {
        console.error('Failed to follow user');
      }
    }
    ,
    
    async unfollow(user) {
      const res = await fetch(`/api/users/${user.email}/unfollow`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth-token'),
        },
      });
    
      if (res.ok) {
        // Update the follow status of the user
        this.$set(this.followStatus, user.email, false);
    
        // Update the users array to reflect the removed follow relationship
        const index = this.users.findIndex(u => u.email == user.email);
        if (index > -1) {
          this.users[index].is_following = false;
        }
    
      } else if (res.status == 401) {
        this.$router.push('/');
        store.commit('setAuthToken', null);
      } else {
        console.error('Failed to unfollow user');
      }
    }
    ,
    
    async searchUsers() {
      const res = await fetch(`/api/search/users?q=${this.searchQuery}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth-token'),
        },
      });
      const data = await res.json();
  
      if (res.ok) {
        this.users = data.map(user => {
          user.is_current_user = user.email === this.currentUserEmail;
          user.is_following = false;
          return user;
        });
        this.searched = true;
  
        // Initialize followStatus object with null values for each user in search results
        for (const user of this.users) {
          this.$set(this.followStatus, user.email, null);
        }
  
        // Check whether current user is following each user in search results
        for (const user of this.users) {
          if (user.email !== this.currentUserEmail) {
            user.is_following = await this.isFollowing(user);
            this.$set(this.followStatus, user.email, user.is_following);
          }
        }
      } else if (res.status == 401) {
        this.$router.push('/');
        store.commit('setAuthToken', null);
      } else {
        console.error(data.message);
      }
    },
  }        

}
export default search    
