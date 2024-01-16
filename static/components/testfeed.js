import store from '../store.js'
import { logout } from '/static/app.js';

const feed = {
  template: `
  <div>
  <nav class="navbar bg-light">
      <div class="container" style="display: flex; justify-content: space-between; align-items: center;">
          <div style="text-align: center; flex-grow: 1;">
              <h1 class="navbar-brand mb-0" style="margin-left: 200px;">{{ profile.username }}'s Feed ✨ </h1>
          </div>
          <div>
              <button><router-link :to="{ name: 'profile', params: { email: profile.email } }">your
                      profile</router-link></button>
          </div>
      </div>
  </nav>

  <div>
  <h1>Posts</h1>
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
</div>


  <footer style="display: flex; justify-content: flex-end;">
      <div class="buttons">
          <button><router-link to="/add_new_post">New_post</router-link></button>
          <button><router-link to="/search">Search</router-link></button>
          <button href="/" @click.prevent="logout">Logout</button>
      </div>
  </footer>
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
        currentUserId() {
          return this.$store.state.currentUserId;
        },
        likeStatusArray() {
          return this.posts.map(post => this.LikeStatus[post.id] || false);
        }
      },
      async mounted() {
        const email = this.$route.params.email;
        
        // Fetch the user's profile information
        const resProfile = await fetch(`/api/users/${email}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': localStorage.getItem('auth-token'),
          },
        })
        const dataProfile = await resProfile.json()
        console.log(dataProfile)
    
        if (resProfile.ok) {
          this.profile = dataProfile
          this.$store.commit('setCurrentUser', { 
            id: dataProfile.id,
            username: dataProfile.username,
            email: dataProfile.email
          })
        } else if (resProfile.status == 401) {
          this.success = false
          this.error = dataProfile.response.error
        } else {
          this.success = false
          this.error = dataProfile.message
        }
        const resfeed = await fetch(`/api/feed/${email}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authentication-Token': localStorage.getItem('auth-token'),
            },
          })
          const datafeed = await resfeed.json()
          console.log(datafeed)
      
          if (resfeed.ok) {
            this.posts = datafeed;
            console.log(this.posts);
            }
           else if (resfeed.status == 401) {
            this.success = false
            this.error = datafeed.response.error
          } else {
            this.success = false
            this.error = datafeed.message
            alert(this.error)
          }
          for (const post of this.posts) {
            const isLiked = await this.isLiked(post);
            console.log(isLiked)
            this.$set(this.LikeStatus, post.id, isLiked);
           
          }
        
        },
        
        methods:{
          async isLiked(post) {
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
          editPost(postObj) {
            const postId = postObj.id;
            this.$router.push({ name: 'edit_post', params: { postId } });
          },
           logout() {
                logout();
                this.$router.push('/');
              }
          }
        }
      
        export default feed   
            
