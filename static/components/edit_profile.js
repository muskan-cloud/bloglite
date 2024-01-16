const editProfile = {
    template: `
      <div>
        <nav class="navbar bg-light">
          <div class="container">
            <h1><span class="navbar-brand mb-0 h1">Edit Profile</span></h1>
          </div>
        </nav>
        <div class="card border-primary mb-3">
          <h3 class="card-header">Update Profile</h3>
          <form enctype="multipart/form-data">
          <div class="card-body">
              <div class="container">
                <label>Username:</label>
                <input type="text" name="username" placeholder="Username" v-model="formData.username" required><br>
                <label>Email:</label>
                <input type="text" name="email" placeholder="Email" v-model="formData.email" required><br>
                <label>Profile Picture:</label>
                <input type="file" name="pfp" v-on:change="onFilechange"><br>
                <button @click.prevent="updateProfile">Update Profile</button>
              </div>
            </div>
          </form>
          <div v-if="useredited" class="alert alert-success">
          Details edited successfully!
          </div>
          <div class="card-footer">
            <h5>Back to <router-link :to="'/users/' + currentUserEmail">your profile</router-link></h5>
          </div>
        </div>
      </div>
    `,
    props:['useremail'],
    data() {
      return {
        email:this.useremail,
        formData: {
          username: '',
          email: '',
          pfp: null,
        },
        useredited: false
      };
    },
    computed: {
        currentUserEmail() {
          return this.$store.state.currentUserEmail;
        }
      },
    created() {
      // Get the post ID from the URL parameter
      this.useremail = this.$route.params.useremail;
      // Load the post data
      this.loadProfile();
      },
    methods: {
      onFilechange(event) {
        console.log(event)
        this.formData.pfp = event.target.files[0];
      },
      async loadProfile() {
        const res = await fetch(`/api/users/${this.useremail}/updatedetails`,{
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token')
          }
        });
        if (res.ok) {
          const data = await res.json();
          console.log(data);
          // Set the form data to the post data
          this.formData.username = data.username;
          this.formData.email = data.email;
        } else {
          console.log('Something went wrong');
        }
      },
      
      async updateProfile() {
        // Create a FormData object to handle the file upload
        const formdata = new FormData();
        formdata.append('username', this.formData.username);
        formdata.append('email', this.formData.email);
        formdata.append('pfp', this.formData.pfp);
      
        const res = await fetch(`/api/users/${this.useremail}/updatedetails`, {
          method: 'PUT',
          body: formdata,
          headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('auth_token'),
            
          },
        });
      
        try {
          if (!res.ok) {
            const error = await res.text();
            console.log(error);
            return;
          }
      
          const responseData = await res.json();
          console.log(responseData);
          this.useredited = true;
          this.$router.push(`/users/${this.useremail}`);
        } catch (err) {
          console.log(err);
        }
      }

    }
  }      
  export default editProfile;
  