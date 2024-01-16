const following = {
    template:
    `<div>
      <h2>Following - {{ following.length }}</h2>
      <ul>
        <li v-for="followingObj in following" :key="followingObj.following_id">
          <router-link :to="{ name: 'profile', params: { email: followingObj.user.email } }">{{ followingObj.user.username }}</router-link>
        </li>
      </ul>
    </div>`
  ,
    data: function () {
      return {
        following: []
      }
    },
  
    async mounted(){
      const email= this.$route.params.email;
      // fetch following
      const resfollowing = await fetch(`/api/users/${email}/following`, {
        headers: {
          'Content-Type': 'application/json',
          'Authentication-Token': localStorage.getItem('auth-token'),
        },
      })
      const datafollowing = await resfollowing.json()
      console.log(datafollowing)
  
      if (resfollowing.ok) {
        this.following = datafollowing;
        console.log(this.following);
      } else if (resfollowing.status == 401) {
        this.success = false
        this.error = datafollowing.response.error
      } else {
        this.success = false
        this.error = datafollowing.message
      }
    }
  }
  
  export default following
  