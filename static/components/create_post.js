
const add_new_post = {
  template: `
    <div>
      <nav class="navbar bg-light">
        <div class="container">
          <h1><span class="navbar-brand mb-0 h1">CREATE NEW POST</span></h1>
        </div>
      </nav>
      <div class="card border-primary mb-3">
        <h3 class="card-header">NEW POST FORM</h3>
        <form enctype="multipart/form-data">
          <div class="card-body">
            <div class="container"> 
              <label>Image : </label>
              <input type="file" name="pic" v-on:change="onFilechange"><br>
              <label>Caption : </label>
              <textarea name="caption" placeholder="Caption" v-model="formData.caption" required></textarea><br>
              <button @click.prevent="createPost">Create Post</button>
            </div>
          </div>
        </form>
        <div v-if="postCreated" class="alert alert-success">
        Post created successfully!
        </div>
        <div class="card-footer">
          <h5>Back to <router-link :to="'/users/' + currentUserEmail">your Profile</router-link></h5>
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
  data() {
    return {
      formData: {
        pic: null,
        caption: ''
      },
      postCreated: false
    }
  },
  computed: {
    currentUserEmail() {
      return this.$store.state.currentUserEmail;
    }
  },
  methods: {
    onFilechange(event) {
      console.log(event)
      this.formData.pic = event.target.files[0];
    },
    async createPost() {
      const formdata = new FormData();
      formdata.append('pic', this.formData.pic);
      formdata.append('caption', this.formData.caption);
    
      const res = await fetch('/api/add_new_post', {
        method: 'POST',
        body: formdata,
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
        }
      });        
    
      if (res.ok) {
        this.postCreated = true
        const data = await res.json();
        console.log(data);
        this.$router.push(`/users/${this.currentUserEmail}`);
      } else {
        console.log('Something went wrong');
      }        
    }
  }
}

export default add_new_post;
