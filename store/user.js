// user section includes 3 major Data-set 
// 1. user profile info can be A.retrieved B.updated C.created
// 2. user wallet transaction can be A.created (charge wallet)  B.retrieved
// 3. number that can be Changed
import Vue from 'vue'
import User from '../middleware/models/user'
export const state = () => ({
  user: {

  }
})

export const getters = {

}

export const mutations = {
  set(state, user) {
    state.user = new User(user)
  },
  clear(state) {
    state.user = {}
  },
  clearTable_uuid(state) {
    state.user.table_uuid = null
  }
  

}

export const actions = {

  retrieve(context) {
    return new Promise((resolve, reject) => {

      this.$api.$get('/api/v1/user-profile/', {
          params: {}
        }).then(res => {
          context.commit('set', res)
          if (res.active_table_uuid) {
            context.commit('cafe/setType', 'pre-order', {
              root: true
            })
            context.commit('table/setToken', {
              token: res.active_table_uuid,
              number: 'پیش سفارش'
            }, {root: true})
            Vue.prototype.$connect()
          }
          resolve(res)
        })

        .catch(err => {
          reject(err)

        })
    })


  },

}
