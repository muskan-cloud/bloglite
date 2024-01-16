const followers = {
  template:
  `<div>
    <h2>Followers-{{ followers.length }}</h2>
    <ul>
      <li v-for="followerObj in followers" :key="followerObj.follower_id">
      <router-link :to="{ name: 'profile', params: { email: followerObj.user.email } }">{{ followerObj.user.username }}
      </router-link></li>
    </ul>
  </div>`
,
  data: function () {
    return {
      followers: []
    }
  },

async mounted(){
  const email= this.$route.params.email;
  // fetch followers
  const resfollowers = await fetch(`/api/users/${email}/followers`, {
    headers: {
      'Content-Type': 'application/json',
      'Authentication-Token': localStorage.getItem('auth-token'),
    },
  })
  const datafollowers = await resfollowers.json()
  console.log(datafollowers)

  if (resfollowers.ok) {
    this.followers = datafollowers
  console.log(this.followers)
  } else if (resfollowers.status == 401) {
    this.success = false
    this.error = datafollowers.response.error
  } else {
    this.success = false
    this.error = datafollowers.message
  }
}
}

export default followers
