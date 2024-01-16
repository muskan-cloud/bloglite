const edit_post = {
    template: `
      <div>
        <nav class="navbar bg-light">
          <div class="container">
            <h1><span class="navbar-brand mb-0 h1">EDIT POST</span></h1>
          </div>
        </nav>
        <div class="card border-primary mb-3">
          <h3 class="card-header">EDIT POST FORM</h3>
          <form enctype="multipart/form-data">
            <div class="card-body">
              <div class="container"> 
                <label>Image : </label>
                <input type="file" name="pic" v-on:change="onFilechange"><br>
                <label>Caption : </label>
                <textarea name="caption" placeholder="Caption" v-model="formData.caption" required></textarea><br>
                <button @click.prevent="editPost">Save Changes</button>
              </div>
            </div>
          </form>
          <div v-if="postEdited" class="alert alert-success">
          Post edited successfully!
          </div>
          <div class="card-footer">
            <h5>Back to <router-link :to="'/users/' + currentUserEmail">your profile</router-link></h5>
          </div>
        </div>
        <footer>
        <div class="buttons d-flex justify-content-end">
          <button><router-link to="/search">Search</router-link></button>
          <button href="/" @click.prevent="logout">Logout</button>
        </div>
      </footer>
      </div>
    `,
    props: ['postId'],
    data() {
      return {
        id: this.postId,
        formData: {
          pic: null,
          caption: ''
        },
        postEdited: false
      }
    },
    computed: {
      currentUserEmail() {
        return this.$store.state.currentUserEmail;
      }
    },
    created() {
      // Get the post ID from the URL parameter
      this.postId = this.$route.params.postId;
      // Load the post data
      this.loadPost();
    },
    methods: {
      async loadPost() {
        const res = await fetch(`/api/users/${this.currentUserEmail}/updateposts/${this.postId}`, {
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
          }
        });
        if (res.ok) {
          const data = await res.json();
          // Set the form data to the post data
          this.formData.caption = data.caption;
        } else {
          console.log('Something went wrong');
        }
      },
      onFilechange(event) {
        console.log(event)
        this.formData.pic = event.target.files[0];
      },
      async editPost() {
        const formdata = new FormData();
        formdata.append('pic', this.formData.pic);
        formdata.append('caption', this.formData.caption);
      
        const res = await fetch(`/api/users/${this.currentUserEmail}/updateposts/${this.postId}`, { 
          method: 'PUT',
          body: formdata,
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
          }
        });        
      
        if (res.ok) {
          this.postEdited = true
          const data = await res.json();
          console.log(data);
          this.$router.push(`/users/${this.currentUserEmail}`);
        } else {
          console.log('Something went wrong');
        }        
      },
      logout() {
        // Logout the user and redirect to the login page
        this.$store.dispatch('logout');
        this.$router.push('/login');
      }
    }
  }
  
  export default edit_post;
  