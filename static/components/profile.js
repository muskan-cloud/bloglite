import { logout } from '/static/app.js';

const profile = {
  template: `
  <div id="app">
  <div v-if="success">
  <div>
  <nav class="navbar navbar-expand-lg navbar-light bg-light">
  <div class="navbar-nav">
    <a class="nav-item nav-link" @click="goToFollowers">Followers-{{followers.length}}</a>
    <a class="nav-item nav-link" @click="goToFollowing">Following-{{following.length}}</a>
  </div>
</nav></div>
    <nav class="navbar bg-light">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
      <img v-if="profile.pfp" :src="'data:image/*;charset=utf-8;base64,' + profile.pfp" height="150px" width="150px"><br>
      <div style="text-align: center; flex-grow: 1;">
              <h1 class="navbar-brand mb-0" style="margin-left: 200px;">{{ profile.username }}'s Profile ✨  </h1>
        </div><div><button>
        <router-link :to="'/feed/' + currentUserEmail">your feed</router-link></button><br>
        <button @click="edituser(profile)">Edit your profile</button>
        </div></div>
    </nav>
    
  <h1>Posts-{{ posts.length }}</h1>
  <ul style="list-style: none; margin: 0; padding: 0;">
    <li v-for="postObj in posts" :key="postObj.id" class="card1">
      <h3>
        <router-link :to="{ name: 'profile', params: { email: postObj.user.email } }">
          {{ postObj.user.username }}
        </router-link>
      </h3>
      <br>
      <img :src="'data:image/*;charset=utf-8;base64,' + postObj.picture" height="500px" width="300px"><br>
      <h3>{{ postObj.title }}</h3>
      <button v-if="LikeStatus[postObj.id] !== null" @click="likeUnlike(postObj)">
        {{ LikeStatus[postObj.id] ? 'Unlike' : 'Like' }}
      </button>
      <button v-if="postObj.user.email === currentUserEmail" @click="deletePost(postObj)">Delete</button>
      <button v-if="postObj.user.email === currentUserEmail"@click="editPost(postObj)">Edit</button>
      <form @submit.prevent="addComment(postObj)">
      <input type="text" v-model="commentText[postObj.id]" placeholder="Add a comment...">
      <button type="submit">Add</button>
     </form>
     
     <button @click="commentCollapsed = !commentCollapsed">{{ commentCollapsed ? 'Show Comments' : 'Hide Comments' }}</button>
   <div v-show="!commentCollapsed">
  <ul>
    <li v-for="comment in postObj.comments" :key="comment.id">
      <p>{{ comment.user.username }}: {{ comment.text }}</p>
      <button v-if="comment.user.email === currentUserEmail" @click="deleteComment(postObj, comment)">Delete</button>
    </li>
  </ul>
</div>
  </li>
  </ul>
  <footer style="display: flex; justify-content: flex-end;">
      <div class="buttons">
      
          <button @click="exportBlogCSV()">Export Blog Data</button>
          <button @click="exportUserData()">Export User Data</button>
          
          <button><router-link to="/add_new_post">New_post</router-link></button>
          <button><router-link to="/search">Search</router-link></button>
          <button href="/" @click.prevent="logout">Logout</button>
      </div>
  </footer>
</div>
  <div v-else>
     {{error}}
  </div>
</div>`,

data() {
  return {
    profile: {
      username: '',
      email: '',
      id: null
    },
    posts: [],
    success: true,
    followers: [],
    following: [],
    commentCollapsed:true,
    error: 'Something went wrong',
    LikeStatus:{},
    commentText: {},
  }
},
  computed: {
    currentUserEmail() {
      return this.$store.state.currentUserEmail;
    },
    currentUserUsername(){
      return this.$store.state.currentUsername;
    },
    currentUserId(){
      return this.$store.state.currentUserId;
    }
  },
  async mounted() {
    const email = this.$route.params.email;
    
    // Fetch the user's profile information
    const resProfile = await fetch(`/api/users/${email}`, {
      headers: {
        'Authentication-Token': localStorage.getItem('auth-token'),
      },
    })
    const dataProfile = await resProfile.json()
    console.log(dataProfile)

    if (resProfile.ok) {
      this.profile = dataProfile
    } else if (resProfile.status == 401) {
      this.success = false
      this.error = dataProfile.response.error
    } else {
      this.success = false
      this.error = dataProfile.message
    }
    
    // Check if the current route is the same as the current profile route
    const currentRoute = this.$route.fullPath;
    const profileRoute = `/users/${email}`;
    if (currentRoute !== profileRoute) {
      this.$router.push(profileRoute);
    }

    // Fetch the user's posts
    const resPosts = await fetch(`/api/users/${email}/posts`, {
      headers: {
        'Authentication-Token': localStorage.getItem('auth-token'),
      },
    })
    const dataPosts = await resPosts.json()
    console.log(dataPosts)

    if (resPosts.ok) {
      this.posts = dataPosts
     
    } else if (resPosts.status == 401) {
      this.success = false
      this.error = dataPosts.response.error
    } else {
      this.success = false
      this.error = dataPosts.message
    }
    for (const post of this.posts) {
      const isLiked = await this.isLiked(post);
      console.log(isLiked)
      this.$set(this.LikeStatus, post.id, isLiked);
     
    }
    const resFollowers = await fetch(`/api/users/${email}/followers`, {
      headers: {
        'Authentication-Token': localStorage.getItem('auth-token'),
      },
    })
    const dataFollowers = await resFollowers.json()
    console.log(dataFollowers)
  
    if (resFollowers.ok) {
      this.followers = dataFollowers
    } else {
      this.error = dataFollowers.message
      this.success = false
    }
  
    // Fetch the users that the user is following
    const resFollowing = await fetch(`/api/users/${email}/following`, {
      headers: {
        'Authentication-Token': localStorage.getItem('auth-token'),
      },
    })
    const dataFollowing = await resFollowing.json()
    console.log(dataFollowing)
  
    if (resFollowing.ok) {
      this.following = dataFollowing
    } else {
      this.error = dataFollowing.message
      this.success = false
    }
  },

  methods: {async isLiked(post) {
    const res = await fetch(`/api/posts/${post.id}/likes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authentication-Token': localStorage.getItem('auth-token'),
      }
    });
    const data = await res.json();
    console.log(data)
    if (res.ok) {
      let liked = false;
      for (let i = 0; i < data.length; i++) {
        if (data[i].user.email == this.currentUserEmail) {
          liked = true;
          break;
        }
      }
      return liked;
    } else if (res.status == 401) {
      this.$router.push('/');
      store.commit('setAuthToken', null);
    } else {
      console.error(data.message);
    }
  },
  
  async likeUnlike(postObj) {
    if (!postObj || !postObj.id) {
      return;
    }
  
    if (this.LikeStatus[postObj.id]) {
      // Unlike post
      fetch(`/api/posts/${this.currentUserEmail}/${postObj.id}/unlike`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth-token'),
        },
      }).then(() => {
        this.$set(this.LikeStatus, postObj.id, false);
      });
    } else {
      // Like post
      fetch(`/api/posts/${this.currentUserEmail}/${postObj.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth-token'),
        },
      }).then(() => {
        this.$set(this.LikeStatus, postObj.id, true);
      });
    }
  },
  editPost(postObj) {
    const postId = postObj.id;
    this.$router.push({ name: 'edit_post', params: { postId } });
  },
  
  async addComment(post) {
    const text = this.commentText[post.id];
    if (!text) return;
    
    const res = await fetch(`/api/posts/${this.currentUserEmail}/${post.id}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authentication-Token': localStorage.getItem('auth-token'),
      },
      body: JSON.stringify({ text }),
    });
    
    if (res.ok) {
      const data = await res.json();
      post.comments.push(data);
      this.commentText[post.id] = '';
    } else if (res.status === 401) {
      this.$router.push('/');
      store.commit('setAuthToken', null);
    } else {
      console.error(data.message);
    }
  },
  
  async deleteComment(post, comment) {
    const res = await fetch(`/api/posts/${this.currentUserEmail}/${post.id}/delcom/${comment.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authentication-Token': localStorage.getItem('auth-token'),
      },
    });
    
    if (res.ok) {
      post.comments = post.comments.filter(c => c.id !== comment.id);
    } else if (res.status === 401) {
      this.$router.push('/');
      store.commit('setAuthToken', null);
    } else {
      console.error(data.message);
    }
  },
  async deletePost(post) {
    const res = await fetch(`/api/users/${this.currentUserEmail}/posts/${post.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authentication-Token': localStorage.getItem('auth-token'),
      },
    });
    if (res.ok) {
      // Remove the post from the list of posts
      this.posts = this.posts.filter(p => p.id !== post.id);
      // Remove the like status for the post (if it exists)
      if (this.LikeStatus[post.id] !== undefined) {
        this.$delete(this.LikeStatus, post.id);
      }
    } else if (res.status === 401) {
      this.success = false;
      this.error = data.response.error;
      logout();
    } else {
      this.success = false;
      this.error = 'Failed to delete post';
    }
  },
  edituser(profile) {
    const useremail = profile.email;
    this.$router.push({ name: 'editprofile', params: { useremail } });
  },
  
async exportBlogCSV() {
  try {
    const response = await fetch(`/export-csv/${this.currentUserEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'blob' // set response type to blob
    });
    if (response.ok) {
      const csvBlob = await response.blob(); // convert response to blob
      const csvUrl = URL.createObjectURL(csvBlob); // create URL for the blob
      const a = document.createElement('a');
      a.href = csvUrl;
      a.download = `${this.currentUserUsername}_data.csv`; // set desired filename for CSV file
      a.click(); // simulate click on anchor tag to trigger download
      alert('CSV export job started');
    } else {
      alert('Failed to start CSV export job');
    }
  } catch (error) {
    console.error(error);
    alert('Failed to start CSV export job');
  }

}
,  
async exportUserData() {
  try {
    const response = await fetch(`/export-csv-user/${this.currentUserEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: 'blob' // set response type to blob
    });
    if (response.ok) {
      const csvBlob = await response.blob(); // convert response to blob
      const csvUrl = URL.createObjectURL(csvBlob); // create URL for the blob
      const a = document.createElement('a');
      a.href = csvUrl;
      a.download = `${this.currentUserUsername}_data.csv`; // set desired filename for CSV file
      a.click(); // simulate click on anchor tag to trigger download
      alert('User data export job started');
    } else {
      alert('Failed to start user data export job');
    }
  } catch (error) {
    console.error(error);
    alert('Failed to start user data export job');
  }
}
,
    logout() {
      logout();
      this.$router.push('/');
    },
    goToFollowers() {
      this.$router.push(`/users/${this.$route.params.email}/followers`)
    },
    goToFollowing() {
     this.$router.push(`/users/${this.$route.params.email}/following`)
    }
  }
}

export default profile;
