export default ({ store }) => {
  
  if (localStorage.getItem("token") !== null) {
    let token = localStorage.getItem('token')
    const cookieValObject = {'token': `${token}`}
    this.$cookies.set('token', cookieValObject, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })
  }

  let token = this.$cookies.get('token')
  if (token != 'undefined' && token != 'null') store.commit('setToken', token)
  
  // let tableToken = localStorage.getItem('tableToken')
  // if (tableToken != 'undefined' && tableToken != 'null') {
  //   let tableName = localStorage.getItem('tableName')
  //   let table = {
  //     number: tableName,
  //     token: tableToken
  //   }
      
  //   store.commit('table/setToken', table)
  // }
}
// window.onNuxtReady(() => {
//   console.log('Nuxt.js is ready and mounted')
// })